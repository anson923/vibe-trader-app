import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { initializeServer, isServerInitialized } from '@/lib/server-init';

// Define types for stock data
interface StockData {
    ticker: string;
    price: number;
    priceChange: number | null;
    priceChangePercentage: number | null;
    source?: string;
    error?: string;
}

// ISR: Cache this data for 60 seconds
export const revalidate = 60;

// Make sure server-side only
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let ticker = searchParams.get('ticker');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '20');

    if (!ticker && !searchParams.has('page')) {
        return NextResponse.json({ error: 'Ticker or page parameter is required' }, { status: 400 });
    }

    // Ensure server has been initialized
    if (!isServerInitialized()) {
        try {
            console.log('Initializing server from stocks API route...');
            await initializeServer();
        } catch (error) {
            console.error('Failed to initialize server during API request:', error);
            // Continue anyway as we'll fall back to database directly
        }
    }

    try {
        // If a ticker is specified, fetch data for that ticker (or list of tickers)
        if (ticker) {
        // Normalize ticker input
        ticker = ticker.toUpperCase().trim();
        let tickers = ticker.split(',').filter(t => t.trim()).map(t => t.trim());

        // Remove duplicates
        tickers = [...new Set(tickers)];

        if (tickers.length === 0) {
            return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
        }

            // Process tickers to get their data from database
        const results: Record<string, StockData> = {};

            // If we need to fetch multiple tickers
            if (tickers.length > 0) {
                // Get all tickers from the database
                const { data, error } = await supabaseAdmin
                    .from('stocks')
                    .select('*')
                    .in('ticker', tickers);

                if (error) {
                    throw error;
                }

                // Map database results to the response format
                if (data && data.length > 0) {
                    for (const stock of data) {
                        results[stock.ticker] = {
                            ticker: stock.ticker,
                            price: stock.price,
                            priceChange: stock.price_change,
                            priceChangePercentage: stock.price_change_percentage,
                            source: 'database'
                        };
                    }
                }

                // Check for missing tickers
                const missingTickers = tickers.filter(t => !results[t]);
                if (missingTickers.length > 0) {
                    console.log(`Tickers not found in database: ${missingTickers.join(', ')}`);
                    
                    // Return what we do have, the background job will fetch missing ones eventually
                    for (const t of missingTickers) {
                            results[t] = {
                                ticker: t,
                            price: 0,
                            priceChange: 0,
                            priceChangePercentage: 0,
                            source: 'not-found',
                            error: 'Stock data not available yet'
                        };
                }
            }
        }

        // If only one ticker was requested, return just that data
        if (tickers.length === 1) {
            return NextResponse.json(results[tickers[0]]);
        }

        return NextResponse.json(results);
        }
        // Otherwise, return paginated list of all stocks
        else {
            // Calculate pagination values
            const offset = (page - 1) * pageSize;
            
            // Fetch paginated data
            const { data, error, count } = await supabaseAdmin
            .from('stocks')
                .select('*', { count: 'exact' })
                .order('ticker')
                .range(offset, offset + pageSize - 1);

        if (error) {
                throw error;
            }
            
            // Map to response format
            const formattedData = data.map(stock => ({
                ticker: stock.ticker,
                price: stock.price,
                priceChange: stock.price_change,
                priceChangePercentage: stock.price_change_percentage,
                updated_at: stock.updated_at
            }));
            
            // Build response with pagination info
            return NextResponse.json({
                data: formattedData,
                pagination: {
                    page,
                    pageSize,
                    total: count || 0,
                    totalPages: count ? Math.ceil(count / pageSize) : 0
                }
            });
        }
    } catch (error) {
        console.error(`Error fetching stock data:`, error instanceof Error ? error.message : String(error));
        return NextResponse.json({ 
            error: 'Failed to fetch stock data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 