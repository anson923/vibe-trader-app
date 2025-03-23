import { NextRequest, NextResponse } from 'next/server';
import { 
  getCachedStocks, 
  updateCachedStock, 
  CachedStock, 
  initializeCache 
} from '@/lib/server-store';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { initializeServer, isServerInitialized } from '@/lib/server-init';

// Use Incremental Static Regeneration with 60-second revalidation
export const revalidate = 60;

// Make route dynamic to ensure we always revalidate
export const dynamic = 'force-dynamic';

// Specify Node.js runtime to avoid Edge Runtime issues
export const runtime = 'nodejs';

// GET handler for retrieving cached stocks
export async function GET(request: NextRequest) {
  try {
    // Ensure server is initialized
    if (!isServerInitialized()) {
      try {
        console.log('Initializing server from cached-stocks API route...');
        await initializeServer();
      } catch (error) {
        console.error('Failed to initialize server during cached-stocks API request:', error);
        // Continue anyway as we'll try to initialize cache directly
      }
    }

    // Ensure cache is initialized (should have happened during server init)
    await initializeCache();
    
    // Get query parameters
    const url = new URL(request.url);
    const ticker = url.searchParams.get('ticker');
    const tickers = url.searchParams.get('tickers')?.split(',');
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '20');
    
    // Get stocks from cache
    const stocks = getCachedStocks();

    // Apply filters if needed
    let filteredStocks = stocks;
    
    if (ticker) {
      // Return a single stock by ticker
      const stockData = stocks.find(s => s.ticker.toLowerCase() === ticker.toLowerCase());
      if (!stockData) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        data: stockData
      });
    } else if (tickers && tickers.length > 0) {
      // Return multiple stocks by tickers
      filteredStocks = stocks.filter(s => 
        tickers.some(t => t.toLowerCase() === s.ticker.toLowerCase())
      );
    } else {
      // Paginate the results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      filteredStocks = stocks
        .sort((a, b) => a.ticker.localeCompare(b.ticker))
        .slice(startIndex, endIndex);
      
      // Return response with pagination info
      return NextResponse.json({ 
        data: filteredStocks,
        pagination: {
          page,
          pageSize,
          total: stocks.length,
          totalPages: Math.ceil(stocks.length / pageSize)
        }
      });
    }

    // Return filtered stocks list
    return NextResponse.json({ 
      data: filteredStocks
    });
  } catch (error) {
    console.error('Error retrieving cached stocks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stocks' },
      { status: 500 }
    );
  }
}

// POST/PUT handler for updating or creating a stock
export async function POST(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    const stockData = await request.json();

    // Validate request data
    if (!stockData.ticker || stockData.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (ticker or price)' },
        { status: 400 }
      );
    }

    const currentTimestamp = new Date().toISOString();

    // Prepare record for database
    const stockRecord = {
      ticker: stockData.ticker,
      price: stockData.price,
      price_change: stockData.price_change || stockData.priceChange || 0,
      price_change_percentage: stockData.price_change_percentage || stockData.priceChangePercentage || 0,
      updated_at: currentTimestamp
    };

    // Upsert the stock in database
    const { data, error } = await supabaseAdmin
      .from('stocks')
      .upsert(stockRecord, { onConflict: 'ticker' })
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to update stock');
    }

    // Format for cache
    const cachedStock: CachedStock = {
      ticker: data[0].ticker,
      price: data[0].price,
      price_change: data[0].price_change,
      price_change_percentage: data[0].price_change_percentage,
      updated_at: data[0].updated_at
    };

    // Also update the cache
    updateCachedStock(cachedStock);

    return NextResponse.json({ data: cachedStock });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    );
  }
} 