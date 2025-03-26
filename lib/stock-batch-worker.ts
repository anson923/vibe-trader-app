import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import * as puppeteer from 'puppeteer';
import { isStockDataStale, isMarketOpen, getMarketClosedReason } from './stock-utils';
import * as cron from 'node-cron';

// Define types for stock data
interface StockData {
    ticker: string;
    price: number;
    priceChange: number | null;
    priceChangePercentage: number | null;
    source?: string;
    error?: string;
}

// Main variables
let isRunning = false;
let browserInstance: puppeteer.Browser | null = null;
let stockList: string[] = [];
const BATCH_SIZE = 10; // Number of tickers to process in a batch
const BATCH_DELAY = 1000; // Delay between batches in ms
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

// Job lock mechanism
let jobIsRunning = false;
let cronJobs: cron.ScheduledTask[] = [];

// Feature flag to control stock update cron jobs
let ENABLE_STOCK_UPDATES = true; // Default is enabled

/**
 * Enable or disable stock updates
 * @param enable Boolean to enable or disable stock updates
 */
export function setStockUpdatesEnabled(enabled: boolean): void {
    const previousState = ENABLE_STOCK_UPDATES;
    ENABLE_STOCK_UPDATES = enabled;
    console.log(`Stock updates ${enabled ? 'enabled' : 'disabled'} (previous state: ${previousState ? 'enabled' : 'disabled'})`);
}

/**
 * Check if stock updates are enabled
 */
export function isStockUpdatesEnabled(): boolean {
    return ENABLE_STOCK_UPDATES;
}

// Hardcoded list of top 200 stocks and ETFs
// This avoids file system operations that aren't supported in Edge Runtime
const TOP_STOCKS_AND_ETFS = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "GOOG", "META", "TSLA", "BRK-B", "LLY",
    "V", "JPM", "UNH", "XOM", "MA", "AVGO", "PG", "HD", "CVX", "MRK",
    "ORCL", "COST", "CRM", "ABBV", "KO", "PEP", "TMO", "ACN", "WMT", "JNJ",
    "DIS", "PFE", "ADBE", "LIN", "BAC", "CMCSA", "TXN", "NEE", "UPS", "AMD",
    "LOW", "MCD", "PM", "HON", "IBM", "DHR", "SCHD", "COP", "NKE", "INTC",
    "CAT", "VZ", "TMUS", "AMGN", "BA", "SPY", "QQQ", "IWM", "DIA", "VTI",
    "VOO", "XLK", "XLE", "XLF", "XLV", "XLY", "XLP", "XLI", "XLB", "XLRE",
    "XLU", "VNQ", "IYR", "EEM", "VEA", "AGG", "TLT", "GLD", "SLV", "USO",
    "GDX", "ARKG", "ARKK", "SOXL", "TQQQ", "UPRO", "UDOW", "FNGU", "TECL", "LABU",
    "WEBL", "REMX", "CURE", "SMH", "XBI", "IBB", "MJ", "TAN", "PBW", "ICLN",
    "LIT", "KWEB", "FXI", "EWZ", "EWY", "EWC", "EWA", "EWG", "EWH", "EWI",
    "EWJ", "EWL", "EWM", "EWN", "EWO", "EWP", "EWQ", "EWS", "EWT",
    "EWU", "EWW", "EWX", "EWY", "EWZ", "VTV", "VUG", "VIG", "VYM", "VEU",
    "VXUS", "BND", "BSV", "IEF", "LQD", "HYG", "JNK", "SHV", "BIL", "SPAB",
    "MUB", "TIP", "DBC", "GSG", "PDBC", "UNG", "URA", "WOOD", "HURA", "REM",
    "PALL", "SILJ", "GDXJ", "XOP", "OIH", "KRE", "PKW", "ITA", "XAR", "DFEN",
    "PPA", "ROBO", "IHAK", "SNSR", "CLOU", "SKYY", "FDN", "XT", "SOCL", "HERO",
    "ESPO", "ARKW", "ARKQ", "ARKF", "PRNT", "IZRL", "HAIL", "DRIV", "ACES", "QCLN",
    "FAN", "CNRG", "SMOG", "GRID", "LIT", "COPX", "REMX", "SIL", "SLVP", "PPLT",
    "SIVR", "GLDM", "IAU", "PHYS", "PSLV", "SGOL", "DBE", "CRBN", "GRN", "SUSL",
    "ESGU", "VEGN", "CTEC", "YOLO", "MSOS", "TOKE", "CNBS", "MJUS", "KARS", "EVX",
    "FIVG", "ONLN", "IBUY", "FINX", "ARKX", "MOON", "BLOK", "LEGR", "BFIT", "GENE"
];

