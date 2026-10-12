import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HASH_PREFIX = 'pbkdf2-sha256-v1:';
const ITERATIONS = 600000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

function hashPasswordSync(plaintext) {
  const salt = crypto.randomBytes(32).toString('hex');
  const derived = crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return {
    salt,
    hash: `${HASH_PREFIX}${derived.toString('hex')}`,
  };
}

export async function ensureDatabase() {
  const rawUri = process.env.DATABASE_URI || 'file:./payload.db';
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  let url = rawUri;
  if (rawUri.startsWith('file:')) {
    const rawPath = rawUri.slice(5);
    const absPath = path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath);
    url = `file:${absPath}`;
  }

  const db = createClient({
    url,
    authToken,
  });

  try {
    // 1. Check if database tables already exist
    const tableCheck = await db.execute(
      "SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='users'"
    );

    const count = Number(tableCheck.rows[0]?.cnt || 0);
    if (count > 0) {
      console.log('==> Database already initialized. Skipping bootstrap to protect existing records.');
      return;
    }

    console.log('==> Fresh database detected. Bootstrapping baseline schema and public content...');
    const dataFilePath = path.resolve(__dirname, 'init-data.json');
    if (!fs.existsSync(dataFilePath)) {
      console.warn('⚠️ scripts/init-data.json not found. Skipping bootstrap.');
      return;
    }

    const { ddl, indexes, data } = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // 2. Create tables
    for (const sql of ddl) {
      const safeSql = sql.replace(/^CREATE TABLE\s+(?!IF NOT EXISTS\b)/i, 'CREATE TABLE IF NOT EXISTS ');
      try {
        await db.execute(safeSql);
      } catch (err) {
        if (!err.message?.includes('already exists')) {
          throw err;
        }
      }
    }

    // 3. Create indexes
    for (const sql of indexes || []) {
      try {
        await db.execute(sql);
      } catch {
        // Ignore duplicate index notice
      }
    }

    // 4. Insert public baseline content (episodes, guests, topics, site_settings, media)
    for (const [table, rows] of Object.entries(data)) {
      if (!rows || rows.length === 0) continue;

      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map((k) => `"${k}"`).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => row[k]);

        await db.execute({
          sql: `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})`,
          args: values,
        });
      }
    }

    // 5. Dynamically seed admin account from environment variables if provided
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = (process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || '').trim();

    if (adminEmail && adminPassword) {
      console.log(`==> Dynamically seeding admin account: ${adminEmail}`);
      const { salt, hash } = hashPasswordSync(adminPassword);
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO users (role, email, salt, hash, created_at, updated_at, login_attempts) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: ['admin', adminEmail, salt, hash, now, now, 0],
      });
      console.log('==> Admin account created successfully in fresh database.');
    } else {
      console.log('==> Notice: No ADMIN_EMAIL/ADMIN_PASSWORD provided in environment. No default credentials seeded.');
    }

    console.log('==> Database bootstrap completed successfully!');
  } catch (err) {
    console.error('❌ Failed during database bootstrap:', err);
    throw err;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  ensureDatabase().catch((err) => {
    console.error('❌ Database bootstrap failed:', err);
    process.exit(1);
  });
}
