const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const crypto = require('crypto');

// Get environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Calculate hash of migration file for tracking
function getMigrationHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

if (!supabaseKey) {
    console.log('\n⚠️ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    console.log('You need to add your service role key to .env.local');
    console.log('Get it from your Supabase dashboard: Project Settings > API > service_role key\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter your Supabase service role key: ', (key) => {
        rl.close();
        if (key && key.startsWith('eyJ')) {
            // Save to .env.local
            const envContent = fs.readFileSync('.env.local', 'utf8');
            const updatedContent = envContent + `\nSUPABASE_SERVICE_ROLE_KEY=${key}\n`;
            fs.writeFileSync('.env.local', updatedContent);
            console.log('✅ Service role key saved to .env.local');
            runMigrations(supabaseUrl, key);
        } else {
            console.log('❌ Invalid key format. Process aborted.');
        }
    });
} else {
    runMigrations(supabaseUrl, supabaseKey);
}

// Creates the exec_sql function directly using the SQL endpoint
async function createExecSqlFunction(url, key) {
    console.log('⏳ Setting up exec_sql function...');

    // Extract the project ref from the URL
    const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
    if (!projectRef) {
        console.error('❌ Could not extract project reference from URL:', url);
        return false;
    }

    try {
        // Create the SQL function using Supabase's SQL endpoint
        const options = {
            hostname: `${projectRef}.supabase.co`,
            path: '/rest/v1/',  // Use the base REST endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Prefer': 'return=minimal'
            }
        };

        const sqlQuery = `
        DO $$
        BEGIN
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $func$
            BEGIN
              EXECUTE sql;
            END;
            $func$;
            
            REVOKE ALL ON FUNCTION exec_sql(text) FROM public;
        END;
        $$;`;

        const result = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true });
                    } else {
                        reject({ error: data, status: res.statusCode });
                    }
                });
            });

            req.on('error', (error) => {
                reject({ error: error.message });
            });

            req.write(JSON.stringify({ query: sqlQuery }));
            req.end();
        });

        console.log('✅ exec_sql function created successfully');
        return true;
    } catch (err) {
        console.error('❌ Failed to create exec_sql function:', err);
        if (err.status === 404) {
            console.error('The SQL endpoint may not be available. Please create the function manually.');
        } else if (err.status === 405) {
            console.error('Method not allowed. The Supabase API may have changed.');
        }
        return false;
    }
}

