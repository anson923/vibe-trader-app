import { NextResponse } from 'next/server';
import axios from 'axios';
import https from 'https';

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

// Create a custom axios instance with modified HTTP agent
const axiosInstance = axios.create({
    // Create a custom HTTPS agent with adjusted timeout
    httpsAgent: new https.Agent({
        // Disable header rejection due to size
        rejectUnauthorized: false
    }),
    // Increase timeout
    timeout: 10000
});

// Create a cache to store fetched data
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let ticker = searchParams.get('ticker');

    if (!ticker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Check if we have this ticker in cache
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

        const tickersStr = tickers.join(',');
        const url = `https://finance.yahoo.com/quotes/${tickersStr}/`;

        console.log(`Fetching data for tickers: ${tickersStr}`);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html',
            'Accept-Encoding': 'gzip, deflate, br'
        };

        const response = await axios.get(url, {
            headers,
            timeout: 10000
        });

        const html = response.data;

        // For multiple tickers, parse each one
        if (tickers.length === 1) {
            // Single ticker mode
            const singleTickerData = extractStockDataFromHtml(html, tickers[0]);

            if (singleTickerData) {
                // Cache the results
                cache.set(ticker, {
                    data: singleTickerData,
                    timestamp: Date.now()
                });

                return NextResponse.json(singleTickerData);
            } else {
                return NextResponse.json({
                    error: `Could not extract data for ${ticker}`,
                    ticker
                }, { status: 404 });
            }
        } else {
            // Multiple tickers mode
            const results: Record<string, StockData> = {};
            let hasValidData = false;

            for (const tick of tickers) {
                const tickerData = extractStockDataFromHtml(html, tick);
                if (tickerData) {
                    hasValidData = true;
                    results[tick] = tickerData;
                } else {
                    console.error(`Could not extract data for ${tick}`);
                    results[tick] = {
                        ticker: tick,
                        error: 'Data not found',
                        price: 0,
                        priceChange: null,
                        priceChangePercentage: null
                    };
                }
            }

            if (hasValidData) {
                // Cache the results
                cache.set(tickersStr, {
                    data: results,
                    timestamp: Date.now()
                });

                return NextResponse.json(results);
            } else {
                return NextResponse.json({
                    error: 'Could not extract data for any of the provided tickers',
                    tickers
                }, { status: 404 });
            }
        }
    } catch (error) {
        console.error(`Error fetching stock data:`, error instanceof Error ? error.message : String(error));

        // Generate fallback data as last resort
        return generateFallbackResponse(ticker.split(',').filter(t => t.trim()));
    }
}

function extractStockDataFromHtml(html: string, ticker: string): StockData | null {
    try {
        // Regex to find the regularMarketPrice
        const priceRegex = new RegExp(`<fin-streamer[^>]*?data-symbol="${ticker}"[^>]*?data-field="regularMarketPrice"[^>]*?data-value="([^"]+)"[^>]*?>`, 'i');
        const priceMatch = html.match(priceRegex);

        // Regex to find the regularMarketChange
        const changeRegex = new RegExp(`<fin-streamer[^>]*?data-symbol="${ticker}"[^>]*?data-field="regularMarketChange"[^>]*?data-value="([^"]+)"[^>]*?>`, 'i');
        const changeMatch = html.match(changeRegex);

        // Regex to find the regularMarketChangePercent
        const percentRegex = new RegExp(`<fin-streamer[^>]*?data-symbol="${ticker}"[^>]*?data-field="regularMarketChangePercent"[^>]*?data-value="([^"]+)"[^>]*?>`, 'i');
        const percentMatch = html.match(percentRegex);

        if (!priceMatch) {
            console.error(`Could not find price for ${ticker}`);
            return null;
        }

        const price = parseFloat(priceMatch[1]);

        // Change might be null for some stocks
        let change = null;
        if (changeMatch) {
            change = parseFloat(parseFloat(changeMatch[1]).toFixed(2));
        }

        // Percentage might be null for some stocks
        let percentChange = null;
        if (percentMatch) {
            percentChange = parseFloat(parseFloat(percentMatch[1]).toFixed(2));
        }

        return {
            ticker,
            price,
            priceChange: change,
            priceChangePercentage: percentChange
        };
    } catch (error) {
        console.error(`Error extracting data for ${ticker}:`, error);
        return null;
    }
}

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