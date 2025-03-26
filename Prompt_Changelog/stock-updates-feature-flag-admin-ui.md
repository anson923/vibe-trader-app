# Stock Updates Feature Flag & Admin UI

## Original Request
Update the stock updates system to:
1. Prevent updates when the market is closed
2. Add a feature flag to control updates (defaults to true)
3. Create an admin UI to toggle the feature flag

## Implementation Summary

### Core Changes
1. **Feature Flag System**
   - Added global feature flag variable `ENABLE_STOCK_UPDATES` (default: true)
   - Created functions to check/set the feature flag state
   - Added logging of state changes

2. **Market Hours Logic**
   - Modified the stock processing to skip updates when market is closed
   - Removed logic that allowed updates for stale data during closed markets
   - Added detailed logging of market status

3. **API Endpoint**
   - Created `/api/admin/stock-updates` endpoint with:
     - GET method to retrieve current flag status
     - POST method to update the flag status

4. **Admin UI**
   - Created a React component `StockControls` in `app/admin/stock-controls.tsx`
   - Added an admin dashboard page at `/admin`
   - Implemented a user-friendly toggle interface with status feedback

### Benefits
- **Resource Efficiency**: No processing occurs during closed market hours
- **Runtime Control**: Ability to toggle updates without code changes
- **Admin Visibility**: Clear UI showing current state of stock updates
- **Better Logging**: Enhanced logging for troubleshooting

## Technical Details

### Feature Flag API
```typescript
// GET /api/admin/stock-updates
// Returns: { enabled: boolean }

// POST /api/admin/stock-updates
// Body: { enable: boolean }
// Returns: { success: true, enabled: boolean }
```

### Admin UI
The admin dashboard at `/admin` provides:
- Toggle switch for enabling/disabling stock updates
- Status indicator showing current state
- Refresh button to check current state
- Error handling with user-friendly messages

## Testing
1. Visit `/admin` to see the current status
2. Toggle the switch and verify status changes
3. Check logs to confirm updates are skipped when disabled
4. Check logs to confirm updates are skipped during closed market hours
5. Test the API endpoint directly with:
   ```bash
   curl http://localhost:3000/api/admin/stock-updates
   
   curl -X POST http://localhost:3000/api/admin/stock-updates \
     -H "Content-Type: application/json" \
     -d '{"enable": false}'
   ```

## Future Improvements
1. Add authentication to protect the admin routes
2. Implement persistence for the feature flag (currently in-memory)
3. Add additional admin controls for other system features 