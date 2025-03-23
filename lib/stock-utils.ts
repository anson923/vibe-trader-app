import { supabase } from './supabase';

// Define types for stock data
interface StockData {
    ticker: string;
    price: number;
    priceChange: number | null;
    priceChangePercentage: number | null;
    source?: string;
    error?: string;
}

// Client-side in-memory caches
const postStockCache: Record<number, {
  data: any[];
  timestamp: number;
}> = {};

const tickerStockCache: Record<string, {
  data: any;
  timestamp: number;
}> = {};

const multiStockCache: Record<string, {
  data: any[];
  timestamp: number;
}> = {};

// Log level control
let LOG_LEVEL = 'error'; // Possible values: 'verbose', 'info', 'warn', 'error', 'none'

// Custom logging functions with log level control
const logger = {
  verbose: (message: string, ...args: any[]) => {
    if (['verbose'].includes(LOG_LEVEL)) {
      console.log(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (['verbose', 'info'].includes(LOG_LEVEL)) {
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (['verbose', 'info', 'warn'].includes(LOG_LEVEL)) {
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (['verbose', 'info', 'warn', 'error'].includes(LOG_LEVEL)) {
      console.error(message, ...args);
    }
  },
  // Enable all logs temporarily (for debugging)
  enableVerbose: () => { LOG_LEVEL = 'verbose'; },
  // Default level - only errors
  enableErrorOnly: () => { LOG_LEVEL = 'error'; },
  // Disable all logs
  disableAll: () => { LOG_LEVEL = 'none'; },
  // Enable info level
  enableInfo: () => { LOG_LEVEL = 'info'; },
};

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL

/**
 * Extract stock tickers from post content
 * Looks for $SYMBOL pattern in the text
 * Returns array of unique ticker symbols without the $ prefix, in alphabetical order
 */
export function extractStockTickers(content: string): string[] {
    const tickerRegex = /\$([A-Z]{1,5})/g;
    const matches = content.match(tickerRegex);

    if (!matches) return [];

    // Remove the $ symbol, ensure uniqueness with Set, and sort alphabetically
    const uniqueTickers = [...new Set(matches.map(match => match.substring(1)))];

    // Sort alphabetically for consistent order
    return uniqueTickers.sort();
}

/**
 * Fetch stock data using the server-side API
 * @param ticker Stock ticker symbol without $ prefix (can be multiple tickers separated by commas)
 */
export async function fetchStockData(ticker: string): Promise<StockData | null> {
    try {
        // Use our server-side API endpoint to avoid CORS issues
        const response = await fetch(`/api/stocks?ticker=${ticker}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`API error for ${ticker}:`, errorData);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching stock data for ${ticker}:`, error);
        return null;
    }
}

/**
 * Check if current time is within US market hours
 * Market hours are 9:30 AM to 4:00 PM ET (14:30 to 21:00 UTC)
 * Returns an object with isOpen status and reason if closed
 */
export function getMarketStatus(): { isOpen: boolean; reason?: string } {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 6 is Saturday
  
  // Weekend check
  if (dayOfWeek === 0) {
    return { isOpen: false, reason: 'WEEKEND_SUNDAY' };
  }
  
  if (dayOfWeek === 6) {
    return { isOpen: false, reason: 'WEEKEND_SATURDAY' };
  }
  
  // US holidays (could be expanded with a more complete list)
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed
  const date = now.getUTCDate();
  
  // Check for common US market holidays
  // New Year's Day (or observed day)
  if (month === 0 && date === 1) {
    return { isOpen: false, reason: 'HOLIDAY_NEW_YEARS_DAY' };
  }
  
  // Martin Luther King Jr. Day (third Monday in January)
  if (month === 0 && dayOfWeek === 1 && date >= 15 && date <= 21) {
    return { isOpen: false, reason: 'HOLIDAY_MLK_DAY' };
  }
  
  // Presidents Day (third Monday in February)
  if (month === 1 && dayOfWeek === 1 && date >= 15 && date <= 21) {
    return { isOpen: false, reason: 'HOLIDAY_PRESIDENTS_DAY' };
  }
  
  // Good Friday (would need more complex calculation - simplified)
  // Memorial Day (last Monday in May)
  if (month === 4 && dayOfWeek === 1 && date >= 25 && date <= 31) {
    return { isOpen: false, reason: 'HOLIDAY_MEMORIAL_DAY' };
  }
  
  // Juneteenth (June 19)
  if (month === 5 && date === 19) {
    return { isOpen: false, reason: 'HOLIDAY_JUNETEENTH' };
  }
  
  // Independence Day (July 4, or observed day)
  if (month === 6 && date === 4) {
    return { isOpen: false, reason: 'HOLIDAY_INDEPENDENCE_DAY' };
  }
  
  // Labor Day (first Monday in September)
  if (month === 8 && dayOfWeek === 1 && date <= 7) {
    return { isOpen: false, reason: 'HOLIDAY_LABOR_DAY' };
  }
  
  // Thanksgiving Day (fourth Thursday in November)
  if (month === 10 && dayOfWeek === 4 && date >= 22 && date <= 28) {
    return { isOpen: false, reason: 'HOLIDAY_THANKSGIVING' };
  }
  
  // Christmas Day (December 25, or observed day)
  if (month === 11 && date === 25) {
    return { isOpen: false, reason: 'HOLIDAY_CHRISTMAS' };
  }
  
  // Convert current time to minutes since midnight UTC
  const currentTimeInMinutes = utcHour * 60 + utcMinutes;
  
  // Market opens at 14:30 UTC (9:30 AM ET) and closes at 21:00 UTC (4:00 PM ET)
  const marketOpenInMinutes = 14 * 60 + 30;
  const marketCloseInMinutes = 21 * 60;
  
  if (currentTimeInMinutes < marketOpenInMinutes) {
    return { isOpen: false, reason: 'BEFORE_MARKET_HOURS' };
  }
  
  if (currentTimeInMinutes >= marketCloseInMinutes) {
    return { isOpen: false, reason: 'AFTER_MARKET_HOURS' };
  }
  
  return { isOpen: true };
}

/**
 * Check if current time is within US market hours
 * Simplified version that just returns boolean
 */
export function isMarketOpen(): boolean {
  return getMarketStatus().isOpen;
}

/**
 * Get a human-readable explanation for why market is closed
 */
export function getMarketClosedReason(): string {
  const { isOpen, reason } = getMarketStatus();
  
  if (isOpen) {
    return 'Market is open';
  }
  
  // Return human-readable explanations
  switch (reason) {
    case 'WEEKEND_SATURDAY':
      return 'Market is closed for weekend (Saturday)';
    case 'WEEKEND_SUNDAY':
      return 'Market is closed for weekend (Sunday)';
    case 'BEFORE_MARKET_HOURS':
      return 'Market is closed - before trading hours (opens 9:30 AM ET)';
    case 'AFTER_MARKET_HOURS':
      return 'Market is closed - after trading hours (closes 4:00 PM ET)';
    case 'HOLIDAY_NEW_YEARS_DAY':
      return 'Market is closed for New Year\'s Day holiday';
    case 'HOLIDAY_MLK_DAY':
      return 'Market is closed for Martin Luther King Jr. Day holiday';
    case 'HOLIDAY_PRESIDENTS_DAY':
      return 'Market is closed for Presidents Day holiday';
    case 'HOLIDAY_MEMORIAL_DAY':
      return 'Market is closed for Memorial Day holiday';
    case 'HOLIDAY_JUNETEENTH':
      return 'Market is closed for Juneteenth holiday';
    case 'HOLIDAY_INDEPENDENCE_DAY':
      return 'Market is closed for Independence Day holiday';
    case 'HOLIDAY_LABOR_DAY':
      return 'Market is closed for Labor Day holiday';
    case 'HOLIDAY_THANKSGIVING':
      return 'Market is closed for Thanksgiving holiday';
    case 'HOLIDAY_CHRISTMAS':
      return 'Market is closed for Christmas holiday';
    default:
      return 'Market is closed';
  }
}

/**
 * Check if stock data needs refresh based on:
 * 1. Age of data (>15 minutes)
 * 2. Whether market is currently open
 * If market is closed, we can use older data since prices won't change
 */
export function isStockDataStale(updatedAt: Date | string): boolean {
  // Convert to Date object if string is passed
  const updatedAtDate = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  
  // Check if data is older than 15 minutes
  const now = new Date();
  const ageInMinutes = Math.floor((now.getTime() - updatedAtDate.getTime()) / (60 * 1000));
  
  // If data is fresh (less than 15 minutes old), it's not stale
  if (ageInMinutes < 15) {
    return false;
  }
  
  // If data is older than 15 minutes, check if market is open
  // Only consider data stale during market hours
  return isMarketOpen();
}

/**
 * Get stored stock data for a ticker
 * Uses cached API with fallback to direct Supabase query
 * No longer checks for stale data as server background job handles updates
 * Implements client-side caching to prevent duplicate fetches
 */
export async function getStockDataByTicker(ticker: string) {
    try {
        // Check client-side cache first
        const now = Date.now();
        const cachedData = tickerStockCache[ticker];
        
        if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
            logger.verbose(`Using cached stock data for ticker ${ticker} (${((now - cachedData.timestamp) / 1000).toFixed(1)}s old)`);
            return cachedData.data;
        }
        
        logger.verbose(`Fetching stock data for ticker ${ticker} (using server-managed cache, no refresh checks)`);
        
        // First try to get the stock from cached API
        try {
            const response = await fetch(`/api/cached-stocks?ticker=${ticker}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch stock from cached API: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.data) {
                const stockData = result.data;
                
                // Just log the "freshness" of the data but don't take action
                const updatedAt = new Date(stockData.updated_at);
                const ageInMinutes = Math.floor((now - updatedAt.getTime()) / (60 * 1000));
                
                // Check if data is stale considering market hours
                const isStale = isStockDataStale(updatedAt);
                
                if (ageInMinutes > 15) {
                    if (isStale) {
                        logger.verbose(`Stock data for ${ticker} is ${ageInMinutes} minutes old (server worker will refresh soon)`);
                    } else {
                        logger.verbose(`Stock data for ${ticker} is ${ageInMinutes} minutes old but market is closed, no refresh needed`);
                    }
                } else {
                    logger.verbose(`Stock data for ${ticker} is fresh (${ageInMinutes} minutes old)`);
                }
                
                const formattedData = {
                    ticker: stockData.ticker,
                    price: stockData.price,
                    priceChange: stockData.price_change,
                    priceChangePercentage: stockData.price_change_percentage
                };
                
                // Store in client-side cache
                tickerStockCache[ticker] = {
                    data: formattedData,
                    timestamp: now
                };
                
                return formattedData;
            }
        } catch (cacheError) {
            logger.warn(`Failed to fetch stock from cached API, falling back to direct query:`, cacheError);
            // Continue to fallback
        }
        
        // FALLBACK: Direct Supabase query if cached API fails
        const { data, error } = await supabase
            .from('stocks')
            .select('*')
            .eq('ticker', ticker)
            .single();

        if (error) {
            logger.error(`Error fetching stock data for ticker ${ticker}:`, error);
            return null;
        }

        // Log data age but don't force refresh - server worker handles updates
        const updatedAt = new Date(data.updated_at);
        const ageInMinutes = Math.floor((now - updatedAt.getTime()) / (60 * 1000));
        
        logger.verbose(`Stock data for ${ticker} is ${ageInMinutes > 15 ? `${ageInMinutes} minutes old (server worker will refresh soon)` : 'fresh'}`);
        
        const formattedData = {
            ticker: data.ticker,
            price: data.price,
            priceChange: data.price_change,
            priceChangePercentage: data.price_change_percentage
        };
        
        // Store in client-side cache
        tickerStockCache[ticker] = {
            data: formattedData,
            timestamp: now
        };
        
        return formattedData;
    } catch (error) {
        logger.error(`Failed to fetch stock data for ticker ${ticker}:`, error);
        return null;
    }
}

/**
 * Fetch multiple stock data items by their tickers
 * Uses cached stocks API with no refresh forcing
 * Implements client-side caching to prevent duplicate fetches
 */
export async function fetchMultipleStockData(tickers: string[]) {
    if (!tickers || tickers.length === 0) {
        logger.warn('No tickers provided to fetchMultipleStockData');
        return [];
    }
    
    try {
        // Generate a cache key based on the sorted unique tickers
        const uniqueTickers = [...new Set(tickers)].sort();
        const cacheKey = uniqueTickers.join(',');
        
        // Check client-side cache first
        const now = Date.now();
        const cachedData = multiStockCache[cacheKey];
        
        if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
            logger.verbose(`Using cached data for multiple tickers: ${cacheKey} (${((now - cachedData.timestamp) / 1000).toFixed(1)}s old)`);
            return cachedData.data;
        }
        
        logger.verbose(`Fetching data for multiple tickers: ${uniqueTickers.join(", ")} (using server-managed cache, no refresh)`);
        
        const tickersParam = uniqueTickers.join(',');
        
        const response = await fetch(`/api/cached-stocks?tickers=${tickersParam}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch stock data: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.data) {
            logger.error('No data returned from API for tickers:', uniqueTickers);
            return [];
        }
        
        const formattedData = result.data.map((stock: any) => ({
            ticker: stock.ticker,
            price: stock.price,
            priceChange: stock.price_change,
            priceChangePercentage: stock.price_change_percentage
        }));
        
        // Store in client-side cache
        multiStockCache[cacheKey] = {
            data: formattedData,
            timestamp: now
        };
        
        return formattedData;
    } catch (error) {
        logger.error('Error in fetchMultipleStockData:', error);
        return [];
    }
}

/**
 * Update post with stock tickers and save stock data to the database
 */
export async function saveStockData(postId: number, stockData: StockData) {
    try {
        logger.info(`Saving stock data for ${stockData.ticker} for post ${postId}`);

        // Save/update the stock data in the stocks table (without post_id)
        const stockRecord = {
            ticker: stockData.ticker,
            price: stockData.price,
            price_change: stockData.priceChange || 0,
            price_change_percentage: stockData.priceChangePercentage || 0,
            updated_at: new Date().toISOString()
        };

        // Upsert the stock record - if it exists, update it; if not, insert it
        const { data: stockData2, error: stockError } = await supabase
            .from('stocks')
            .upsert(stockRecord, { onConflict: 'ticker' })
            .select();

        if (stockError) {
            logger.error('Error saving stock data:', stockError);
            throw stockError;
        }

        logger.info(`Successfully saved/updated stock data for ticker ${stockData.ticker}`);

        // Return the saved stock data
        return stockData2;
    } catch (error) {
        logger.error('Failed to save stock data:', error);
        throw error;
    }
}

/**
 * Get stored stock data for a post
 * Uses cached API endpoints with fallback to direct Supabase queries
 * Implements client-side caching to prevent duplicate fetches
 */
export async function getStockDataForPost(postId: number) {
    try {
        // Check client-side cache first
        const now = Date.now();
        const cachedData = postStockCache[postId];
        
        if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
            logger.verbose(`Using cached stock data for post ${postId} (${((now - cachedData.timestamp) / 1000).toFixed(1)}s old)`);
            return cachedData.data;
        }
        
        logger.info(`Fetching stock data for post ${postId}`);

        // 1. First try to get the post from cached API
        try {
            const postResponse = await fetch(`/api/cached-posts?id=${postId}`);
            
            if (!postResponse.ok) {
                throw new Error(`Failed to fetch post from cached API: ${postResponse.statusText}`);
            }
            
            const postResult = await postResponse.json();
            
            if (postResult.data && Array.isArray(postResult.data) && postResult.data.length > 0) {
                const postData = postResult.data[0];
                
                // Make sure tickers is an array
                const tickers = Array.isArray(postData.tickers) ? postData.tickers : [];
                logger.verbose(`Post ${postId} has tickers:`, tickers);
                
                if (tickers.length === 0) {
                    logger.verbose(`No tickers found for post ${postId}`);
                    return [];
                }
                
                // 2. Then try to get the stock data from cached API
                try {
                    const stocksResponse = await fetch(`/api/cached-stocks?tickers=${tickers.join(',')}`);
                    
                    if (!stocksResponse.ok) {
                        throw new Error(`Failed to fetch stocks from cached API: ${stocksResponse.statusText}`);
                    }
                    
                    const stocksResult = await stocksResponse.json();
                    
                    if (stocksResult.data && Array.isArray(stocksResult.data)) {
                        const stocksData = stocksResult.data;
                        logger.verbose(`Found ${stocksData.length} stock records for post ${postId}`);
                        
                        // Map the records to the expected format
                        const formattedData = stocksData.map((stock: { 
                            ticker: string; 
                            price: number; 
                            price_change: number; 
                            price_change_percentage: number;
                        }) => ({
                            ticker: stock.ticker,
                            price: stock.price,
                            priceChange: stock.price_change,
                            priceChangePercentage: stock.price_change_percentage
                        }));
                        
                        logger.verbose(`Formatted stock data for post ${postId}`);
                        
                        // Store in client-side cache
                        postStockCache[postId] = {
                            data: formattedData,
                            timestamp: Date.now()
                        };
                        
                        return formattedData;
                    }
                } catch (stocksError) {
                    logger.warn(`Failed to fetch stocks from cached API, falling back to direct query:`, stocksError);
                    // Continue to fallback
                }
            }
        } catch (postError) {
            logger.warn(`Failed to fetch post from cached API, falling back to direct query:`, postError);
            // Continue to fallback
        }
        
        // FALLBACK: Direct Supabase queries if cached API fails
        
        // 1. First get the tickers array from the post
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('tickers')
            .eq('id', postId)
            .single();

        if (postError) {
            logger.error(`Error fetching post data for post ${postId}:`, postError);
            throw postError;
        }

        // Make sure tickers is an array
        const tickers = Array.isArray(postData.tickers) ? postData.tickers : [];
        logger.verbose(`Post ${postId} has tickers:`, tickers);

        if (tickers.length === 0) {
            logger.verbose(`No tickers found for post ${postId}`);
            return [];
        }

        // 2. Then get the stock data for each ticker
        const { data: stocksData, error: stocksError } = await supabase
            .from('stocks')
            .select('*')
            .in('ticker', tickers);

        if (stocksError) {
            logger.error(`Error fetching stock data for tickers ${tickers.join(', ')}:`, stocksError);
            throw stocksError;
        }

        logger.verbose(`Found ${stocksData.length} stock records for post ${postId}`);

        // Map the database records to the expected format
        const formattedData = stocksData.map((stock: { 
            ticker: string; 
            price: number; 
            price_change: number; 
            price_change_percentage: number;
        }) => ({
            ticker: stock.ticker,
            price: stock.price,
            priceChange: stock.price_change,
            priceChangePercentage: stock.price_change_percentage
        }));

        logger.verbose(`Formatted stock data for post ${postId}`);
        
        // Store in client-side cache
        postStockCache[postId] = {
            data: formattedData,
            timestamp: Date.now()
        };

        return formattedData;
    } catch (error) {
        logger.error(`Failed to fetch stock data for post ${postId}:`, error);
        return [];
    }
}

/**
 * Update a post's tickers array directly
 * This can be used if we need to update tickers after post creation
 */
export async function updatePostTickers(postId: number, tickers: string[]) {
    try {
        logger.info(`Updating tickers for post ${postId}:`, tickers);

        // Make sure we have unique tickers
        const uniqueTickers = [...new Set(tickers)].sort();

        const { error } = await supabase
            .from('posts')
            .update({ tickers: uniqueTickers })
            .eq('id', postId);

        if (error) {
            logger.error(`Error updating tickers for post ${postId}:`, error);
            throw error;
        }

        logger.info(`Successfully updated tickers for post ${postId}:`, uniqueTickers);
        return uniqueTickers;
    } catch (error) {
        logger.error(`Failed to update tickers for post ${postId}:`, error);
        throw error;
    }
}

// Export type for log levels
export type LogLevel = 'verbose' | 'info' | 'warn' | 'error' | 'none';

// Utility function to set log level based on environment
export function setLogLevel(level: LogLevel): void {
  LOG_LEVEL = level;
  if (level !== 'none') {
    logger.info(`Log level set to: ${level}`);
  }
}

// Debug utility function to temporarily enable verbose logs 
// for a specific operation, then restore previous level
export async function withVerboseLogs<T>(operation: () => Promise<T>): Promise<T> {
  const previousLevel = LOG_LEVEL;
  LOG_LEVEL = 'verbose';
  
  try {
    return await operation();
  } finally {
    LOG_LEVEL = previousLevel;
  }
}

// Override console log level - set to error-only by default
logger.enableErrorOnly();

// Export the logger for external use
export { logger }; 