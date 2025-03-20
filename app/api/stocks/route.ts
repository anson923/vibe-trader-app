import { NextResponse } from 'next/server';
import * as puppeteer from 'puppeteer';

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
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
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

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Check if we have this ticker combination in cache
    if (cache.has(ticker)) {
        const cachedData = cache.get(ticker);
        const now = Date.now();
        // Use cached data if it's less than 5 minutes old
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
            console.log(`Using cached data for ${ticker}`);
            return NextResponse.json(cachedData.data);
        }
    }

    try {
        // Format URL for single or multiple tickers
        ticker = ticker.toUpperCase().trim();
        let tickers = ticker.split(',').filter(t => t.trim()).map(t => t.trim());

        // Remove duplicates
        tickers = [...new Set(tickers)];

        if (tickers.length === 0) {
            return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
        }

        // Process tickers in batches to balance between performance and reliability
        const results: Record<string, StockData> = {};

        // Process in batches of MAX_TICKERS_PER_REQUEST
        for (let i = 0; i < tickers.length; i += MAX_TICKERS_PER_REQUEST) {
            const tickerBatch = tickers.slice(i, i + MAX_TICKERS_PER_REQUEST);
            const batchKey = tickerBatch.join(',');

            console.log(`Processing ticker batch: ${batchKey}`);

            // Check if we have this batch in cache
            if (cache.has(batchKey)) {
                const cachedData = cache.get(batchKey);
                const now = Date.now();
                if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
                    console.log(`Using cached data for batch ${batchKey}`);
                    if (typeof cachedData.data === 'object' && !Array.isArray(cachedData.data)) {
                        if ('ticker' in cachedData.data) {
                            // Single ticker data
                            const singleData = cachedData.data as StockData;
                            results[singleData.ticker] = singleData;
                        } else {
                            // Record of tickers
                            const recordData = cachedData.data as Record<string, StockData>;
                            Object.keys(recordData).forEach(t => {
                                if (tickerBatch.includes(t)) {
                                    results[t] = recordData[t];
                                }
                            });
                        }
                    }
                    continue;
                }
            }

            try {
                // Fetch data for this batch 
                const batchData = await fetchYahooFinanceData(tickerBatch);

                // Add results to the combined results object
                Object.keys(batchData).forEach(t => {
                    results[t] = batchData[t];
                });

                // Cache this batch result
                cache.set(batchKey, {
                    data: batchData,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error(`Error processing batch ${batchKey}:`, error);

                // Use fallback data for all tickers in the batch
                for (const t of tickerBatch) {
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

            // Add delay between batch requests
            if (i + MAX_TICKERS_PER_REQUEST < tickers.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Cache the combined results
        cache.set(ticker, {
            data: results,
            timestamp: Date.now()
        });

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

// Simplified function to fetch Yahoo Finance data with improved reliability
async function fetchYahooFinanceData(tickers: string[]): Promise<Record<string, StockData>> {
    if (tickers.length === 0) {
        return {};
    }

    const results: Record<string, StockData> = {};
    const tickerStr = tickers.join(',');

    // Format URL exactly as specified
    const url = `https://finance.yahoo.com/quotes/${tickerStr}/${tickerStr}/`;
    console.log(`Fetching data from Yahoo Finance: ${url}`);

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
        // Get or create browser instance
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

                // Extract price, change and percentage data
                const tickerData = await page.evaluate((symbol) => {
                    const priceElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketPrice"]`);
                    const changeElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketChange"]`);
                    const percentElement = document.querySelector(`fin-streamer[data-symbol="${symbol}"][data-field="regularMarketChangePercent"]`);

                    const price = priceElement ? priceElement.getAttribute('data-value') : null;
                    const change = changeElement ? changeElement.getAttribute('data-value') : null;
                    const percent = percentElement ? percentElement.getAttribute('data-value') : null;

                    return { price, change, percent };
                }, ticker);

                if (tickerData.price) {
                    const price = parseFloat(tickerData.price);

                    // Format change to 2 decimal places
                    let priceChange = null;
                    if (tickerData.change) {
                        priceChange = parseFloat(parseFloat(tickerData.change).toFixed(2));
                    }

                    // Format percentage to 2 decimal places
                    let priceChangePercentage = null;
                    if (tickerData.percent) {
                        priceChangePercentage = parseFloat(parseFloat(tickerData.percent).toFixed(2));
                    }

                    results[ticker] = {
                        ticker,
                        price,
                        priceChange,
                        priceChangePercentage
                    };

                    console.log(`Successfully extracted data for ${ticker}: $${price} (${priceChange}, ${priceChangePercentage}%)`);
                } else {
                    console.warn(`Failed to extract price data for ${ticker}`);
                    const dummyData = generateDummyPrice(ticker);
                    results[ticker] = {
                        ticker,
                        price: dummyData.price,
                        priceChange: dummyData.change,
                        priceChangePercentage: dummyData.changePercentage,
                        source: 'fallback',
                        error: 'Extraction failed'
                    };
                }
            } catch (error) {
                console.error(`Error extracting data for ${ticker}:`, error);
                const dummyData = generateDummyPrice(ticker);
                results[ticker] = {
                    ticker,
                    price: dummyData.price,
                    priceChange: dummyData.change,
                    priceChangePercentage: dummyData.changePercentage,
                    source: 'fallback',
                    error: 'Error during extraction'
                };
            }
        }
    } catch (error) {
        console.error('Error in Yahoo Finance data fetch:', error);
        throw error;
    } finally {
        // Close the page but keep browser instance alive
        if (page) {
            await page.close().catch(err => console.error('Error closing page:', err));
        }
    }

    return results;
}

// Generate fallback response with dummy data
function generateFallbackResponse(tickers: string[]) {
    const results: Record<string, StockData> = {};

    for (const ticker of tickers) {
        // Generate dummy data based on ticker name
        const dummyData = generateDummyPrice(ticker);

        results[ticker] = {
            ticker,
            price: dummyData.price,
            priceChange: dummyData.change,
            priceChangePercentage: dummyData.changePercentage,
            source: 'fallback'
        };
    }

    // If only one ticker was requested, return just that data
    if (tickers.length === 1) {
        return NextResponse.json(results[tickers[0]]);
    }

    return NextResponse.json(results);
}

// Fallback function to generate consistent dummy prices based on the ticker
function generateDummyPrice(ticker: string): { price: number, change: number, changePercentage: number } {
    // Use the ticker string to generate a somewhat consistent "price"
    let hash = 0;
    for (let i = 0; i < ticker.length; i++) {
        hash = ((hash << 5) - hash) + ticker.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }

    // Generate price between $10 and $500
    const price = Math.abs(hash % 490) + 10;

    // Generate change between -5% and +5%
    const changePercentage = ((hash % 1000) / 100) - 5;

    // Calculate absolute change based on price and percentage
    const change = price * (changePercentage / 100);

    return {
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercentage: Math.round(changePercentage * 100) / 100
    };
} 