# Fix Missing Stock Capsules in Post Feed

## Issue Fixed

When creating a post with stock tickers ($AAPL, $NVDA, etc.), the stock data was being fetched and saved correctly, but stock capsules were not appearing in the feed after post creation. This was happening because:

1. The current implementation forced unique ticker entries in the database, overwriting post associations
2. When a new post referenced an existing ticker, the record was updated but lost its association with the original post
3. When viewing posts, the stock data couldn't be found because the post_id association was lost

## Implementation Details

### Database Schema Changes

1. **Modified Unique Constraints**:
   - Dropped the ticker-only unique constraint (`stocks_ticker_unique`)
   - Added a composite unique constraint on `(post_id, ticker)` to allow the same ticker to appear in multiple posts
   - Made the `post_id` column NOT NULL to ensure all stock records are associated with a post

2. **Updated Index Strategy**:
   - Maintained separate indexes on `ticker` and `post_id` for query performance
   - Added documentation to the table explaining its purpose

### Code Changes

1. **Fixed Stock Saving Logic**:
   - Modified `saveStockData` function in `lib/stock-utils.ts` to always create a new record for each post-ticker combination
   - Removed the code that looked for existing tickers and updated them
   - Added better logging to track the post association process

2. **Server API Improvements**:
   - Updated the `saveStockToDatabase` function in `app/api/stocks/route.ts` to handle post_id values appropriately
   - Improved error handling to catch and report issues with stock associations

## Testing

To verify this fix:

1. Create multiple posts with the same stock ticker (e.g., `$AAPL`)
2. Verify that each post shows the stock capsule in the feed
3. Check the database to confirm that:
   - Each post has its own stock record with the correct post_id
   - Stock data (price, change, etc.) is consistent

## Benefits

This change ensures that:

1. Each post has its own stock capsules, regardless of ticker uniqueness
2. The feed properly displays all associated stock data for each post
3. Multiple posts can reference the same stock without interfering with each other
4. The database structure correctly enforces the one-to-many relationship between posts and stocks

## Migration Instructions

Run the provided migration script to update your database schema:

```sql
-- supabase/migrations/fix_stocks_table_constraint.sql
-- Commands to fix the stocks table constraints
```

This migration is safe to run on existing databases and will preserve existing data while correcting the constraints. 