-- Add likes_count and comments_count to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0;

-- Add trigger for updating comments_count in posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();