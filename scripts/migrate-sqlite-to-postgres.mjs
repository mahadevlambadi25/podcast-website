import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { runPostgresMigrations } from './migrate-postgres.mjs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically load .env.local first, then fall back to .env for standalone script runs
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export async function migrateDataToPostgres() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;

  if (!connectionString || connectionString.startsWith('file:')) {
    console.error('❌ Please set DATABASE_URL to a valid PostgreSQL connection string.');
    process.exit(1);
  }

  // 1. Ensure migrations are applied first
  console.log('==> Ensuring PostgreSQL schema and migrations before data transfer...');
  await runPostgresMigrations();

  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const useSsl =
    connectionString.includes('sslmode=require') ||
    (!isLocalhost &&
      (process.env.NODE_ENV === 'production' ||
        connectionString.includes('render.com') ||
        connectionString.includes('supabase.co')) &&
      !connectionString.includes('sslmode=disable'));

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 1,
  });

  const client = await pool.connect();

  try {
    const dataFilePath = path.resolve(__dirname, 'init-data.json');
    if (!fs.existsSync(dataFilePath)) {
      throw new Error(`Data file not found at ${dataFilePath}`);
    }

    const { data } = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    const tables = [
      'users',
      'media',
      'topics',
      'guests',
      'guests_alternate_names',
      'guests_key_insights',
      'guests_rels',
      'episodes',
      'episodes_key_takeaways',
      'episodes_quotes',
      'episodes_tags',
      'episodes_rels',
      'site_settings',
      'redirects',
      'nominations',
      'contact_messages',
      'audit_logs',
    ];

    console.log('==> Starting data transfer to PostgreSQL...');

    for (const table of tables) {
      const rows = data[table];
      if (!rows || rows.length === 0) continue;

      console.log(`    Importing ${rows.length} rows into "${table}"...`);

      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const values = keys.map((k) => (row[k] === undefined ? null : row[k]));

        try {
          await client.query(
            `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        } catch (err) {
          console.warn(`    Notice inserting row into "${table}":`, err.message);
        }
      }

      // Reset sequence
      try {
        await client.query(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`
        );
      } catch {
        // Table might not have serial PK
      }
    }

    console.log('==> Data migration to PostgreSQL completed successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  migrateDataToPostgres().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
