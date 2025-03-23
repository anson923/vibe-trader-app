# Market Hours-Aware Stock Data Updates

This update enhances the stock data updating logic to consider market trading hours. We've added intelligence to the system to avoid unnecessary stock data refreshes when the market is closed, as prices won't change significantly during those periods.

## Problem

Previously, the system would refresh stock data every 15 minutes regardless of market trading hours. This led to unnecessary API calls and computations during:

- Nights and early mornings (when US markets are closed)
- Weekends
- US market holidays

Since stock prices don't change when markets are closed, this was an inefficient use of resources.

## Implementation

We've added several key functions to the stock utility system:

1. **Detailed Market Status Detection**

   ```typescript
   function getMarketStatus(): { isOpen: boolean; reason?: string };
   ```

   - Returns an object containing both market status and reason if closed
   - Detects specific reasons for market closure:
     - Weekend days (Saturday/Sunday)
     - Before/after trading hours
     - Major US market holidays including:
       - New Year's Day
       - Martin Luther King Jr. Day
       - Presidents Day
       - Memorial Day
       - Juneteenth
       - Independence Day
       - Labor Day
       - Thanksgiving
       - Christmas

2. **Simple Market Hours Check**

   ```typescript
   function isMarketOpen(): boolean;
   ```

   - Simplified version that just returns true/false
   - Checks if current time is within US market hours (9:30 AM to 4:00 PM ET)
   - Considers weekends (markets closed on Saturday and Sunday)

3. **Human-Readable Status Message**

   ```typescript
   function getMarketClosedReason(): string;
   ```

   - Returns a human-readable explanation of why market is closed
   - Useful for detailed logging to track exactly why updates are being skipped

4. **Smart Staleness Check**

   ```typescript
   function isStockDataStale(updatedAt: Date | string): boolean;
   ```

   - First checks if data is older than 15 minutes
   - If data is recent (< 15 min), it's never considered stale
   - If data is older than 15 minutes, it checks if the market is currently open
   - Only considers data stale if it's both old AND the market is open

5. **Batch Worker Updates**
   - The `processAllStocks()` function now uses the market-aware logic
   - Logs detailed market status at the start of each update cycle
   - Only marks tickers as expired if they're stale according to the new logic
   - Applies a special rule for very old data (>12 hours) to update it even during closed market
   - Includes specific reason why market is closed in logs

## Benefits

1. **Reduced API Calls**: Significant reduction in Yahoo Finance API calls during off-market hours
2. **Resource Efficiency**: Less CPU and memory usage during nights and weekends
3. **Reduced Rate Limiting**: Lower chance of hitting rate limits with external services
4. **Better Logging**: Clear logs showing market status details and reason for update decisions
5. **Consistent Data**: Still updates extremely outdated data regardless of market hours
6. **Improved Observability**: Now logs specific reason for market closure (weekend, holiday, after hours)

## Example Log Output

When market is closed:

```
Starting batch stock update process...
Loaded 200 tickers from ticker file
Market status: CLOSED - Market is closed for weekend (Saturday)
Market is currently closed. Stock prices will not change significantly.
Only updating stocks that have never been fetched or are extremely outdated.
Current time (UTC): 2023-05-20T03:45:00.000Z
Ticker AAPL data from 3.5 hours ago is still valid - market is closed: Market is closed for weekend (Saturday)
Ticker MSFT data from 4.2 hours ago is still valid - market is closed: Market is closed for weekend (Saturday)
...
Skipping 198 valid tickers
Processing 2 expired tickers in batches of 10
```

When market is closed for a holiday:

```
Starting batch stock update process...
Loaded 200 tickers from ticker file
Market status: CLOSED - Market is closed for Christmas holiday
Market is currently closed. Stock prices will not change significantly.
Only updating stocks that have never been fetched or are extremely outdated.
```

When market is closed for after-hours:

```
Starting batch stock update process...
Loaded 200 tickers from ticker file
Market status: CLOSED - Market is closed - after trading hours (closes 4:00 PM ET)
Market is currently closed. Stock prices will not change significantly.
Only updating stocks that have never been fetched or are extremely outdated.
```

When market is open:

```
Starting batch stock update process...
Loaded 200 tickers from ticker file
Market status: OPEN - Normal trading hours in session
Current time (UTC): 2023-05-19T18:30:00.000Z
Ticker AAPL expired - last updated 23 minutes ago, market is open
Ticker MSFT expired - last updated 22 minutes ago, market is open
...
Processing 35 expired tickers in batches of 10
```

## Technical Details

- Market hours are defined as 9:30 AM to 4:00 PM Eastern Time (14:30 to 21:00 UTC)
- Weekend check uses the day of week from JavaScript's `Date.getUTCDay()` method
- 15-minute freshness window still applies during market hours
- Special 12-hour rule for updating very old data ensures data doesn't become too stale
- The system correctly identifies major US stock market holidays
- Human-readable messages provide clear explanations for market closure reasons
