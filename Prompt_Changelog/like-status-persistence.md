# Make sure that when refresh detail post page, feed page, when a post or a comment liked by the user himself, show the red heart so that the user will know they have already liked the post/the comment, and also this could prevent unexpected bugs when the user tries to like again but they have already liked before that leads to unexpected error.

## Changes Made

### 1. PostCard Component Update

- Updated the `PostCard` component to accept an optional `liked` prop from the parent component.
- Modified the state initialization to use the provided `liked` prop if available: `const [liked, setLiked] = useState(initialLiked || false)`.
- Updated the `checkIfLiked` function to skip the API call if the `initialLiked` prop is provided, preventing unnecessary database queries.

### 2. Feed Page (app/page.tsx) Update

- Updated the feed page to fetch the current user's liked posts.
- Added the user as a dependency for the `useEffect` so it refreshes when the user changes.
- Modified the post formatting to include a `liked` property in the `FormattedPost` interface.
- For direct Supabase queries, added a check to determine which posts have been liked by the current user.

### 3. Cached Posts API Update

- Enhanced the GET endpoint in `app/api/cached-posts/route.ts` to check if posts are liked by the user when the `userId` parameter is provided.
- Added logic to fetch the user's liked posts and attach this information to the returned posts.

### 4. Cached Comments API

- Ensured the comments API correctly sets the `liked` status for comments when the `userId` parameter is provided.
- This allows the post detail page to correctly display which comments the user has already liked.

## Benefits

1. **Improved User Experience**: Users can now see which posts and comments they have already liked, even after refreshing the page.
2. **Prevented Duplicate Likes**: By showing the correct liked status, we prevent users from trying to like content they've already liked, which could cause errors.
3. **Reduced Unnecessary Database Queries**: By passing the like status from the server, we skip redundant client-side API calls to check if a post is liked.

## Next Steps

No additional steps are required. The implemented changes should maintain the like status correctly on both the feed page and post detail page when refreshing.
