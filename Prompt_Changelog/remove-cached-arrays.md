# Remove Posts, like, comment like cached arrays in favor of direct Supabase requests

## Changes Made

1. **Feed Page** (`app/page.tsx`)

   - Removed the cached API fetch for posts and now directly querying Supabase
   - Kept the stock data fetching using cache as specified

2. **Post Card Component** (`components/post-card.tsx`)

   - Removed cache refresh call in the `handleLike` function
   - Simplified the like handling to directly update Supabase without refreshing the cache

3. **Post Detail Page** (`app/post/[id]/page.tsx`)

   - Modified `fetchComments` to directly query Supabase instead of using the cached API
   - Updated `handleSubmitComment` to directly insert comments through Supabase
   - Updated `handleSubmitReply` to directly insert reply comments through Supabase
   - Updated `handleCommentLike` to directly manage comment likes through Supabase

4. **API Routes**
   - No longer need `app/api/refresh-post/route.ts` since we're not using the cache
   - No longer need cached API routes for posts and comments

## Technical Details

The changes simplified the data flow by:

1. Removing the intermediate layer of cached arrays
2. Having components directly interact with the Supabase database
3. Ensuring data consistency by always fetching the latest data from Supabase
4. Keeping only the stock data cached as specified

## Benefits

1. **Simplified Architecture**: Removed the complexity of managing cached data
2. **Direct Data Access**: Components now directly interact with the data source
3. **Real-time Updates**: Always fetching the latest data from the database
4. **Reduced API Routes**: Fewer API routes to maintain

## Next Steps

No additional steps are required. The application should now be using direct Supabase queries for posts, likes, and comments, while still using cached data for stocks.