async function runMigrations(url, key) {
    if (!url || !key) {
        console.error('❌ Missing Supabase configuration. Check your .env.local file.');
        process.exit(1);
    }

    console.log('🚀 Deploying migrations to Supabase...');

    const supabase = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    if (migrationFiles.length === 0) {
        console.log('❌ No migration files found in supabase/migrations directory.');
        process.exit(1);
    }

    console.log(`📋 Found ${migrationFiles.length} migration files to apply:`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));

    // First, check if the exec_sql function exists
    try {
        console.log('\n⏳ Checking if exec_sql function exists...');

        // Try to call the function with a simple query to test if it exists
        const { error: testError } = await supabase.rpc('exec_sql', {
            sql: 'SELECT 1'
        });

        if (testError && testError.message.includes('Could not find the function')) {
            console.log('⚠️ The exec_sql function does not exist yet.');
            console.log('\n⚠️ Please create the exec_sql function manually in the Supabase SQL Editor:');
            console.log(`
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
            `);
            console.log('After creating the function, run this script again.');
            process.exit(1);
        } else {
            console.log('✅ The exec_sql function already exists');
        }

        // Create migration_history table if it doesn't exist
        try {
            const { error: createTableError } = await supabase.rpc('exec_sql', {
                sql: `
                CREATE TABLE IF NOT EXISTS migration_history (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    hash TEXT NOT NULL,
                    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`
            });

            if (!createTableError) {
                console.log('✅ Migration history table is ready');
            } else {
                console.error('❌ Error creating migration history table:', createTableError);
                // Continue anyway
            }
        } catch (err) {
            console.error('❌ Error setting up migration history table:', err.message);
            // Continue anyway
        }

        // Check which migrations have already been applied
        try {
            const { data: appliedMigrations, error: historyError } = await supabase
                .from('migration_history')
                .select('name, hash');

            if (historyError) {
                console.error('❌ Error fetching migration history:', historyError);
                // Continue anyway and try to apply all migrations
            } else {
                console.log('✅ Fetched migration history');

                // Create a map of applied migrations
                const appliedMap = {};
                if (appliedMigrations) {
                    appliedMigrations.forEach(migration => {
                        appliedMap[migration.name] = migration.hash;
                    });
                }

                // Filter out already applied migrations with same hash
                const pendingMigrations = [];
                for (const file of migrationFiles) {
                    const filePath = path.join(migrationsDir, file);
                    const currentHash = getMigrationHash(filePath);

                    if (appliedMap[file] && appliedMap[file] === currentHash) {
                        console.log(`⏩ Skipping already applied migration: ${file}`);
                    } else {
                        pendingMigrations.push(file);
                    }
                }

                // If no pending migrations, we're done
                if (pendingMigrations.length === 0) {
                    console.log('\n✅ All migrations have already been applied. No changes needed.');
                    process.exit(0);
                }

                // Update the list of migrations to apply
                console.log(`\n📋 Found ${pendingMigrations.length} pending migrations to apply:`);
                pendingMigrations.forEach(file => console.log(`  - ${file}`));

                // Apply each pending migration
                for (const file of pendingMigrations) {
                    const filePath = path.join(migrationsDir, file);
                    const sql = fs.readFileSync(filePath, 'utf8');
                    const currentHash = getMigrationHash(filePath);

                    console.log(`\n⏳ Applying migration: ${file}`);

                    try {
                        const { error } = await supabase.rpc('exec_sql', { sql });

                        if (error) {
                            console.error(`❌ Error in migration ${file}:`, error);
                            console.log('Continuing with next migration...');
                        } else {
                            console.log(`✅ Migration ${file} applied successfully`);

                            // Record this migration in history
                            const { error: recordError } = await supabase
                                .from('migration_history')
                                .upsert({
                                    name: file,
                                    hash: currentHash
                                }, {
                                    onConflict: 'name'
                                });

                            if (recordError) {
                                console.error(`❌ Failed to record migration ${file} in history:`, recordError);
                            }
                        }
                    } catch (err) {
                        console.error(`❌ Failed to apply migration ${file}:`, err.message);
                        console.log('Continuing with next migration...');
                    }
                }

                console.log('\n🎉 Migration process completed!');
                process.exit(0);
            }
        } catch (err) {
            console.error('❌ Error checking migration history:', err.message);
            // Continue anyway
        }
    } catch (err) {
        console.log('⚠️ Error checking for exec_sql function:', err.message);
        console.log('\n⚠️ Please create the exec_sql function manually in the Supabase SQL Editor:');
        console.log(`
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
        `);
        console.log('After creating the function, run this script again.');
        process.exit(1);
    }

    // Apply each migration (fallback if migration history check failed)
    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`\n⏳ Applying migration: ${file}`);

        try {
            const { error } = await supabase.rpc('exec_sql', { sql });

            if (error) {
                console.error(`❌ Error in migration ${file}:`, error);
                console.log('Continuing with next migration...');
            } else {
                console.log(`✅ Migration ${file} applied successfully`);

                // Try to record this migration in history
                try {
                    const currentHash = getMigrationHash(filePath);
                    const { error: recordError } = await supabase
                        .from('migration_history')
                        .upsert({
                            name: file,
                            hash: currentHash
                        }, {
                            onConflict: 'name'
                        });

                    if (recordError) {
                        console.error(`❌ Failed to record migration ${file} in history:`, recordError);
                    }
                } catch (err) {
                    console.error(`❌ Failed to record migration ${file} in history:`, err.message);
                }
            }
        } catch (err) {
            console.error(`❌ Failed to apply migration ${file}:`, err.message);
            console.log('Continuing with next migration...');
        }
    }

    console.log('\n🎉 Migration process completed!');
} 