/**
 * Load stock tickers list
 */
async function loadTickersFromFile(): Promise<string[]> {
    try {
        // Just return the hardcoded list instead of reading from file
        return TOP_STOCKS_AND_ETFS;
    } catch (error) {
        console.error('Error loading stock list:', error);
        return [];
    }
}

/**
 * Get browser instance
 */
async function getBrowser(): Promise<puppeteer.Browser> {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    console.log('Launching new browser instance for batch worker');

    // Launch browser with optimized settings
    browserInstance = await puppeteer.launch({
        headless: true, // Use headless mode
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1920,1080'
        ],
        timeout: 60000 // 60 seconds launch timeout
    });

    // Handle browser disconnection
    browserInstance.on('disconnected', () => {
        console.log('Browser instance disconnected');
        browserInstance = null;
    });

    return browserInstance;
}

/**
 * Fetch stock data for a batch of tickers with retry logic
 */
async function fetchBatchStockData(tickers: string[], retryCount = 0): Promise<Record<string, StockData>> {
    if (tickers.length === 0) return {};

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 5000; // 5 seconds between retries

    const results: Record<string, StockData> = {};
    const tickerSetString = tickers.join(',');
    const url = `https://finance.yahoo.com/quotes/${tickerSetString}/`;

    console.log(`Batch worker fetching data for: ${tickerSetString}${retryCount > 0 ? ` (retry ${retryCount}/${MAX_RETRIES})` : ''}`);

    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

    try {
        browser = await puppeteer.launch();
        page = await browser.newPage();

        // Set a longer timeout for navigation
        await page.setDefaultNavigationTimeout(60000); // 60 seconds

        // Set user agent to appear more like a regular browser
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Optimize page settings
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            // Block unnecessary resources
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Navigate to the page with more conservative settings
        await page.goto(url, {
            waitUntil: 'domcontentloaded', // Less strict than networkidle2
            timeout: 60000 // 60 seconds
        });

        // Wait for the price elements to be present with longer timeout
        await page.waitForSelector('fin-streamer[data-symbol]', { timeout: 30000 });

        // Extract data
        const stockDataItems = await page.evaluate(() => {
            const dataItems: Record<string, { price: number; change: number | null; changePercent: number | null }> = {};

            // Get all stock containers with data-symbol attribute
            const stockElements = document.querySelectorAll('fin-streamer[data-symbol]');

            stockElements.forEach((element) => {
                const symbol = element.getAttribute('data-symbol');
                if (!symbol) return;

                // Initialize if not already
                if (!dataItems[symbol]) {
                    dataItems[symbol] = {
                        price: 0,
                        change: null,
                        changePercent: null
                    };
                }

                // Extract data based on field name
                const field = element.getAttribute('data-field');
                const value = parseFloat(element.textContent?.replace(/[^\d.-]/g, '') || '0');

                if (field === 'regularMarketPrice') {
                    dataItems[symbol].price = value;
                } else if (field === 'regularMarketChange') {
                    dataItems[symbol].change = value;
                } else if (field === 'regularMarketChangePercent') {
                    dataItems[symbol].changePercent = value;
                }
            });

            return dataItems;
        });

        // Check if we got valid data
        let validDataFound = false;
        let missingTickers: string[] = [];

        // Process the extracted data
        for (const ticker of tickers) {
            const dataItem = stockDataItems[ticker];

            if (dataItem && !isNaN(dataItem.price) && dataItem.price > 0) {
                validDataFound = true;
                results[ticker] = {
                    ticker,
                    price: dataItem.price,
                    priceChange: dataItem.change,
                    priceChangePercentage: dataItem.changePercent,
                    source: 'yahoo-finance'
                };
            } else {
                // Log the missing ticker but don't add an entry
                console.log(`No valid data found for ticker: ${ticker}`);
                missingTickers.push(ticker);
            }
        }

        // If we didn't get any valid data, and we haven't exceeded retries, try again
        if (!validDataFound && retryCount < MAX_RETRIES) {
            console.log(`No valid data found for any tickers in batch. Retrying...`);

            // Close resources before retry
            if (page) await page.close().catch(() => { });

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

            // Retry with incremented counter
            return fetchBatchStockData(tickers, retryCount + 1);
        }

        // If we've exhausted retries or have some valid data, add placeholder entries for missing tickers
        if (retryCount >= MAX_RETRIES && missingTickers.length > 0) {
            console.log(`After ${MAX_RETRIES} retries, creating placeholder data for ${missingTickers.length} tickers that couldn't be fetched`);

            for (const ticker of missingTickers) {
                results[ticker] = {
                    ticker,
                    price: 0,
                    priceChange: 0,
                    priceChangePercentage: 0,
                    source: 'placeholder-after-failure',
                    error: `Failed to fetch after ${MAX_RETRIES} retries`
                };
            }
        }

    } catch (error) {
        console.error(`Error fetching batch stock data:`, error);

        // Retry logic for errors
        if (retryCount < MAX_RETRIES) {
            console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES} after error`);

            // Clean up resources
            if (page) await page.close().catch(() => { });

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

            // Retry with incremented counter
            return fetchBatchStockData(tickers, retryCount + 1);
        } else {
            // All retries failed, use the fallback method
            console.log('All puppeteer attempts failed, using fallback API method');
            const fallbackResults = await fetchStockDataFallback(tickers);

            // Check if fallback also failed, then create placeholder entries
            for (const ticker of tickers) {
                if (!fallbackResults[ticker]) {
                    console.log(`Both puppeteer and fallback failed for ${ticker}, creating placeholder`);
                    results[ticker] = {
                        ticker,
                        price: 0,
                        priceChange: 0,
                        priceChangePercentage: 0,
                        source: 'failed-all-methods',
                        error: 'Failed to fetch data from all sources'
                    };
                } else {
                    // Merge any results from fallback
                    results[ticker] = fallbackResults[ticker];
                }
            }
        }
    } finally {
        if (page) {
            await page.close().catch(() => { });
        }
    }

    return results;
}

/**
 * Save stock data to database
 */
async function saveStocksToDatabase(stocksData: Record<string, StockData>): Promise<void> {
    // If no data, do nothing
    if (Object.keys(stocksData).length === 0) return;

    try {
        const currentTimestamp = new Date().toISOString();

        // Create array of records for batch upsert
        const stockRecords = Object.values(stocksData).map(stock => ({
            ticker: stock.ticker,
            price: stock.price || 0,
            price_change: stock.priceChange || 0,
            price_change_percentage: stock.priceChangePercentage || 0,
            updated_at: currentTimestamp,
            fetch_error: stock.error || null
        }));

        // Use supabaseAdmin to bypass RLS policies
        const { data, error } = await supabaseAdmin
            .from('stocks')
            .upsert(stockRecords, { onConflict: 'ticker' })
            .select();

        if (error) {
            console.error('Error saving stocks to database:', error);
            return;
        }

        // Count placeholder entries
        const placeholders = stockRecords.filter(record => record.price === 0).length;
        if (placeholders > 0) {
            console.log(`Saved ${stockRecords.length} stocks to database (including ${placeholders} placeholders for failed fetches)`);
        } else {
            console.log(`Successfully saved ${stockRecords.length} stocks to database`);
        }
    } catch (error) {
        console.error('Error saving stocks to database:', error);
    }
}

/**
 * Fetch stock data fallback
 */
async function fetchStockDataFallback(tickers: string[]): Promise<Record<string, StockData>> {
    const results: Record<string, StockData> = {};

    console.log(`Using fallback API method for tickers: ${tickers.join(',')}`);

    try {
        // Use Yahoo Finance query2 API (simpler, more reliable but less data)
        const symbols = tickers.join(',');
        const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Process the result
        if (data?.quoteResponse?.result) {
            for (const quote of data.quoteResponse.result) {
                if (quote.symbol && quote.regularMarketPrice) {
                    results[quote.symbol] = {
                        ticker: quote.symbol,
                        price: quote.regularMarketPrice,
                        priceChange: quote.regularMarketChange || 0,
                        priceChangePercentage: quote.regularMarketChangePercent || 0,
                        source: 'yahoo-api-fallback'
                    };
                }
            }

            // Check for tickers that weren't found in the API response
            for (const ticker of tickers) {
                if (!results[ticker]) {
                    console.log(`Ticker ${ticker} not found in fallback API response, creating placeholder`);
                    results[ticker] = {
                        ticker,
                        price: 0,
                        priceChange: 0,
                        priceChangePercentage: 0,
                        source: 'not-found-fallback',
                        error: 'Ticker not found in fallback API'
                    };
                }
            }
        } else {
            // Handle case where API returns no results at all
            console.error('Fallback API returned no results');
            for (const ticker of tickers) {
                results[ticker] = {
                    ticker,
                    price: 0,
                    priceChange: 0,
                    priceChangePercentage: 0,
                    source: 'fallback-api-failed',
                    error: 'Fallback API returned no results'
                };
            }
        }
    } catch (error) {
        console.error('Error in fallback API fetch:', error);
        // If fallback completely fails, still return something for each ticker
        for (const ticker of tickers) {
            if (!results[ticker]) {
                results[ticker] = {
                    ticker,
                    price: 0,
                    priceChange: 0,
                    priceChangePercentage: 0,
                    source: 'fallback-api-error',
                    error: `Fallback API error: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        }
    }

    return results;
}

