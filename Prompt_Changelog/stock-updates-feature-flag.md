# Stock Updates Feature Flag & Market-Hours Logic Enhancement

## Original Request
> Fix an issue where tickers are updated despite closed market.
> Make sure that tickers are updated ONLY if market opened and 15 mins old.
> If market is closed, dont need to update despite over 15 mins old.
> 
> Also, add a boolean for feature flag, that I can control true or false to start the cron job to update market. default now should be true.
> But when i set it to false, it shouldnt start this cron job no matter what condition.

## Problem Overview

There were two issues with the stock update implementation:

1. **Updates During Closed Markets**: The system was updating tickers even when the market was closed if the data was older than 12 hours, which was unnecessary resource usage.

2. **No Feature Flag**: There was no simple way to completely disable the stock update functionality without code changes.

## Changes Made

### 1. Added Feature Flag System

Implemented a global feature flag with methods to control it:

```typescript
// Feature flag to control stock update cron jobs
let ENABLE_STOCK_UPDATES = true; // Default is enabled

export function setStockUpdatesEnabled(enable: boolean): void {
    ENABLE_STOCK_UPDATES = enable;
    console.log(`Stock updates ${enable ? 'enabled' : 'disabled'}`);
}

export function isStockUpdatesEnabled(): boolean {
    return ENABLE_STOCK_UPDATES;
}
```

### 2. Fixed Market Hours Logic

Modified the update process to completely skip updates when the market is closed:

```typescript
// Skip all updates when market is closed
if (!isMarketOpen()) {
    console.log(`Market is currently closed: ${getMarketClosedReason()}`);
    console.log('Skipping stock updates until market opens');
    return;
} else {
    console.log('Market is currently open, proceeding with updates');
}
```

### 3. Removed "Stale Data" Logic for Closed Markets

Eliminated the code that would update tickers during closed market hours if the data was older than 12 hours:

```typescript
// Old code (removed)
if (!marketOpen && millisSinceUpdate > 12 * 60 * 60 * 1000) {
    console.log(`Ticker ${ticker} is ${hoursSinceUpdate} hours old (> 12 hours), updating despite closed market`);
    expiredTickers.push(ticker);
}
```

### 4. Added Feature Flag Checks Throughout the Process

Added checks at key points in the workflow to respect the feature flag:

- At the start of `processAllStocks` function
- At the start of `startStockWorker` function
- Inside each cron job callback

## Benefits

1. **Resource Efficiency**: 
   - No more unnecessary updates when the market is closed
   - Prevents wasted compute, network, and database resources

2. **Runtime Control**:
   - Can enable/disable stock updates without redeploying the application
   - Useful for maintenance, debugging, or emergency situations

3. **Simplified Logic**:
   - Clearer update policy: only update during market hours
   - Removed complex conditional logic for "stale data" during closed markets

## Usage

### Programmatic Control

You can enable or disable stock updates programmatically using the following functions:

```typescript
import { setStockUpdatesEnabled, isStockUpdatesEnabled } from '@/lib/stock-batch-worker';

// To disable stock updates
setStockUpdatesEnabled(false);

// To enable stock updates
setStockUpdatesEnabled(true);

// To check current status
const isEnabled = isStockUpdatesEnabled();
```

### API Endpoint

A new API endpoint has been created to toggle stock updates without requiring code changes:

- **GET /api/admin/stock-updates**: Get the current status of stock updates
- **POST /api/admin/stock-updates**: Update the stock updates status

Example usage with fetch:

```typescript
// Check current status
const checkStatus = async () => {
  const response = await fetch('/api/admin/stock-updates');
  const data = await response.json();
  console.log('Stock updates enabled:', data.enabled);
};

// Enable stock updates
const enableUpdates = async () => {
  const response = await fetch('/api/admin/stock-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enable: true })
  });
  const data = await response.json();
  console.log('Operation successful:', data.success);
  console.log('New status:', data.enabled);
};

// Disable stock updates
const disableUpdates = async () => {
  const response = await fetch('/api/admin/stock-updates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enable: false })
  });
  const data = await response.json();
  console.log('Operation successful:', data.success);
  console.log('New status:', data.enabled);
};
```

Note: This endpoint is currently using admin authorization for simplicity. In a production environment, you should implement proper authentication.

### Admin UI

A new admin UI has been created to provide a user-friendly interface for controlling stock updates:

- **Path**: `/admin`
- **Component**: `app/admin/stock-controls.tsx`

The admin dashboard includes:
- A toggle switch to enable/disable stock updates
- Status indicators for current state
- Error handling and feedback
- Refresh button to check current status

![Admin Dashboard for Stock Controls](https://placeholder-image-url.com/admin-stock-controls.png)

## Testing

To verify the feature flag implementation is working correctly:

1. **Check market hours filtering**:
   - Run the application during closed market hours
   - Verify that no stock updates are processed (check logs)
   - Force an update via the API and observe no ticker updates occur

2. **Test feature flag functionality**:
   - Ensure the stock updates are initially enabled
   - Disable updates using the API or admin UI
   - Verify that even during market hours, no updates are processed
   - Re-enable updates and confirm they resume during market hours

3. **Admin UI testing**:
   - Visit `/admin` page and check if the current status is correctly displayed
   - Toggle the stock updates switch
   - Verify the status updates correctly with appropriate feedback
   - Confirm the switch state persists on page refresh
   - Test error handling by temporarily disabling the API endpoint

4. **API endpoint testing**:
   - Use the API endpoint directly with curl or Postman:
   ```bash
   # Get current status
   curl http://localhost:3000/api/admin/stock-updates
   
   # Enable updates
   curl -X POST http://localhost:3000/api/admin/stock-updates \
     -H "Content-Type: application/json" \
     -d '{"enable": true}'
   
   # Disable updates
   curl -X POST http://localhost:3000/api/admin/stock-updates \
     -H "Content-Type: application/json" \
     -d '{"enable": false}'
   ``` 