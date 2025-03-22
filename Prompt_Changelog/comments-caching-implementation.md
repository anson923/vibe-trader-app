# Comment Caching Implementation

> For the comment section functionality, make sure the nextjs backend when deployed, it also fetches comment table into array in backend so that when user look for the detail post, it also check the nextjs backend comments array so that it doesnt waste too many bandwidth if fetching actual supabase table. Make sure when posting comment, also add to that comment array in nextjs backend.

## Overview

This implementation adds a server-side caching mechanism for comments to reduce bandwidth usage and improve performance when users view post details. The system caches comments in the Next.js backend and updates the cache when new comments are posted.

## Changes Made

1. **Created a New Cached Comments API Endpoint**

   - Added `app/api/cached-comments/route.ts` with GET and POST methods
   - Implemented an in-memory cache for storing comments by post ID
   - Set a 15-minute cache expiration to ensure data freshness
   - Added fallback to direct Supabase queries when needed

2. **Updated Post Detail Page**

   - Modified `app/post/[id]/page.tsx` to use cached comments API
   - Added separate `fetchComments()` function to handle comment retrieval
   - Updated `handleSubmitComment()` to use the cached API for posting
   - Implemented fallback mechanisms for reliability

3. **Fixed Issue with Comments Not Appearing After Refresh**
   - Modified the cached comments API to always fetch fresh data from Supabase
   - Updated the POST handler to fully refresh the cache after adding a comment
   - Added cache-busting timestamp to ensure latest data is retrieved
   - Modified comment submission to refresh all comments after posting

## How It Works

### Comment Retrieval Flow

1. When a user views a post detail page, the component requests comments from the cached API with a cache-busting timestamp
2. The API now always fetches fresh data from Supabase to ensure consistency
3. This data is stored in the cache for future reference and returned to the client
4. If the cached API fails for any reason, the component falls back to a direct Supabase query

### Comment Posting Flow

1. When a user submits a comment, the data is sent to the cached API endpoint
2. The API inserts the comment into Supabase and fully refreshes the cache for that post
3. After successful submission, the client refreshes all comments instead of just appending the new one
4. This ensures all users see the same, consistent comments after page refreshes
5. If the cached API fails, the component falls back to inserting directly to Supabase

## Benefits

- **Reduced Bandwidth Usage**: Minimizes Supabase queries by serving cached comments
- **Improved Performance**: Faster page loads with cached data
- **Consistent Experience**: Real-time updates when new comments are posted
- **Reliability**: Graceful fallbacks ensure functionality even if caching fails
- **Data Integrity**: Fixed issues with comments not appearing after refresh

## Technical Notes

- The in-memory cache is suitable for deployments with few instances or stateful containers
- For production deployments with multiple instances, consider using Redis or a similar distributed cache
- The cache expiration (15 minutes) can be adjusted based on comment frequency and freshness requirements
- We now prioritize data consistency over caching performance

## Future Enhancements

- Implement distributed caching with Redis for multi-instance deployments
- Add cache invalidation on comment deletion or updates
- Add pagination support for posts with many comments
- Implement more advanced server-side metrics to monitor cache hit/miss rates
- Consider implementing websocket updates for real-time comment notifications
