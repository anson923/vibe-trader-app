import { NextResponse } from 'next/server';
import * as puppeteer from 'puppeteer';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Define types for stock data
interface StockData {
    ticker: string;
    price: number;
    priceChange: number | null;
    priceChangePercentage: number | null;
    source?: string;
    error?: string;
}

interface CacheEntry {
    data: StockData | Record<string, StockData>;
    timestamp: number;
}

// Create a cache to store fetched data
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_TICKERS_PER_REQUEST = 5; // Maximum tickers per batch request

// Maintain a single browser instance to improve performance
let browserInstance: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    console.log('Launching new browser instance');

    // Launch browser with optimized settings for backend use
    browserInstance = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
        ]
    });

    // Handle browser closing
    browserInstance.on('disconnected', () => {
        console.log('Browser instance disconnected');
        browserInstance = null;
    });

    return browserInstance;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let ticker = searchParams.get('ticker');
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    try {
        // Normalize ticker input
        ticker = ticker.toUpperCase().trim();
        let tickers = ticker.split(',').filter(t => t.trim()).map(t => t.trim());

        // Remove duplicates
        tickers = [...new Set(tickers)];

        if (tickers.length === 0) {
            return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
        }

        // Process tickers in batches to balance between performance and reliability
        const results: Record<string, StockData> = {};

        // First, try to get data from the database unless forceRefresh is true
        if (!forceRefresh) {
            for (const t of tickers) {
                const dbData = await getStockDataFromDatabase(t);
                if (dbData) {
                    console.log(`Using database data for ${t}`);
                    results[t] = dbData;
                }
            }
        } else {
            console.log('Force refresh requested, bypassing database cache');
        }

        // Filter out tickers that were successfully retrieved from the database
        const tickersToFetch = tickers.filter(t => !results[t]);

        if (tickersToFetch.length > 0) {
            console.log(`Need to fetch data for: ${tickersToFetch.join(', ')}`);

            // Process in batches of MAX_TICKERS_PER_REQUEST
            for (let i = 0; i < tickersToFetch.length; i += MAX_TICKERS_PER_REQUEST) {
                const tickerBatch = tickersToFetch.slice(i, i + MAX_TICKERS_PER_REQUEST);

                try {
                    // Fetch data for this batch
                    const batchData = await fetchYahooFinanceData(tickerBatch);

                    // Add results to the combined results object
                    Object.keys(batchData).forEach(t => {
                        results[t] = batchData[t];

                        // Save stock data to database
                        try {
                            saveStockToDatabase(batchData[t]);
                        } catch (dbError) {
                            console.error(`Error saving ${t} to database:`, dbError);
                        }
                    });
                } catch (error) {
                    console.error(`Error processing batch ${tickerBatch.join(',')}:`, error);

                    // Use fallback data for failed tickers
                    for (const t of tickerBatch) {
                        if (!results[t]) { // Only use fallback if we don't have data yet
                            const dummyData = generateDummyPrice(t);
                            results[t] = {
                                ticker: t,
                                price: dummyData.price,
                                priceChange: dummyData.change,
                                priceChangePercentage: dummyData.changePercentage,
                                source: 'fallback',
                                error: 'Processing failed'
                            };
                        }
                    }
                }

                // Add delay between batch requests
                if (i + MAX_TICKERS_PER_REQUEST < tickersToFetch.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        // If only one ticker was requested, return just that data
        if (tickers.length === 1) {
            return NextResponse.json(results[tickers[0]]);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error(`Error fetching stock data:`, error instanceof Error ? error.message : String(error));

        // Generate fallback data as last resort
        return generateFallbackResponse(ticker.split(',').filter(t => t.trim()));
    } finally {
        // Browser instance is kept alive for future requests
    }
}

// Get stock data from database if it exists and is fresh
async function getStockDataFromDatabase(ticker: string): Promise<StockData | null> {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('No service role key set, skipping database check');
        return null;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('stocks')
            .select('*')
            .eq('ticker', ticker)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                console.log(`No data found in database for ticker ${ticker}`);
            } else {
                console.error(`Error fetching from database for ticker ${ticker}:`, error);
            }
            return null;
        }

        if (!data) {
            return null;
        }

        // Check if data is fresh (less than 30 minutes old)
        const updatedAt = new Date(data.updated_at);
        const now = new Date();
        const thirtyMinutesAgo = new Date(now.getTime() - CACHE_DURATION);

        if (updatedAt < thirtyMinutesAgo) {
            console.log(`Data for ${ticker} is stale (${updatedAt.toISOString()}), will fetch fresh data`);
            return null; // Data is stale, fetch new data
        }

        // Data is fresh, return it
        return {
            ticker: data.ticker,
            price: data.price,
            priceChange: data.price_change,
            priceChangePercentage: data.price_change_percentage,
            source: 'database'
        };
    } catch (error) {
        console.error(`Error checking database for ticker ${ticker}:`, error);
        return null;
    }
}

