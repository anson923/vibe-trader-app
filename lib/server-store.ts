import { supabaseAdmin } from './supabase-admin';

// Define types for cached data
export interface CachedPost {
  id: number;
  user_id: string;
  content: string;
  username: string;
  avatar_url: string;
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  comments_count: number;
  tickers?: string[];
}

export interface CachedStock {
  ticker: string;
  price: number;
  price_change: number | null;
  price_change_percentage: number | null;
  updated_at: string;
}

// Create a singleton store using JavaScript module pattern
// Since this is a server component, this state will be maintained on the server
// and shared across all users of the application

// Define our store type
type ServerStore = {
  posts: CachedPost[];
  stocks: CachedStock[];
  isInitialized: boolean;
};

// Use a module-level variable instead of global for better typing
let serverStore: ServerStore = {
  posts: [],
  stocks: [],
  isInitialized: false,
};

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Function to initialize the cache
export async function initializeCache(): Promise<void> {
  // Only run on server and initialize once
  if (!isServer || serverStore.isInitialized) {
    return;
  }

  console.log('Initializing server cache...');

  try {
    // Fetch posts (up to 250)
    await fetchAndCachePosts();
    
    // Fetch stocks (up to 250)
    await fetchAndCacheStocks();
    
    serverStore.isInitialized = true;
    
    console.log(`Server cache initialized with ${serverStore.posts.length} posts and ${serverStore.stocks.length} stocks`);
  } catch (error) {
    console.error('Failed to initialize server cache:', error);
    throw error;
  }
}

// Helper function to fetch and cache posts
async function fetchAndCachePosts(): Promise<void> {
  if (!isServer) return;

  let allPosts: CachedPost[] = [];
  const pageSize = 25; // Fetch 25 posts per page
  const maxPages = 10; // Up to 10 pages (total 250 posts max)
  
  try {
    for (let page = 0; page < maxPages; page++) {
      const { data, error, count } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allPosts = [...allPosts, ...data];
        console.log(`Cached ${data.length} posts from page ${page + 1}`);
        
        // If we fetched fewer posts than the page size, we've reached the end
        if (data.length < pageSize || !count || allPosts.length >= count) {
          break;
        }
      } else {
        // No more posts to fetch
        break;
      }
    }

    // Update the store
    serverStore.posts = allPosts;
    
    console.log(`Total cached posts: ${allPosts.length}`);
  } catch (error) {
    console.error('Error caching posts:', error);
    throw error;
  }
}

// Helper function to fetch and cache stocks
async function fetchAndCacheStocks(): Promise<void> {
  if (!isServer) return;

  let allStocks: CachedStock[] = [];
  const pageSize = 25; // Fetch 25 stocks per page
  const maxPages = 10; // Up to 10 pages (total 250 stocks max)
  
  try {
    for (let page = 0; page < maxPages; page++) {
      const { data, error, count } = await supabaseAdmin
        .from('stocks')
        .select('*', { count: 'exact' })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Convert to CachedStock format
        const stocksData: CachedStock[] = data.map(stock => ({
          ticker: stock.ticker,
          price: stock.price,
          price_change: stock.price_change,
          price_change_percentage: stock.price_change_percentage,
          updated_at: stock.updated_at
        }));
        
        allStocks = [...allStocks, ...stocksData];
        console.log(`Cached ${stocksData.length} stocks from page ${page + 1}`);
        
        // If we fetched fewer stocks than the page size, we've reached the end
        if (data.length < pageSize || !count || allStocks.length >= count) {
          break;
        }
      } else {
        // No more stocks to fetch
        break;
      }
    }

    // Update the store
    serverStore.stocks = allStocks;
    
    console.log(`Total cached stocks: ${allStocks.length}`);
  } catch (error) {
    console.error('Error caching stocks:', error);
    throw error;
  }
}

// API to get posts from cache
export function getCachedPosts(): CachedPost[] {
  return serverStore.posts;
}

// API to get stocks from cache
export function getCachedStocks(): CachedStock[] {
  return serverStore.stocks;
}

// API to add or update a post in the cache
export function updateCachedPost(post: CachedPost): void {
  if (!isServer) return;

  const postIndex = serverStore.posts.findIndex(p => p.id === post.id);
  
  if (postIndex >= 0) {
    // Update existing post
    serverStore.posts[postIndex] = post;
  } else {
    // Add new post to the beginning (most recent)
    serverStore.posts.unshift(post);
  }
}

// API to add or update a stock in the cache
export function updateCachedStock(stock: CachedStock): void {
  if (!isServer) return;

  const stockIndex = serverStore.stocks.findIndex(s => s.ticker === stock.ticker);
  
  if (stockIndex >= 0) {
    // Update existing stock
    serverStore.stocks[stockIndex] = stock;
  } else {
    // Add new stock
    serverStore.stocks.push(stock);
  }
}

// API to remove a post from the cache
export function removeCachedPost(postId: number): void {
  if (!isServer) return;
  
  console.log(`Removing post ${postId} from cache`);
  
  // Filter out the post with the specified ID
  serverStore.posts = serverStore.posts.filter(post => post.id !== postId);
  
  console.log(`Post ${postId} removed, cache now has ${serverStore.posts.length} posts`);
}

// Function to refresh stock data for specific tickers
export async function refreshStockData(tickers: string[]): Promise<CachedStock[]> {
  if (!isServer || tickers.length === 0) return [];
  
  console.log(`Refreshing stock data for tickers: ${tickers.join(', ')}`);
  
  try {
    // Fetch fresh data from Supabase
    const { data, error } = await supabaseAdmin
      .from('stocks')
      .select('*')
      .in('ticker', tickers);
      
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log(`No stock data found for tickers: ${tickers.join(', ')}`);
      return [];
    }
    
    // Update the cache with fresh data
    const refreshedStocks: CachedStock[] = [];
    
    for (const stock of data) {
      const cachedStock: CachedStock = {
        ticker: stock.ticker,
        price: stock.price,
        price_change: stock.price_change,
        price_change_percentage: stock.price_change_percentage,
        updated_at: stock.updated_at
      };
      
      // Update the cache
      updateCachedStock(cachedStock);
      refreshedStocks.push(cachedStock);
    }
    
    console.log(`Successfully refreshed ${refreshedStocks.length} stocks in cache`);
    return refreshedStocks;
  } catch (error) {
    console.error('Error refreshing stock data:', error);
    return [];
  }
}

// Initialize cache if we're on the server
if (isServer) {
  initializeCache().catch(err => {
    console.error('Failed to initialize cache on import:', err);
  });
} 