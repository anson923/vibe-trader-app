import axios from 'axios';
import { supabase } from './supabase';

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
 * @param ticker Stock ticker symbol without $ prefix
 */
export async function fetchStockData(ticker: string) {
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
 * Save stock data to the database
 */
export async function saveStockData(postId: number, stockData: { ticker: string, price: number, priceChangePercentage: number }) {
    try {
        const { data, error } = await supabase
            .from('stocks')
            .insert({
                post_id: postId,
                ticker: stockData.ticker,
                price: stockData.price,
                price_change_percentage: stockData.priceChangePercentage
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