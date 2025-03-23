# Fix Supabase Stock Permissions and Timestamp Handling

This update addresses two key issues in the stock data updating system:

1. **Fixed Row-Level Security Policy Error**: The background worker was encountering row-level security policy violations when trying to upsert stock data into the database. This is because the standard `supabase` client doesn't have administrative privileges.

2. **Improved Timestamp Handling**: Added proper UTC timestamp comparison to ensure consistent handling of the 15-minute expiration window, regardless of timezone differences.

## Changes Made

### 1. Stock Batch Worker (`lib/stock-batch-worker.ts`)

- Imported `supabaseAdmin` instead of using the regular `supabase` client for database operations
- Added detailed logging of timestamp comparisons to aid in debugging
- Improved error handling for database operations
- Added calculation and logging of stock data age in minutes for better visibility
- Enhanced the ticker expiration logic with clearer logging

### 2. Stock Utilities (`lib/stock-utils.ts`)

- Added logging to show how fresh stock data is (in minutes)
- No longer takes action on stale data, but provides informative logs for transparency
- Clearly indicates when data is stale but will be refreshed by the server worker

## Benefits

- The background worker can now properly update stock data in the database
- Consistent UTC timestamp handling prevents timezone-related issues
- Better logging provides more visibility into the stock data update process
- Clearer indication of data freshness in logs helps with debugging

## Next Steps

No additional actions are required. The background worker will now successfully update stock data on its scheduled 15-minute interval. Monitor the logs to ensure everything is working as expected - you should see successful database updates and proper logging of timestamp comparisons.
