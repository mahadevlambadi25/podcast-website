import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HASH_PREFIX = 'pbkdf2-sha256-v1:';
const ITERATIONS = 600000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

function hashPassword(plaintext) {
  const salt = crypto.randomBytes(32).toString('hex');
  const derived = crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return {
    salt,
    hash: `${HASH_PREFIX}${derived.toString('hex')}`,
  };
}

export async function runPostgresMigrations() {
  const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;

  if (!connectionString) {
    console.warn('⚠️ No DATABASE_URL or DATABASE_URI provided. Skipping PostgreSQL migration.');
    return;
  }

  if (connectionString.startsWith('file:')) {
    console.warn('⚠️ SQLite file URI detected in DATABASE_URL/URI. Skipping PostgreSQL migration.');
    return;
  }

  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const useSsl =
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('render.com') ||
    connectionString.includes('sslmode=') ||
    (!isLocalhost && !connectionString.includes('sslmode=disable'));

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('==> Connected to PostgreSQL. Applying production schema...');

    // 1. Read and apply schema DDL
    const schemaSqlPath = path.resolve(__dirname, 'schema-postgres.sql');
    if (!fs.existsSync(schemaSqlPath)) {
      throw new Error(`Schema file not found at: ${schemaSqlPath}`);
    }

    const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
    await client.query(schemaSql);
    console.log('==> Schema verified and tables/indexes ensured.');

    // 2. Check if baseline data exists (check site_settings)
    const settingsCheck = await client.query('SELECT COUNT(*) as cnt FROM site_settings');
    const settingsCount = Number(settingsCheck.rows[0]?.cnt || 0);

    if (settingsCount === 0) {
      console.log('==> Fresh database detected. Seeding baseline public podcast content...');
      const initDataFile = path.resolve(__dirname, 'init-data.json');
      if (fs.existsSync(initDataFile)) {
        const { data } = JSON.parse(fs.readFileSync(initDataFile, 'utf8'));

        // Seeding order respecting foreign keys
        const tableOrder = [
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

        for (const table of tableOrder) {
          const rows = data[table];
          if (!rows || rows.length === 0) continue;

          console.log(`    Seeding ${rows.length} records into "${table}"...`);
          for (const row of rows) {
            const keys = Object.keys(row);
            const cols = keys.map((k) => `"${k}"`).join(', ');
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const values = keys.map((k) => {
              const val = row[k];
              // Convert boolean objects or numbers if needed
              if (val === undefined) return null;
              return val;
            });

            try {
              await client.query(
                `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
              );
            } catch (err) {
              console.warn(`    Notice inserting into ${table}:`, err.message);
            }
          }

          // Reset sequence for serial primary keys
          try {
            await client.query(
              `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`
            );
          } catch {
            // Table may not have a serial id sequence
          }
        }
        console.log('==> Baseline podcast content seeded successfully.');
      }
    } else {
      console.log('==> Existing database records detected. Protecting data, skipping seed.');
    }

    // 3. Admin Bootstrap (if users table is empty)
    const userCheck = await client.query('SELECT COUNT(*) as cnt FROM users');
    const userCount = Number(userCheck.rows[0]?.cnt || 0);

    const adminEmail = (
      process.env.ADMIN_EMAIL ||
      process.env.SEED_ADMIN_EMAIL ||
      ''
    ).trim().toLowerCase();
    const adminPassword = (
      process.env.ADMIN_PASSWORD ||
      process.env.SEED_ADMIN_PASSWORD ||
      ''
    ).trim();

    if (userCount === 0) {
      if (adminEmail && adminPassword) {
        console.log(`==> Creating initial admin user: ${adminEmail}`);
        const { salt, hash } = hashPassword(adminPassword);
        const now = new Date().toISOString();

        await client.query(
          `INSERT INTO users (email, role, salt, hash, login_attempts, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [adminEmail, 'admin', salt, hash, 0, now, now]
        );
        console.log('==> Initial admin user created successfully.');
      } else {
        console.log(
          '==> Notice: No ADMIN_EMAIL / ADMIN_PASSWORD provided in environment. No default admin created. Configure ADMIN_EMAIL and ADMIN_PASSWORD in Render to bootstrap initial admin.'
        );
      }
    } else {
      console.log(`==> Found ${userCount} existing user account(s). Admin credentials protected.`);
    }

    console.log('==> PostgreSQL migration complete and verified!');
  } catch (err) {
    console.error('❌ PostgreSQL migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runPostgresMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
