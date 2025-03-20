# Stock Data Architecture Redesign

## Original Request
> Update the sql that the stocks table should not have "post_id" column. Please remove that. And also the posts table should add a column to have a list or something to show what tickers included. So that when a feed post showed, can get all those tickers to find in out supabase stocks table to show the capsule stock components.

## Summary
This update completely redesigns how stock data is stored and associated with posts. Instead of having a direct relationship between posts and stocks through a `post_id` column in the stocks table, we now store an array of ticker symbols in each post and maintain a separate stocks table with unique tickers. This approach is more scalable, efficient, and follows standard financial data patterns.

## Database Changes

### 1. Stocks Table
- Removed `post_id` column (no longer associated directly with posts)
- Added a unique constraint on `ticker` column (one record per ticker)
- Created appropriate indexes for performance optimization

### 2. Posts Table
- Added `tickers` TEXT[] column to store an array of stock tickers mentioned in each post
- Created a GIN index on the `tickers` array for efficient queries
- This allows each post to track which tickers it references without duplicating stock data

### 3. Migration File
Created a new migration file `fix_stocks_table_constraint.sql` that:
- Drops constraints linked to post_id
- Removes the post_id column from the stocks table
- Adds the tickers array to posts table
- Creates appropriate indexes and constraints
- Updates RLS policies to reflect the new schema

## Code Changes

### 1. Stock Utilities (`lib/stock-utils.ts`)
- Updated `saveStockData` function:
  - Now performs an upsert operation on the stocks table
  - Updates the post's tickers array to include the ticker if not already present
  - Maintains data consistency between posts and stocks

- Updated `getStockDataForPost` function:
  - Now first retrieves the post's ticker array
  - Then fetches the corresponding stock data for each ticker
  - Maps the data to a consistent format for display

- Updated `getStockDataByTicker` function:
  - Simplified to just check for a ticker without post_id constraints

### 2. Stocks API (`app/api/stocks/route.ts`)
- Updated `saveStockToDatabase` function:
  - Removed logic related to post_id
  - Added upsert functionality to update existing stock data or insert new records
  - Improved error handling and logging

### 3. Post UI Components (`components/post-card.tsx`)
- Updated `StockData` interface to reflect new database schema:
  - Added `price_change` field
  - Removed `post_id` field
  - Added handling for updated_at timestamps
  
- Added improved data mapping to handle the new schema:
  - Created a type-safe transformation from API data to component data
  - Improved error handling during data fetching

- Updated stock badge rendering to include price change data

## Benefits

1. **Centralized Stock Data**: Each ticker is stored only once in the database, regardless of how many posts reference it
2. **Data Consistency**: When stock prices are updated, all posts referencing that ticker will show the latest data
3. **Improved Performance**: Less data duplication results in smaller database size and faster queries
4. **Cleaner Data Model**: Follows standard financial data patterns where stock data is independent of content
5. **Reduced Database Load**: Updates to stock data affect only one record instead of potentially many
6. **Better Caching**: Single source of truth makes caching strategies more effective

## How to Deploy

1. Run the migration file in Supabase SQL editor:
   ```sql
   -- Execute the migration script
   \i supabase/migrations/fix_stocks_table_constraint.sql
   ```

2. If you encounter an error about NULL values in the post_id column, you'll need to handle those records first:
   ```sql
   -- Delete records with NULL post_id (these would be orphaned after the migration)
   DELETE FROM stocks WHERE post_id IS NULL;
   
   -- Then run the migration
   \i supabase/migrations/fix_stocks_table_constraint.sql
   ```

3. Restart your application to ensure all code changes take effect

## Testing

Test the new implementation by:

1. Creating posts with stock tickers (use $SYMBOL format like $AAPL, $MSFT)
2. Verify that stock data appears correctly in the feed
3. Create multiple posts with the same ticker and confirm they all show the proper stock data
4. Check the database to confirm:
   - Each post has its tickers stored in the `tickers` array
   - The `stocks` table has one record per unique ticker
   - Price updates affect all posts referencing that ticker

## Known Limitations

1. Historical data for stocks is not preserved - only the latest price is stored
2. All posts referencing a stock will show the same current price, even if posted at different times 