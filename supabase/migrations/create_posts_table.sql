-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id) -- Prevent duplicate likes
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for posts security
-- Allow anyone to read all posts
CREATE POLICY "Allow anyone to read posts" ON posts
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own posts
CREATE POLICY "Allow authenticated users to insert their own posts" ON posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Allow users to update their own posts" ON posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow users to delete their own posts
CREATE POLICY "Allow users to delete their own posts" ON posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for likes
-- Anyone can read likes
CREATE POLICY "Allow anyone to read likes" ON likes
  FOR SELECT USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Allow authenticated users to insert their own likes" ON likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Allow users to delete their own likes" ON likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for comments
-- Anyone can read comments
CREATE POLICY "Allow anyone to read comments" ON comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Allow authenticated users to insert their own comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Allow users to update their own comments" ON comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Allow users to delete their own comments" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for posts
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts (user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);

-- Create indexes for likes
CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes (post_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes (user_id);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments (user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments (created_at DESC);

-- Create database functions to manage like counts
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create database functions to manage comment counts
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle user deletions
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

-- Create trigger for user deletions
CREATE TRIGGER handle_deleted_user_trigger
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_deleted_user();

-- Create triggers for automatic count updates
CREATE TRIGGER increment_post_likes_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION increment_post_likes();

CREATE TRIGGER decrement_post_likes_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION decrement_post_likes();

CREATE TRIGGER increment_post_comments_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comments();

CREATE TRIGGER decrement_post_comments_trigger
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comments(); 