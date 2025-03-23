# Fix Infinite Retry Loop in Stock Batch Worker

This update addresses a critical issue where the stock batch worker could get stuck in an infinite retry loop when it couldn't fetch data for certain tickers.

## Issue

The worker would continually retry fetching tickers that couldn't be found, potentially causing:

- CPU usage spikes
- Memory leaks
- Blocked processing of other valid tickers
- Excessive log entries

A specific example was seen with the ticker "EWR" which was repeatedly retried without success, blocking the entire batch processing.

## Changes Made

The following improvements have been implemented:

1. **Added a Definitive End to Retries**:

   - After MAX_RETRIES (3) failed attempts, the system now creates placeholder entries for tickers that couldn't be fetched
   - These placeholders have a price of 0 and include an error message

2. **Enhanced Error Handling**:

   - Added tracking of missing tickers through a `missingTickers` array
   - Improved fallback API to ensure it always returns data for all requested tickers
   - Added source attribution and error information to help with debugging

3. **Database Schema Update**:

   - Added a `fetch_error` column to the stocks table to track fetch failures
   - Ensured all stock records have valid numerical values (using 0 for failures)

4. **Better Logging**:
   - Added detailed logs about placeholder entries
   - Improved error messaging to show exactly which tickers failed and why
   - Added count of placeholder entries when saving to database

## Benefits

- **Prevents Stuck Workers**: The worker will no longer get stuck in infinite loops
- **Better Error Visibility**: Failed fetches are clearly logged and stored in the database
- **Improved Reliability**: The worker continues processing even when some tickers fail
- **Debug Assistance**: Error tracking helps identify problematic tickers for future fixes

## Required Database Change

The stocks table requires a new column:

```sql
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS fetch_error TEXT;
```

Run this SQL statement in your Supabase SQL editor to add the new column.

## Next Steps

1. Run the above SQL statement to update your database schema
2. Monitor the logs to see if any tickers consistently fail to fetch
3. Consider removing problematic tickers from your tracking list if they consistently fail
