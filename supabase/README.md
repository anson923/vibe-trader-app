# Supabase Migration Setup

This project uses Supabase as a remote PostgreSQL database. The migrations are managed through a smart script that connects directly to your Supabase instance and runs automatically during deployment, with intelligent tracking to avoid duplicate migrations.

## Key Files

- `supabase/config.toml` - Configuration for the Supabase CLI
- `scripts/deploy-migrations.js` - Script that intelligently deploys migrations
- `supabase/migrations/*.sql` - SQL migration files

## Smart Migration System

The migration system includes these key features:

1. **Migration Tracking**: Tracks applied migrations in a database table
2. **Content Hashing**: Uses MD5 hash to detect changes in migration files
3. **Skip Applied Migrations**: Only applies migrations that haven't been run yet
4. **Automatic Deployment**: Runs during build process without manual intervention

## Available Commands

- `npm run build` - Automatically runs migrations first, then builds the app
- `npm run db:migrate` - Manually run pending migrations
- `npm run db:new` - Create a new migration file
- `npm run db:status` - Check for schema differences between local and remote
- `npm run db:reset` - Reset your remote database (use with caution!)

## Initial Setup

Before using the migration system, you need to perform these one-time setup steps:

1. **Create the exec_sql Function**
   ```sql
   CREATE OR REPLACE FUNCTION exec_sql(sql text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     EXECUTE sql;
   END;
   $$;
   
   REVOKE ALL ON FUNCTION exec_sql(text) FROM public;
   ```

2. **Add Your Service Role Key**
   Add the following to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Working With Migrations

1. **Creating a Migration**
   ```
   npm run db:new my_migration_name
   ```
   This creates a timestamped SQL file in `supabase/migrations/`.

2. **Editing Migrations**
   Edit the SQL file directly with your schema changes.

3. **Testing Migrations Locally**
   ```
   npm run db:migrate
   ```
   This applies only new or changed migrations to your remote Supabase database.

4. **During Deployment**
   - Migrations run automatically during the build process
   - Only new or changed migrations are applied
   - All applied migrations are tracked to prevent duplication

## How Migration Tracking Works

The system:
1. Creates a `migration_history` table to track applied migrations
2. Calculates a hash of each migration file to detect changes
3. Only applies migrations that haven't been run or have changed
4. Updates the history table after each successful migration

## Troubleshooting

If you encounter errors:

1. **Access Issues**: Make sure your service role key is correctly set in `.env.local`
2. **Missing exec_sql Function**: Create the function manually using the SQL above
3. **SQL Errors**: Check the error messages and fix the SQL in your migration files
4. **Duplicate Migrations**: The system should prevent this, but if you see errors, check for duplicate migrations

## Security Note

Your service role key has admin privileges. Never commit it to your repository or share it publicly. 