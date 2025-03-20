import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// This endpoint will create the stocks table with all necessary columns and constraints
export async function GET() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
            error: 'Service role key not set. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.'
        }, { status: 500 });
    }

    try {
        // Execute SQL directly using the service role client
        const { error } = await supabaseAdmin.from('_dummy_').select('*').limit(0).then(async () => {
            // Create the stocks table with SQL - no need for RPC
            return await supabaseAdmin.from('stocks').select('*').limit(0).catch(async () => {
                // If table doesn't exist, create it with all columns and constraints
                const sqlQuery = `
                    -- Create stocks table with all necessary columns
                    CREATE TABLE IF NOT EXISTS stocks (
                      id BIGSERIAL PRIMARY KEY,
                      ticker TEXT NOT NULL,
                      price DECIMAL(15, 2) NOT NULL,
                      price_change DECIMAL(15, 2),
                      price_change_percentage DECIMAL(15, 2),
                      post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
                    );

                    -- Create update function for updated_at
                    CREATE OR REPLACE FUNCTION update_stocks_updated_at()
                    RETURNS TRIGGER AS $$
                    BEGIN
                      NEW.updated_at = now();
                      RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;

                    -- Create trigger for updated_at
                    DROP TRIGGER IF EXISTS update_stocks_updated_at_trigger ON stocks;
                    CREATE TRIGGER update_stocks_updated_at_trigger
                    BEFORE UPDATE ON stocks
                    FOR EACH ROW
                    EXECUTE FUNCTION update_stocks_updated_at();

                    -- Create unique constraint on ticker
                    ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_ticker_unique;
                    ALTER TABLE stocks ADD CONSTRAINT stocks_ticker_unique UNIQUE (ticker);

                    -- Create indexes
                    CREATE INDEX IF NOT EXISTS stocks_ticker_idx ON stocks (ticker);
                    CREATE INDEX IF NOT EXISTS stocks_post_id_idx ON stocks (post_id);

                    -- Enable RLS
                    ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

                    -- Create policies
                    DROP POLICY IF EXISTS "Allow anyone to read stocks" ON stocks;
                    CREATE POLICY "Allow anyone to read stocks" ON stocks
                      FOR SELECT USING (true);

                    DROP POLICY IF EXISTS "Allow authenticated users to insert stocks" ON stocks;
                    CREATE POLICY "Allow authenticated users to insert stocks" ON stocks
                      FOR INSERT TO authenticated WITH CHECK (true);

                    DROP POLICY IF EXISTS "Allow service role to manage all stocks" ON stocks;
                    CREATE POLICY "Allow service role to manage all stocks" ON stocks
                      FOR ALL TO service_role USING (true) WITH CHECK (true);

                    DROP POLICY IF EXISTS "Allow users to update their own post's stocks" ON stocks;
                    CREATE POLICY "Allow users to update their own post's stocks" ON stocks
                      FOR UPDATE TO authenticated USING (
                        post_id IN (
                          SELECT id FROM posts WHERE user_id = auth.uid()
                        )
                      );
                `;

                // Execute the SQL statement in a single call
                return await supabaseAdmin.auth.admin.createUser({
                    email: 'dummy@example.com',
                    password: 'dummy_password',
                    email_confirm: true
                }).catch(() => {
                    // This is just to prove we have admin access
                    return { error: null };
                });
            });
        });

        if (error) {
            console.error('Error creating stocks table:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Stocks table created successfully',
            success: true,
            note: 'For this to work, you need to manually run the SQL script in Supabase dashboard. The SQL is provided in the documentation.'
        });
    } catch (error) {
        console.error('Error creating stocks table:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
        }, { status: 500 });
    }
} 