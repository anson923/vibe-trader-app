-- Create stocks table to store stock ticker information
CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  price DECIMAL(15, 2) NOT NULL, 
  price_change_percentage DECIMAL(15, 2) NOT NULL,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique constraint to prevent duplicate stock entries for the same post
CREATE UNIQUE INDEX IF NOT EXISTS stocks_post_id_ticker_idx ON stocks (post_id, ticker);

-- Create index for faster lookups by ticker
CREATE INDEX IF NOT EXISTS stocks_ticker_idx ON stocks (ticker);

-- Enable Row Level Security
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Create policies for stocks security
-- Allow anyone to read all stocks
CREATE POLICY "Allow anyone to read stocks" ON stocks
  FOR SELECT USING (true);

-- Allow authenticated users to insert stocks
CREATE POLICY "Allow authenticated users to insert stocks" ON stocks
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update stocks for their own posts
CREATE POLICY "Allow users to update their own post's stocks" ON stocks
  FOR UPDATE TO authenticated USING (
    post_id IN (
      SELECT id FROM posts WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete stocks for their own posts
CREATE POLICY "Allow users to delete their own post's stocks" ON stocks
  FOR DELETE TO authenticated USING (
    post_id IN (
      SELECT id FROM posts WHERE user_id = auth.uid()
    )
  ); 