# Post Deletion Feature Implementation

> Add a function that in feed post and post detail page, if the post is current user, then show a three dot that allow user to delete the post, make a model to confirm user action. If user chooses to confirm delete post, delete the post from database table, and make sure the related post id comments and likes are also delete from the arrays and database table.

## Overview

This feature adds a post deletion capability that allows users to delete their own posts from both the feed and post detail pages. A confirmation dialog prevents accidental deletions, and the implementation leverages Supabase's CASCADE DELETE constraints to automatically handle the removal of associated comments and likes.

## Implementation Details

### 1. Created Reusable Components

- **Added DeletePostButton Component**: A reusable component that displays a three-dot menu icon and deletion confirmation dialog
- **Implemented DropdownMenu Component**: Added the Shadcn UI dropdown menu component for the three-dot menu

### 2. Feed Post Integration

- Updated the `PostCard` component to include the delete button
- Added necessary props to pass user ID information for ownership verification
- Implemented automatic page refresh after successful deletion

### 3. Post Detail Page Integration

- Added the delete button to the post detail page
- Configured automatic redirection to home page after deletion

### 4. Database Handling

- Used Supabase's built-in CASCADE DELETE constraints to automatically delete related comments and likes
- Leveraged existing database triggers for maintaining post counts

### 5. Cache Management (Fix for Post Persistence Issue)

- Added a `removeCachedPost()` function to the server-side store to remove deleted posts from cache
- Implemented a DELETE endpoint in the cached-posts API
- Updated the DeletePostButton component to use the cached API for deletion
- Ensured posts are deleted from both the database and the Next.js server-side cache
- Added fallback to direct Supabase deletion if the cached API fails

## Technical Implementation

The implementation takes advantage of several key technical aspects:

1. **Authorization Checks**:

   - Only displays the delete button to the post author
   - Performs additional server-side validation before deletion

2. **Cascading Deletes**:

   - Utilizes the SQL foreign key constraints with CASCADE DELETE option
   - When a post is deleted, all associated comments and likes are automatically deleted due to these constraints

3. **Cache Management**:

   - Ensures deleted posts are removed from the server-side cache
   - Prevents deleted posts from still appearing in the feed after returning from post detail page

4. **UX Considerations**:
   - Provides clear confirmation dialog with warning about permanent deletion
   - Shows loading state during deletion process
   - Handles error cases gracefully

## Usage

The delete functionality is automatically available on any post where the current user matches the post author:

1. The user sees a three-dot menu in the top-right corner of their own posts
2. Clicking the menu reveals a "Delete post" option
3. Selecting this option displays a confirmation dialog
4. If confirmed, the post and all related data (comments, likes) are permanently deleted
5. The post is immediately removed from the feed and the cache

## Future Enhancements

Potential improvements to consider:

1. Add post archiving functionality as a less destructive alternative
2. Implement undo capability within a short timeframe after deletion
3. Add batch delete options for profile page

## Technical Notes

The implementation aligns with the existing database schema and constraints:

```sql
-- Existing foreign key constraints with CASCADE DELETE
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  -- other fields...
);

CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  -- other fields...
);
```
