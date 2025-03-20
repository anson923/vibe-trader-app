-- Drop constraints linked to post_id
ALTER TABLE IF EXISTS stocks DROP CONSTRAINT IF EXISTS stocks_post_id_ticker_unique;
DROP INDEX IF EXISTS stocks_post_id_ticker_idx;
DROP INDEX IF EXISTS stocks_post_id_idx;

-- Update the RLS policies for stocks table to remove post_id references
DROP POLICY IF EXISTS "Allow users to update their own post's stocks" ON stocks CASCADE;
DROP POLICY IF EXISTS "Allow users to delete their own post's stocks" ON stocks CASCADE;

-- Remove post_id column from stocks table
ALTER TABLE IF EXISTS stocks DROP COLUMN IF EXISTS post_id;

-- Create a unique constraint on ticker
ALTER TABLE IF EXISTS stocks ADD CONSTRAINT stocks_ticker_unique UNIQUE (ticker);

-- Ensure ticker index exists for performance
CREATE INDEX IF NOT EXISTS stocks_ticker_idx ON stocks (ticker);

-- Add a tickers array column to posts table
ALTER TABLE IF EXISTS posts ADD COLUMN IF NOT EXISTS tickers TEXT[] DEFAULT '{}';

-- Create index for faster lookups by tickers
CREATE INDEX IF NOT EXISTS posts_tickers_gin_idx ON posts USING GIN (tickers);

-- Add comments to explain the tables
COMMENT ON TABLE stocks IS 'Stores stock data for unique tickers, independent of posts';
COMMENT ON COLUMN posts.tickers IS 'Array of stock tickers mentioned in the post';

-- Create new policies without post_id dependency
CREATE POLICY "Allow admin to update stocks" ON stocks
  FOR UPDATE TO authenticated USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      -- Assuming you want to allow all authenticated users to update stocks
    )
  );

CREATE POLICY "Allow admin to delete stocks" ON stocks
  FOR DELETE TO authenticated USING (
    auth.uid() IN (
      SELECT auth.uid() FROM auth.users
      -- Assuming you want to allow all authenticated users to delete stocks
    )
  ); 