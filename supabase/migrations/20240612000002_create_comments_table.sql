-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);

-- Update trigger function for handling user deletions
CREATE OR REPLACE FUNCTION handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete user's posts when user is deleted
  DELETE FROM posts WHERE user_id = OLD.id;
  -- Delete user's comments when user is deleted
  DELETE FROM comments WHERE user_id = OLD.id;
  -- Delete user's likes when user is deleted
  DELETE FROM likes WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql; 