/**
 * Process all stocks that need updates
 * This now includes a lock mechanism to prevent overlapping executions
 */
async function processAllStocks() {
    // Skip if updates are disabled via feature flag
    if (!isStockUpdatesEnabled()) {
        console.log('Stock updates skipped: feature flag is disabled');
        return;
    }

    // Check if market is open
    if (!isMarketOpen()) {
        console.log('Stock updates skipped: market is closed');
        return;
    }

    // Proceed with update if market is open and feature flag is enabled
    console.log('Starting stock update process (market open, updates enabled)');

    // Skip if another job is already running
    if (jobIsRunning) {
        console.log('Stock update job is already running, skipping this execution');
        return;
    }

    try {
        // Set the lock
        jobIsRunning = true;
        console.log('Starting stock market data update job');

        // Check if market is currently open before processing
        if (!isMarketOpen()) {
            console.log(`Market is currently closed: ${getMarketClosedReason()}`);
            console.log('Skipping stock updates until market opens');
            return; // Skip all updates when market is closed
        } else {
            console.log('Market is currently open, proceeding with updates');
        }

        // Load stock tickers from file
        const allTickers = await loadTickersFromFile();

        if (!allTickers || allTickers.length === 0) {
            console.warn('No tickers found in ticker file, skipping stock update');
            return;
        }

        console.log(`Loaded ${allTickers.length} tickers from ticker file`);

        // Check which stocks need updating (expired after 15 minutes)
        const { data: currentStocks } = await supabaseAdmin
            .from('stocks')
            .select('ticker, updated_at')
            .in('ticker', allTickers);

        // Create a map for quick lookup
        const stockMap = new Map();
        currentStocks?.forEach(stock => {
            stockMap.set(stock.ticker, new Date(stock.updated_at));
        });

        // Determine which tickers are expired considering market hours
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

        console.log(`Current time (UTC): ${now.toISOString()}`);
        console.log(`Expiration threshold (UTC): ${fifteenMinutesAgo.toISOString()}`);

        const expiredTickers = [];
        const validTickers = [];

        for (const ticker of allTickers) {
            const lastUpdated = stockMap.get(ticker);

            // If stock doesn't exist, we need to fetch it
            if (!lastUpdated) {
                console.log(`Ticker ${ticker} not found in database, will fetch`);
                expiredTickers.push(ticker);
            } else {
                // Log the comparison to help debug
                const millisSinceUpdate = now.getTime() - lastUpdated.getTime();
                const minutesSinceUpdate = Math.floor(millisSinceUpdate / (60 * 1000));

                // Check if data is older than 15 minutes
                if (lastUpdated < fifteenMinutesAgo) {
                    console.log(`Ticker ${ticker} expired - last updated ${minutesSinceUpdate} minutes ago at ${lastUpdated.toISOString()}`);
                    expiredTickers.push(ticker);
                } else {
                    console.log(`Ticker ${ticker} still valid - last updated ${minutesSinceUpdate} minutes ago`);
                    validTickers.push(ticker);
                }
            }
        }

        if (validTickers.length > 0) {
            console.log(`Skipping ${validTickers.length} valid tickers: ${validTickers.join(', ')}`);
        }

        if (expiredTickers.length === 0) {
            console.log('All tickers are still valid, no updates needed');
            return;
        }

        console.log(`Processing ${expiredTickers.length} expired tickers in batches of ${BATCH_SIZE}`);

        // Process in batches to avoid rate limiting
        for (let i = 0; i < expiredTickers.length; i += BATCH_SIZE) {
            const batchTickers = expiredTickers.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(expiredTickers.length / BATCH_SIZE)}: ${batchTickers.join(', ')}`);

            await processBatch(batchTickers);

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < expiredTickers.length) {
                console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }

        console.log('Completed batch stock update process');
    } catch (error) {
        console.error('Error in processAllStocks:', error);
    } finally {
        // Always release the lock when done
        jobIsRunning = false;
        console.log('Stock update job completed, lock released');
    }
}

/**
 * Clean up resources when server is shutting down
 */
async function cleanup(): Promise<void> {
    if (browserInstance) {
        console.log('Closing browser instance during cleanup');
        await browserInstance.close().catch(() => { });
        browserInstance = null;
    }

    // Stop all cron jobs
    if (cronJobs.length > 0) {
        console.log(`Stopping ${cronJobs.length} cron jobs during cleanup`);
        cronJobs.forEach(job => job.stop());
        cronJobs = [];
    }
}

/**
 * Initialize the worker
 * Now uses cron instead of setInterval
 */
export async function startStockWorker(): Promise<void> {
    // Skip initialization if feature flag is disabled
    if (!ENABLE_STOCK_UPDATES) {
        console.log('Stock updates are disabled via feature flag, skipping worker initialization');
        return;
    }

    // Load stock list on initialization
    stockList = await loadTickersFromFile();
    console.log(`Initialized stock worker with ${stockList.length} tickers`);

    // Run once immediately
    await processAllStocks();

    // Set up cron job to run every 15 minutes during US market hours
    // Runs only Monday-Friday during market hours (14:30-21:00 UTC)
    const regularUpdateJob = cron.schedule('*/15 14-20 * * 1-5', async () => {
        // Skip if feature flag is disabled
        if (!ENABLE_STOCK_UPDATES) {
            console.log('Stock updates are disabled via feature flag, skipping scheduled update');
            return;
        }

        // Check if we're within market hours (14:30-21:00 UTC)
        const now = new Date();
        const utcHour = now.getUTCHours();
        const utcMinute = now.getUTCMinutes();

        // Skip if before market open at 14:30 UTC
        if (utcHour === 14 && utcMinute < 30) {
            console.log('Before market hours (opens at 14:30 UTC), skipping update');
            return;
        }

        // Skip if at or after market close at 21:00 UTC
        if (utcHour >= 21) {
            console.log('After market hours (closes at 21:00 UTC), skipping update');
            return;
        }

        console.log(`Cron triggered stock update at ${now.toUTCString()}`);
        await processAllStocks();
    });

    // Additional cron job specifically for 14:30 UTC to catch market open exactly
    const marketOpenJob = cron.schedule('30 14 * * 1-5', async () => {
        // Skip if feature flag is disabled
        if (!ENABLE_STOCK_UPDATES) {
            console.log('Stock updates are disabled via feature flag, skipping market open update');
            return;
        }

        console.log('Market open time reached, running stock update');
        await processAllStocks();
    });

    // Store both jobs for proper management
    cronJobs = [regularUpdateJob, marketOpenJob];

    console.log('Stock worker scheduled to run via cron:');
    console.log('- Every 15 minutes on weekdays during market hours (14:30-21:00 UTC)');
    console.log('- At market open (14:30 UTC) on weekdays');
}

export function stopStockWorker(): void {
    // Stop all cron jobs
    if (cronJobs.length > 0) {
        console.log(`Stopping ${cronJobs.length} scheduled stock update jobs`);
        cronJobs.forEach(job => job.stop());
        cronJobs = [];
    }

    cleanup().catch(err => {
        console.error('Error during worker cleanup:', err);
    });
}

/**
 * Process a batch of stock tickers
 * Fetches data for the batch and saves to database
 */
async function processBatch(batchTickers: string[]) {
    try {
        // Fetch data for this batch
        const batchData = await fetchBatchStockData(batchTickers);

        // Save to database
        await saveStocksToDatabase(batchData);

        return batchData;
    } catch (error) {
        console.error(`Error processing batch of tickers: ${batchTickers.join(', ')}`, error);
        throw error;
    }
} 