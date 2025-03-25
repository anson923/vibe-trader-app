# First, check the design of the page @page.tsx how comment ui design. Then, draft a solution for this finance stock social media website, think of the best solution of the design, make sure is mobile responsive too. Then, update a nested commentn design for user to easily to check nested comments and do another comment on the comment. For the reference design, I have attached a few social media image reference, please check it carefully and think of a similar and unique design. The goal is to have a nested comment section and likes on comments.

This update implements nested comments and comment likes functionality in the stock trading social media platform, following a design similar to popular social media platforms.

## What Has Changed

### 1. Database Schema Updates

- Added `parent_comment_id`, `level`, and `likes_count` columns to the `comments` table to enable nested comments
- Created a new `comment_likes` table to track likes on comments
- Added triggers to automatically update comment like counts
- Set up proper indexes for performance optimization
- Updated security policies to ensure proper access control

### 2. API Enhancements

- Updated the cached-comments API to:
  - Support fetching nested comments in a tree structure
  - Allow liking/unliking comments
  - Show which comments the current user has liked
  - Support adding replies to comments

### 3. UI Improvements

- Implemented nested comment threads with proper indentation and visual connectors
- Added like buttons and counts for individual comments
- Added reply functionality to each comment
- Ensured all UI components are mobile-responsive
- Enhanced the comment form to create proper hierarchy

## How to Use

### Required Database Changes

Run the following SQL migration to enable nested comments and comment likes:

```sql
-- Execute this in your Supabase SQL editor
-- File: supabase/migrations/20240630000001_add_nested_comments_and_likes.sql

-- Add nested comments support and comment likes functionality

-- 1. Update comments table to support nested comments
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Create index for faster parent-child lookups
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments(parent_comment_id);

-- 2. Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id) -- Prevent duplicate likes
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);

-- 3. Create functions and triggers for comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comments
  SET likes_count = likes_count + 1
  WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update comment likes count
CREATE TRIGGER increment_comment_likes_trigger
AFTER INSERT ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION increment_comment_likes();

CREATE TRIGGER decrement_comment_likes_trigger
AFTER DELETE ON comment_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_likes();

-- 4. Enable Row Level Security for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for comment_likes
-- Anyone can read comment likes
CREATE POLICY "Allow anyone to read comment likes" ON comment_likes
  FOR SELECT USING (true);

-- Authenticated users can insert their own comment likes
CREATE POLICY "Allow authenticated users to insert their own comment likes" ON comment_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comment likes
CREATE POLICY "Allow users to delete their own comment likes" ON comment_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Update the handle_deleted_user function to include comment likes cleanup
CREATE OR REPLACE FUNCTION handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete user's posts when user is deleted
  DELETE FROM posts WHERE user_id = OLD.id;
  -- Delete user's comments when user is deleted
  DELETE FROM comments WHERE user_id = OLD.id;
  -- Delete user's likes when user is deleted
  DELETE FROM likes WHERE user_id = OLD.id;
  -- Delete user's comment likes when user is deleted
  DELETE FROM comment_likes WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

## Next Steps

1. Run the SQL migration script in your Supabase SQL editor
2. The application code already has the necessary changes to support nested comments and comment likes
3. Test the feature by:
   - Creating some comments on posts
   - Replying to comments to create nested threads
   - Liking different comments
   - Testing the mobile responsiveness of the UI

## Design Notes

- The nested comment design uses indentation and left border lines to visually connect replies to their parent comments
- Comments can be nested up to 5 levels deep for UI readability
- Each comment has its own like button and reply button
- Reply forms appear inline, making the conversation flow more natural

This feature enhances user engagement by allowing more detailed and organized conversations around trading ideas and market insights.
