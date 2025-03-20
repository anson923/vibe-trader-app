# Stock Data Architecture Update

## Original Problem
> Update the sql that the stocks table should not have "post_id" column. Please remove that. And also the posts table should add a column to have a list or something to show what tickers included. So that when a feed post showed, can get all those tickers to find in out supabase stocks table to show the capsule stock components.

## Issue Overview
The original implementation stored stock data in the `stocks` table with a `post_id` column to associate stocks with specific posts. This created issues:

1. Each post needed its own copy of stock data, even if the same ticker was referenced in multiple posts
2. This led to database constraints errors when posts had the same tickers
3. The architecture wasn't aligned with a typical stock data model where ticker data would be shared across posts

## Changes Made

### Database Schema Changes:
1. **Removed `post_id` column from `stocks` table**: Stock data is now independent of posts
2. **Added `tickers` TEXT[] column to `posts` table**: Each post now stores an array of ticker symbols
3. **Created appropriate indexes and constraints**:
   - Unique constraint on `ticker` in the `stocks` table
   - GIN index on `tickers` array in `posts` table for efficient querying
4. **Updated RLS policies** to reflect the new schema

### Code Changes:

1. **Updated `saveStockData` in `lib/stock-utils.ts`**:
   - Now updates both the `stocks` table and the `posts.tickers` array
   - Uses upsert for stock data to update existing records or insert new ones
   - Preserves data from multiple sources more effectively

2. **Updated `getStockDataForPost` in `lib/stock-utils.ts`**:
   - First retrieves the post's ticker array
   - Then fetches the corresponding stock data from the `stocks` table

3. **Updated `saveStockToDatabase` in `app/api/stocks/route.ts`**:
   - Simplified to use upsert on ticker without post_id
   - More efficient and reliable stock data updates

## Migration Changes

Created a new SQL migration file `fix_stocks_table_constraint.sql` that:
1. Drops constraints linked to post_id
2. Removes the post_id column from the stocks table
3. Adds the tickers array to posts table
4. Creates appropriate indexes and constraints
5. Updates RLS policies

## Benefits
1. **More Efficient Data Storage**: Stock data is stored once per ticker, not per post
2. **Cleaner Data Model**: Follows standard financial data patterns
3. **Improved Performance**: Less data duplication and more efficient querying
4. **Better Scalability**: Can handle more posts with stock references without database growth issues

## Migration Instructions
1. Run the migration file in Supabase SQL editor:
   ```sql
   -- Execute the migration script
   \i supabase/migrations/fix_stocks_table_constraint.sql
   ```

2. If using npm migrations script:
   ```bash
   npm run db:migrate
   ```

## Testing the Changes
1. Create posts with stock tickers (use $SYMBOL format like $AAPL, $MSFT)
2. Verify that stock data appears correctly in the feed
3. Create multiple posts with the same ticker and confirm they all show the proper stock data
4. Check the database to confirm:
   - Each post has its tickers stored in the `tickers` array
   - The `stocks` table has one record per unique ticker 