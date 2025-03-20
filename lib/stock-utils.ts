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
 * Fetch stock data for multiple tickers at once
 * @param tickers Array of stock ticker symbols without $ prefix
 * @returns Record of ticker to StockData mappings
 */
export async function fetchMultipleStockData(tickers: string[]): Promise<Record<string, StockData>> {
    if (tickers.length === 0) return {};

    try {
        // Join tickers with commas
        const tickersStr = tickers.join(',');

        // Use our server-side API endpoint to fetch multiple tickers at once
        const response = await fetch(`/api/stocks?ticker=${tickersStr}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`API error for multiple tickers:`, errorData);
            return {};
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching stock data for multiple tickers:`, error);
        return {};
    }
}

/**
 * Update post with stock tickers and save stock data to the database
 */
export async function saveStockData(postId: number, stockData: StockData) {
    try {
        console.log(`Saving stock data for ${stockData.ticker} for post ${postId}`);

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
            console.error('Error saving stock data:', stockError);
            throw stockError;
        }

        console.log(`Successfully saved/updated stock data for ticker ${stockData.ticker}`);

        // Return the saved stock data
        return stockData2;
    } catch (error) {
        console.error('Failed to save stock data:', error);
        throw error;
    }
}

/**
 * Get stored stock data for a post
 */
export async function getStockDataForPost(postId: number) {
    try {
        console.log(`Fetching stock data for post ${postId}`);

        // 1. First get the tickers array from the post
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('tickers')
            .eq('id', postId)
            .single();

        if (postError) {
            console.error(`Error fetching post data for post ${postId}:`, postError);
            throw postError;
        }

        // Make sure tickers is an array
        const tickers = Array.isArray(postData.tickers) ? postData.tickers : [];
        console.log(`Post ${postId} has tickers:`, tickers);

        if (tickers.length === 0) {
            console.log(`No tickers found for post ${postId}`);
            return [];
        }

        // 2. Then get the stock data for each ticker
        const { data: stocksData, error: stocksError } = await supabase
            .from('stocks')
            .select('*')
            .in('ticker', tickers);

        if (stocksError) {
            console.error(`Error fetching stock data for tickers ${tickers.join(', ')}:`, stocksError);
            throw stocksError;
        }

        console.log(`Found ${stocksData.length} stock records for post ${postId}:`, stocksData);

        // Map the database records to the expected format
        const formattedData = stocksData.map(stock => ({
            ticker: stock.ticker,
            price: stock.price,
            priceChange: stock.price_change,
            priceChangePercentage: stock.price_change_percentage
        }));

        console.log(`Formatted stock data for post ${postId}:`, formattedData);

        return formattedData;
    } catch (error) {
        console.error(`Failed to fetch stock data for post ${postId}:`, error);
        return [];
    }
}

/**
 * Get stored stock data for a ticker
 */
export async function getStockDataByTicker(ticker: string) {
    try {
        const { data, error } = await supabase
            .from('stocks')
            .select('*')
            .eq('ticker', ticker)
            .single();

        if (error) {
            console.error(`Error fetching stock data for ticker ${ticker}:`, error);
            return null;
        }

        // Check if data is stale (older than 5 minutes)
        const updatedAt = new Date(data.updated_at);
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (updatedAt < fiveMinutesAgo) {
            return null; // Data is stale, should fetch fresh data
        }

        return {
            ticker: data.ticker,
            price: data.price,
            priceChange: data.price_change,
            priceChangePercentage: data.price_change_percentage
        };
    } catch (error) {
        console.error(`Failed to fetch stock data for ticker ${ticker}:`, error);
        return null;
    }
}

/**
 * Update a post's tickers array directly
 * This can be used if we need to update tickers after post creation
 */
export async function updatePostTickers(postId: number, tickers: string[]) {
    try {
        console.log(`Updating tickers for post ${postId}:`, tickers);

        // Make sure we have unique tickers
        const uniqueTickers = [...new Set(tickers)].sort();

        const { error } = await supabase
            .from('posts')
            .update({ tickers: uniqueTickers })
            .eq('id', postId);

        if (error) {
            console.error(`Error updating tickers for post ${postId}:`, error);
            throw error;
        }

        console.log(`Successfully updated tickers for post ${postId}:`, uniqueTickers);
        return uniqueTickers;
    } catch (error) {
        console.error(`Failed to update tickers for post ${postId}:`, error);
        throw error;
    }
} 