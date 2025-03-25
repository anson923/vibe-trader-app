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

-- 6. Update the RLS policies for comments table
-- Make sure policies use WITH CHECK for INSERT operations
DROP POLICY IF EXISTS "Allow authenticated users to insert their own comments" ON comments;
CREATE POLICY "Allow authenticated users to insert their own comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 7. Update the handle_deleted_user function to include comment likes cleanup
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