// Simplified function to fetch Yahoo Finance data with improved reliability
async function fetchYahooFinanceData(tickers: string[]): Promise<Record<string, StockData>> {
    if (tickers.length === 0) {
        return {};
    }

    const results: Record<string, StockData> = {};
    const tickerSetString = tickers.join(',');

    // Use a single URL format for all cases
    const url = `https://finance.yahoo.com/quotes/${tickerSetString}/`;

    console.log(`Fetching data from Yahoo Finance: ${url}`);

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
        //!!! Please do not change this code.
        browser = await puppeteer.launch();
        page = await browser.newPage();

        // Optimize page settings
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            // Block unnecessary resources to speed up page load
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Navigate to the page with more reliable settings
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // More reliable than networkidle2
            timeout: 60000
        });

        console.log('Page loaded, extracting data...');

        // Wait for stock data elements to be available
        await page.waitForSelector('fin-streamer[data-field="regularMarketPrice"]', {
            timeout: 10000
        }).catch(() => {
            console.log('Warning: fin-streamer elements not found with initial selector');
        });

        // Extract data for each ticker
        for (const ticker of tickers) {
            try {
                // Check if the page contains data for this ticker
                const hasTickerData = await page.evaluate((symbol) => {
                    return !!document.querySelector(`fin-streamer[data-symbol="${symbol}"]`);
                }, ticker);

                if (!hasTickerData) {
                    console.warn(`No data found for ticker ${ticker} on page`);
                    const dummyData = generateDummyPrice(ticker);
                    results[ticker] = {
                        ticker,
                        price: dummyData.price,
                        priceChange: dummyData.change,
                        priceChangePercentage: dummyData.changePercentage,
                        source: 'fallback',
                        error: 'No data found'
                    };
                    continue;
                }

                // Extract all stock data in one evaluation to reduce Puppeteer calls
                const stockData = await page.evaluate((symbol) => {
                    // Get the elements
                    const priceElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketPrice"]`);
                    const changeElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketChange"]`);
                    const percentElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketChangePercent"]`);

                    // Try multiple attribute possibilities - Yahoo Finance sometimes varies in how it stores these values
                    let price = 0;
                    if (priceElement) {
                        // Try different attribute locations where the data might be stored
                        price = parseFloat(priceElement.getAttribute('value') ||
                            priceElement.getAttribute('data-value') ||
                            priceElement.textContent || '0');
                    }

                    let change = 0;
                    if (changeElement) {
                        change = parseFloat(changeElement.getAttribute('value') ||
                            changeElement.getAttribute('data-value') ||
                            changeElement.textContent || '0');
                    }

                    let percent = 0;
                    if (percentElement) {
                        // For percentage, remove the % symbol if present in text content
                        const percentText = percentElement.getAttribute('value') ||
                            percentElement.getAttribute('data-value') ||
                            percentElement.textContent || '0';
                        percent = parseFloat(percentText.replace('%', ''));
                    }

                    return {
                        price: isNaN(price) ? 0 : price,
                        change: isNaN(change) ? 0 : change,
                        percent: isNaN(percent) ? 0 : percent
                    };
                }, ticker);

                // Log raw extracted data for debugging
                console.log(`Raw data for ${ticker}:`, stockData);

                results[ticker] = {
                    ticker,
                    price: stockData.price,
                    priceChange: stockData.change,
                    priceChangePercentage: stockData.percent,
                    source: 'yahoo'
                };

                console.log(`Successfully extracted data for ${ticker}: $${stockData.price} (${stockData.change} / ${stockData.percent}%)`);
            } catch (error) {
                console.error(`Error extracting data for ${ticker}:`, error);

                // Use fallback data for failed tickers
                const dummyData = generateDummyPrice(ticker);
                results[ticker] = {
                    ticker,
                    price: dummyData.price,
                    priceChange: dummyData.change,
                    priceChangePercentage: dummyData.changePercentage,
                    source: 'fallback',
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }

        return results;
    } catch (error) {
        console.error(`Error fetching data from Yahoo Finance:`, error);
        throw error;
    } finally {
        if (page && !page.isClosed()) {
            await page.close().catch(() => { });
        }
        // We keep the browser instance alive for future requests
    }
}

// Helper function to save stock data to database
async function saveStockToDatabase(stockData: StockData) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('No service role key set, skipping database save');
        return null;
    }

    if (!stockData || !stockData.ticker || !stockData.price) {
        console.error('Invalid stock data:', stockData);
        return null;
    }

    try {
        console.log(`Saving stock data for ${stockData.ticker} to database`);

        const currentTimestamp = new Date().toISOString();

        // With the new schema, we only store the stock data without post_id
        const stockRecord = {
            ticker: stockData.ticker,
            price: stockData.price,
            price_change: stockData.priceChange || 0,
            price_change_percentage: stockData.priceChangePercentage || 0,
            updated_at: currentTimestamp
        };

        // Upsert the record (insert if not exists, update if exists)
        const { data, error } = await supabaseAdmin
            .from('stocks')
            .upsert(stockRecord, {
                onConflict: 'ticker'
            });

        if (error) {
            console.error(`Error saving stock data for ${stockData.ticker}:`, error);
            throw error;
        }

        console.log(`Successfully saved stock data for ${stockData.ticker}`);
        return data;
    } catch (error) {
        console.error(`Failed to save stock data for ${stockData.ticker}:`, error);
        return null;
    }
}

// Generate fallback data for a single ticker
function generateDummyPrice(ticker: string) {
    // Use a deterministic algorithm based on the ticker symbol
    const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomPrice = (seed % 1000) + 10; // Price between 10 and 1010
    const changeDirection = (seed % 2) === 0 ? 1 : -1;
    const change = changeDirection * (seed % 10); // Change between -9 and 9
    const changePercentage = (change / randomPrice) * 100;

    return {
        price: Math.round(randomPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercentage: Math.round(changePercentage * 100) / 100
    };
}

// Generate fallback response for multiple tickers
function generateFallbackResponse(tickers: string[]) {
    if (tickers.length === 0) {
        return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
    }

    const results: Record<string, StockData> = {};

    for (const ticker of tickers) {
        const dummyData = generateDummyPrice(ticker);
        results[ticker] = {
            ticker,
            price: dummyData.price,
            priceChange: dummyData.change,
            priceChangePercentage: dummyData.changePercentage,
            source: 'fallback',
            error: 'Error fetching data'
        };
    }

    if (tickers.length === 1) {
        return NextResponse.json(results[tickers[0]]);
    }

    return NextResponse.json(results);
} 