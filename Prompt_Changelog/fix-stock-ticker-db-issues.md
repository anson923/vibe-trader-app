# Fix Stock Ticker Database Issues

## Problem
When fetching data for NVD ticker using Puppeteer, the application successfully retrieves the data, but fails to insert it into the stocks table. This issue occurs because:

1. The stocks table doesn't exist in the database
2. The environment variables in `.env.local` were incorrectly formatted
3. The application lacks proper permissions to insert data into the table due to Row Level Security (RLS) policies

## Changes Made

### Environment Variable Fixes
- Fixed formatting issues in `.env.local` file
- Removed quotes around environment variable values
- Eliminated hidden/corrupted characters

### Database Structure Updates
- Created a new SQL migration file: `supabase/migrations/create_stocks_table.sql`
- Added the `price_change` column to the stocks table 
- Implemented an automatic timestamp update function for the `updated_at` column
- Changed the unique constraint from `(post_id, ticker)` to just `ticker` for better caching
- Added appropriate indexes for improved query performance

### Service Role Authentication
- Created a Supabase Admin client in `lib/supabase-admin.ts` that uses the service role key
- Updated stock data saving functions to use the admin client to bypass RLS policies
- Added better error handling for database operations

### API Enhancements
- Created a new endpoint `/api/create-stocks-table` to initialize the stocks table
- Modified the stocks API to save fetched data directly to the database
- Implemented proper caching based on the `updated_at` timestamp
- Improved error handling and fallback mechanisms

## Required Setup

1. Make sure your `.env.local` file has the following variables properly set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the SQL migration script in the Supabase SQL Editor:
   - Copy the contents of `supabase/migrations/create_stocks_table.sql`
   - Open the Supabase Dashboard > SQL Editor
   - Paste and execute the SQL

3. Restart your application with:
   ```
   npm run dev
   ```

## Testing the Fix

1. Create a new post with stock ticker `$NVD`
2. Verify that:
   - The stock data is fetched correctly
   - The data is displayed in the stock badge component
   - The data is saved to the stocks table in the database
   - Subsequent posts with the same ticker reuse the cached data

## Security Considerations

The `SUPABASE_SERVICE_ROLE_KEY` has full access to your database, bypassing RLS policies. Keep this key secure:

- Never expose it to client-side code
- Only use it in server-side API routes
- Regularly rotate the key according to your security policies 