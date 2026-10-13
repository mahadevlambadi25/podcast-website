import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { parse } from 'pg-connection-string';

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

/**
 * Versioned, idempotent migration definitions.
 * Each migration is executed once within a transaction and recorded in schema_migrations.
 */
const MIGRATIONS = [
  {
    version: '20261013_001_base_schema',
    name: 'Ensure canonical tables, indexes, and constraints',
    up: async (client) => {
      const schemaSqlPath = path.resolve(__dirname, 'schema-postgres.sql');
      if (!fs.existsSync(schemaSqlPath)) {
        throw new Error(`Schema file not found at: ${schemaSqlPath}`);
      }
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      await client.query(schemaSql);
    },
  },
  {
    version: '20261013_002_guests_schema_parity',
    name: 'Add biography and missing metadata columns to guests with safe backfill',
    up: async (client) => {
      // 1. Add missing columns safely
      await client.query(`
        ALTER TABLE guests
          ADD COLUMN IF NOT EXISTS biography TEXT,
          ADD COLUMN IF NOT EXISTS bio TEXT,
          ADD COLUMN IF NOT EXISTS portrait_alt TEXT,
          ADD COLUMN IF NOT EXISTS portrait_credit TEXT,
          ADD COLUMN IF NOT EXISTS links_linkedin TEXT,
          ADD COLUMN IF NOT EXISTS links_website TEXT,
          ADD COLUMN IF NOT EXISTS links_other TEXT,
          ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
          ADD COLUMN IF NOT EXISTS twitter_url TEXT,
          ADD COLUMN IF NOT EXISTS website_url TEXT,
          ADD COLUMN IF NOT EXISTS social_image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS canonical_override TEXT;
      `);

      // 2. Safe bidirectional backfill
      await client.query(`
        UPDATE guests
        SET biography = bio
        WHERE (biography IS NULL OR biography = '') AND bio IS NOT NULL;

        UPDATE guests
        SET bio = biography
        WHERE (bio IS NULL OR bio = '') AND biography IS NOT NULL;

        UPDATE guests
        SET links_linkedin = linkedin_url
        WHERE (links_linkedin IS NULL OR links_linkedin = '') AND linkedin_url IS NOT NULL;

        UPDATE guests
        SET links_website = website_url
        WHERE (links_website IS NULL OR links_website = '') AND website_url IS NOT NULL;
      `);
    },
  },
  {
    version: '20261013_003_media_schema_parity',
    name: 'Add missing columns to media and sync thumbnail and responsive variants',
    up: async (client) => {
      await client.query(`
        ALTER TABLE media
          ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
          ADD COLUMN IF NOT EXISTS thumbnail_u_r_l TEXT,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_url TEXT,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_width NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_height NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_mime_type TEXT,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_filesize NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_thumbnail_filename TEXT,
          ADD COLUMN IF NOT EXISTS sizes_portrait_url TEXT,
          ADD COLUMN IF NOT EXISTS sizes_portrait_width NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_portrait_height NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_portrait_mime_type TEXT,
          ADD COLUMN IF NOT EXISTS sizes_portrait_filesize NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_portrait_filename TEXT,
          ADD COLUMN IF NOT EXISTS sizes_og_url TEXT,
          ADD COLUMN IF NOT EXISTS sizes_og_width NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_og_height NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_og_mime_type TEXT,
          ADD COLUMN IF NOT EXISTS sizes_og_filesize NUMERIC,
          ADD COLUMN IF NOT EXISTS sizes_og_filename TEXT;
      `);

      await client.query(`
        UPDATE media
        SET thumbnail_url = COALESCE(thumbnail_url, thumbnail_u_r_l, url)
        WHERE thumbnail_url IS NULL;

        UPDATE media
        SET thumbnail_u_r_l = COALESCE(thumbnail_u_r_l, thumbnail_url, url)
        WHERE thumbnail_u_r_l IS NULL;
      `);
    },
  },
  {
    version: '20261013_004_nominations_schema_parity',
    name: 'Add internal_notes, consent, and delivery fields to nominations',
    up: async (client) => {
      await client.query(`
        ALTER TABLE nominations
          ADD COLUMN IF NOT EXISTS internal_notes TEXT,
          ADD COLUMN IF NOT EXISTS consent INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS consent_timestamp TEXT,
          ADD COLUMN IF NOT EXISTS email_delivery_failed INTEGER DEFAULT 0;
      `);
    },
  },
  {
    version: '20261013_005_contact_messages_schema_parity',
    name: 'Add consent, subject, and delivery tracking to contact_messages',
    up: async (client) => {
      await client.query(`
        ALTER TABLE contact_messages
          ADD COLUMN IF NOT EXISTS subject TEXT,
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread',
          ADD COLUMN IF NOT EXISTS consent INTEGER DEFAULT 1,
          ADD COLUMN IF NOT EXISTS consent_timestamp TEXT,
          ADD COLUMN IF NOT EXISTS email_delivery_failed INTEGER DEFAULT 0;
      `);
    },
  },
  {
    version: '20261013_006_site_settings_schema_parity',
    name: 'Add complete branding, host, and media relation columns to site_settings',
    up: async (client) => {
      await client.query(`
        ALTER TABLE site_settings
          ADD COLUMN IF NOT EXISTS logo_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS default_og_image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS host_portrait_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS featured_episode_override_id INTEGER REFERENCES episodes(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS has_host_section INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS host_name TEXT,
          ADD COLUMN IF NOT EXISTS host_role TEXT,
          ADD COLUMN IF NOT EXISTS host_bio TEXT,
          ADD COLUMN IF NOT EXISTS about_mission TEXT,
          ADD COLUMN IF NOT EXISTS about_audience TEXT,
          ADD COLUMN IF NOT EXISTS about_editorial TEXT,
          ADD COLUMN IF NOT EXISTS privacy_policy_content TEXT,
          ADD COLUMN IF NOT EXISTS terms_content TEXT,
          ADD COLUMN IF NOT EXISTS analytics_id TEXT,
          ADD COLUMN IF NOT EXISTS nomination_recipient_email TEXT,
          ADD COLUMN IF NOT EXISTS nomination_webhook_url TEXT;
      `);
    },
  },
  {
    version: '20261013_007_episodes_schema_parity',
    name: 'Ensure all episode metadata, thumbnail relation, and SEO columns exist',
    up: async (client) => {
      await client.query(`
        ALTER TABLE episodes
          ADD COLUMN IF NOT EXISTS youtube_url TEXT,
          ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
          ADD COLUMN IF NOT EXISTS fallback_watch_url TEXT,
          ADD COLUMN IF NOT EXISTS short_summary TEXT,
          ADD COLUMN IF NOT EXISTS description TEXT,
          ADD COLUMN IF NOT EXISTS thumbnail_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS episode_number NUMERIC,
          ADD COLUMN IF NOT EXISTS season NUMERIC,
          ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS transcript TEXT,
          ADD COLUMN IF NOT EXISTS featured INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
          ADD COLUMN IF NOT EXISTS seo_title TEXT,
          ADD COLUMN IF NOT EXISTS seo_description TEXT,
          ADD COLUMN IF NOT EXISTS canonical_override TEXT;
      `);
    },
  },
  {
    version: '20261013_008_users_schema_parity',
    name: 'Ensure user authentication, lockout, and password reset fields exist',
    up: async (client) => {
      await client.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'editor',
          ADD COLUMN IF NOT EXISTS salt TEXT,
          ADD COLUMN IF NOT EXISTS hash TEXT,
          ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS lock_until TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
          ADD COLUMN IF NOT EXISTS reset_password_expiration TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS reset_password_requested_at TEXT;
      `);
    },
  },
];

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

  function sanitizeDatabaseUrl(urlStr) {
    if (!urlStr) return urlStr;
    const match = urlStr.match(
      /^(postgres(?:ql)?:\/\/)([^:]+):(.*)@([^:\/@]+)(?::(\d+))?(\/.*)?$/
    );
    if (!match) return urlStr;
    const [, proto, user, rawPassword, host, port, rest] = match;
    let encodedPassword = rawPassword;
    try {
      encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
    } catch {}
    return `${proto}${user}:${encodedPassword}@${host}${port ? `:${port}` : ''}${rest || ''}`;
  }

  connectionString = sanitizeDatabaseUrl(connectionString);

  const isLocalhost =
    connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const useSsl =
    connectionString.includes('sslmode=require') ||
    (!isLocalhost &&
      (process.env.NODE_ENV === 'production' ||
        connectionString.includes('render.com') ||
        connectionString.includes('supabase.co') ||
        connectionString.includes('pooler.supabase.com')) &&
      !connectionString.includes('sslmode=disable'));

  let sslConfig = false;
  if (useSsl) {
    const caPath =
      process.env.DATABASE_CA_CERT ||
      process.env.SUPABASE_CA_CERT ||
      process.env.PGSSLROOTCERT;
    const defaultCertsPath = path.resolve(process.cwd(), 'certs/supabase-ca.crt');

    if (caPath && fs.existsSync(caPath)) {
      sslConfig = { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
    } else if (fs.existsSync(defaultCertsPath)) {
      sslConfig = { ca: fs.readFileSync(defaultCertsPath, 'utf8'), rejectUnauthorized: true };
    } else {
      sslConfig = { rejectUnauthorized: false };
    }
  }

  const parsed = parse(connectionString);
  delete parsed.connectionString;

  const pool = new Pool({
    ...parsed,
    ssl: sslConfig,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('==> Connected to PostgreSQL. Initializing migration tracker...');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    // Fetch already applied migrations
    const appliedRes = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRes.rows.map((r) => r.version));

    // 2. Execute pending versioned migrations inside transactions
    for (const migration of MIGRATIONS) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      console.log(`==> Applying migration [${migration.version}]: ${migration.name}...`);
      await client.query('BEGIN');
      try {
        await migration.up(client);
        await client.query(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())',
          [migration.version, migration.name]
        );
        await client.query('COMMIT');
        console.log(`    ✓ [${migration.version}] applied successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration [${migration.version}] failed:`, err.message);
        throw err;
      }
    }

    console.log('==> Schema verified and all versioned migrations up to date.');

    // 3. Check if baseline seeding is needed (only if site_settings has 0 records)
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

    // 4. Admin Bootstrap (only if users table has 0 users)
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
