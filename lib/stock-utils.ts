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
 */
export function extractStockTickers(content: string): string[] {
    const tickerRegex = /\$([A-Z]{1,5})/g;
    const matches = content.match(tickerRegex);

    if (!matches) return [];

    // Remove the $ symbol and return unique tickers
    return [...new Set(matches.map(match => match.substring(1)))];
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
 * Save stock data to the database
 */
export async function saveStockData(postId: number, stockData: StockData) {
    try {
        const { data, error } = await supabase
            .from('stocks')
            .insert({
                post_id: postId,
                ticker: stockData.ticker,
                price: stockData.price,
                price_change_percentage: stockData.priceChangePercentage || 0
            })
            .select();

        if (error) {
            console.error('Error saving stock data:', error);
            throw error;
        }

        return data;
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
        const { data, error } = await supabase
            .from('stocks')
            .select('*')
            .eq('post_id', postId);

        if (error) {
            console.error('Error fetching stock data for post:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch stock data for post:', error);
        return [];
    }
} 