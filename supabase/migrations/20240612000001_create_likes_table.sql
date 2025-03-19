-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can only like a post once
  UNIQUE(post_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes(post_id);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON likes(user_id);

-- Add trigger to update likes_count in posts table
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count(); 