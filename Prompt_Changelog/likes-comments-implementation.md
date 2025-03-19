# Add likes and comments functionality, initializing them with zero in SQL and handling post display.

This update implements likes and comments functionality in the application, allowing users to interact with posts.

## Changes Made

### Database Schema Updates

1. **Posts Table**:
   - Added `likes_count` and `comments_count` columns to track engagement metrics
   - Both columns are initialized to zero for new posts

2. **New Tables**:
   - Created `likes` table to store user likes with a unique constraint to prevent duplicate likes
   - Created `comments` table to store user comments with relevant metadata

3. **Database Triggers**:
   - Added automatic update triggers to maintain accurate likes and comments counts
   - Set up cascading deletions for data integrity
   - Created user deletion handler to clean up all related data

4. **Security Policies**:
   - Set up Row Level Security (RLS) for all tables
   - Implemented proper access control with appropriate permissions:
     - Everyone can read posts, likes, and comments
     - Only authenticated users can create posts, like posts, and comment
     - Users can only modify or delete their own content

### Frontend Implementation

1. **Post Card Component**:
   - Updated to display accurate like and comment counts
   - Added like functionality with real-time updates
   - Visual indicators for liked posts

2. **Post Detail Page**:
   - Created detailed post view at `/post/[id]`
   - Implemented like functionality with optimistic UI updates
   - Added comment form for logged-in users
   - Displays comments in reverse chronological order

3. **Feed & Profile Pages**:
   - Updated to show like and comment counts from the database
   - Proper formatting of timestamps

## SQL Fix

The initial implementation had an issue with Row Level Security policies. For INSERT policies, PostgreSQL requires using `WITH CHECK` instead of `USING` in the policy definition. This has been fixed in the final SQL script.

## How to Run the SQL Script

To set up the database schema:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the `create_posts_table.sql` script

This single script will set up all necessary tables, indexes, functions, triggers, and security policies needed for the likes and comments functionality.

## Next Steps

After running the SQL script, your application will have full likes and comments functionality. Users will be able to:

- Like/unlike posts
- View like counts
- Add comments to posts
- View all comments on a post detail page
- See comment counts throughout the application

No additional configuration is needed beyond running the SQL script. 