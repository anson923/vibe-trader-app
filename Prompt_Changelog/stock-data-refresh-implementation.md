# Stock Data Refresh Implementation

> Fix an issue where, if new posts have symbols that the table has but it needs to update, the post will be using cached data which is not correct. If the cached stock data is expired, then when creating a post, wait for database table update and Next.js backend stock array update, then use the new data in array to show on feed page.

## Overview

This implementation addresses an issue where posts with stock symbols were using potentially outdated cached data. The solution ensures that when creating posts with stock symbols, the application checks if the cached data is stale and forces a refresh to get the latest stock prices before displaying the data.

## Changes Made

### 1. Added Staleness Detection for Stock Data

- Added `isStockDataStale()` function in `lib/server-store.ts` to check if cached stock data is older than a specified threshold (default: 15 minutes)
- Implemented logic to identify which stock symbols need refreshing

### 2. Implemented Selective Refresh Capability

- Added `refreshStockData()` function to force a refresh of stock data from the database
- Updated the cached-stocks API to support a `refresh=true` parameter that bypasses the cache
- Modified the post creation process to only refresh stock data that is stale, not all data

### 3. Enhanced Stock API Integration

- Modified the `/api/stocks` endpoint to support forced refreshes
- Added a `forceRefresh` parameter to `fetchMultipleStockData()` to control whether to force refreshes
- Updated the post creation process to selectively refresh stale stock symbols

### 4. Improved Post Creation Flow

- Modified the `processStockTickers()` function to check which tickers need refreshing instead of forcing refresh for all
- Added explicit staleness check that respects the 15-minute cache window
- Added better error handling and fallbacks for when refreshes fail

## How It Works

### Stock Data Refresh Flow

The system follows this exact flow:

1. When a user creates a post with stock symbols (e.g., `$AAPL`, `$MSFT`), the application extracts these symbols from the content.

2. The system checks if each stock's data is expired (older than 15 minutes):

   - For each ticker, it checks if it exists in the cache and when it was last updated
   - If within 15 minutes, it uses the cached data without refreshing
   - If expired or missing, it marks the ticker for refresh from Yahoo Finance

3. Only for stale tickers, the system:

   - Fetches fresh data from Yahoo Finance
   - Updates the Supabase database
   - Updates the Next.js backend cache specifically for those tickers
   - Adds a small delay to ensure processing completes

4. After selective refreshing, the post creation process continues:
   - It fetches the stock data using `fetchMultipleStockData()` with `forceRefresh=false`
   - This ensures it uses the already refreshed data without forcing another refresh
   - The updated stock data is used for the new post
   - When displayed on the feed or detailed post page, the latest stock prices are shown

### Staleness Detection

The system determines if stock data is stale by:

- Checking if the ticker exists in the cache
- Comparing the `updated_at` timestamp to the current time
- Considering data older than 15 minutes as stale

### Cache Management

- The server-side cache is maintained for performance
- Only stale data (older than 15 minutes) is refreshed, fresh data is reused
- The cache is selectively updated with the latest data for stocks that need it

## Benefits

- **Accuracy**: Posts always display the most recent stock prices at the time of creation
- **Efficiency**: Only refreshes stock data that is stale, instead of refreshing everything
- **Reliability**: Even if stock data in the database is updated, new posts will use the latest information
- **Performance**: Minimizes unnecessary API calls to Yahoo Finance by respecting the cache window

## Technical Notes

- The staleness threshold is set to 15 minutes which means:
  - Stock data less than 15 minutes old will be reused from cache
  - Stock data more than 15 minutes old will be refreshed from Yahoo Finance
- The system includes fallbacks to ensure posts can still be created even if stock data refresh fails
- For production deployments, consider implementing a more sophisticated stock data service with real-time updates

## Future Enhancements

- Implement a webhook system to automatically update stock data when prices change significantly
- Add real-time WebSocket updates for stock prices on actively viewed posts
- Implement a background job to periodically refresh all stock data
- Add support for more comprehensive stock information (market cap, volume, etc.)
