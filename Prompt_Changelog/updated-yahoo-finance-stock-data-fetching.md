# Update Yahoo Finance Stock Data Fetching

## Changes Made

1. **Improved Database Caching**
   - Changed the caching duration from 5 minutes to 30 minutes
   - Added database checks before fetching from Yahoo Finance
   - Implemented stale data detection based on the `updated_at` timestamp
   - Only fetches from Yahoo Finance if data doesn't exist or is older than 30 minutes

2. **Standardized URL Format**
   - Uses a single URL format for all requests: `https://finance.yahoo.com/quotes/tickerSetString/`
   - Where `tickerSetString` is a comma-separated list of tickers (e.g., "AAPL,MSFT,NVDA")
   - Simplifies implementation while ensuring proper HTML structure parsing

3. **Enhanced Data Extraction**
   - Improved the way stock prices, price changes, and percentages are extracted
   - Uses the `value` attribute of `fin-streamer` elements for more accurate data
   - Better handling of numerical values with proper parsing

4. **Better Error Handling and Fallbacks**
   - Only fetches tickers that aren't available in the database
   - Provides proper fallback data for tickers that fail to fetch
   - Maintains browser instance between requests for better performance

5. **Improved Stock Record Management**
   - Preserves existing `post_id` when updating stock records
   - Better distinction between insert and update operations

## How It Works

1. When a request for stock data comes in, the system first checks the database for each ticker.
2. If a ticker exists in the database and its data is fresh (less than 30 minutes old), that data is used.
3. If data doesn't exist or is stale, the system fetches fresh data from Yahoo Finance.
4. The URL format is adapted based on whether we're fetching a single ticker or multiple tickers.
5. The fetched data is saved to the database for future use.
6. In case of errors, the system provides fallback data to ensure the UI doesn't break.

## Testing

To test these changes:

1. Create a post with a stock ticker (e.g., `$AAPL` or `$NVD`)
2. Verify that the stock data appears correctly in the UI
3. Create another post with the same ticker and verify it uses cached data
4. Wait 30+ minutes and create another post to verify it fetches fresh data

## Troubleshooting

If you encounter issues:

1. Check that the stocks table exists and has the correct schema
2. Ensure your `.env.local` has the correct Supabase URL and service role key
3. Check the browser console for any errors related to stock data fetching
4. Verify that the database has proper RLS policies for the stocks table 