import { NextRequest, NextResponse } from 'next/server';
import { 
  getCachedStocks, 
  updateCachedStock, 
  refreshStockData,
  isStockDataStale,
  CachedStock, 
  initializeCache 
} from '@/lib/server-store';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET handler for retrieving cached stocks
export async function GET(request: NextRequest) {
  try {
    // Ensure cache is initialized
    await initializeCache();
    
    // Get query parameters
    const url = new URL(request.url);
    const ticker = url.searchParams.get('ticker');
    const tickers = url.searchParams.get('tickers')?.split(',');
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Check if we need to refresh data
    let refreshedTickers: string[] = [];
    
    // If specific tickers are requested with refresh=true or data is stale,
    // force a refresh from the database
    if (ticker && (forceRefresh || isStockDataStale(ticker))) {
      refreshedTickers = [ticker];
      await refreshStockData(refreshedTickers);
    } else if (tickers && tickers.length > 0) {
      const staleTickers = tickers.filter(t => forceRefresh || isStockDataStale(t));
      if (staleTickers.length > 0) {
        refreshedTickers = staleTickers;
        await refreshStockData(staleTickers);
      }
    }

    // Get stocks from cache (now with potentially refreshed data)
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
        data: stockData,
        refreshed: refreshedTickers.includes(ticker)
      });
    } else if (tickers && tickers.length > 0) {
      // Return multiple stocks by tickers
      filteredStocks = stocks.filter(s => 
        tickers.some(t => t.toLowerCase() === s.ticker.toLowerCase())
      );
    }

    // Return response
    return NextResponse.json({ 
      data: filteredStocks,
      refreshed: refreshedTickers.length > 0
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