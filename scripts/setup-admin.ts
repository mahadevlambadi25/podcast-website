import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';
import { Writable } from 'stream';
import { db } from '../src/lib/db/client';
import { hashPassword, validatePasswordStrength } from '../src/lib/auth/password';

// Automatically load .env.local first, then fall back to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--list') {
      options.list = true;
    } else if (arg === '--all' || arg === '--reset-all') {
      options.all = true;
      options.reset = true;
    } else if (arg === '--reset' || arg === '--update') {
      options.reset = true;
    } else if (arg === '--unlock') {
      options.unlock = true;
    } else if (arg === '--email' && args[i + 1]) {
      options.email = args[++i];
    } else if (arg === '--password' && args[i + 1]) {
      options.password = args[++i];
    }
  }

  return options;
}

async function promptInput(question: string, hidden: boolean = false): Promise<string> {
  return new Promise((resolve) => {
    if (!hidden || !process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdout.write(question);
    const mutableStdout = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const options = parseArgs();

  // 1. List users
  if (options.list) {
    const res = await db.execute('SELECT id, email, role, lock_until, login_attempts FROM users ORDER BY id ASC');
    console.log(`\n📋 Registered User(s): ${res.rows.length}`);
    for (const u of res.rows) {
      const isLocked = u.lock_until && new Date(u.lock_until) > new Date();
      const statusNote = isLocked ? ' [LOCKED]' : ' [ACTIVE]';
      console.log(`  - [ID: ${u.id}] Email: ${u.email} | Role: ${u.role}${statusNote} | Attempts: ${u.login_attempts ?? 0}`);
    }
    process.exit(0);
  }

  // 2. Email determination
  let email = (options.email as string) || process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL;
  if (!email && !options.all) {
    email = await promptInput('Enter Administrator Email: ');
  }

  if (!options.all && (!email || !email.includes('@'))) {
    console.error('❌ Error: A valid email address is required.');
    process.exit(1);
  }

  // 3. Password determination
  let password = (options.password as string) || process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    password = await promptInput('Enter Administrator Password: ', Boolean(process.stdin.isTTY));
  }

  if (!password) {
    console.error('❌ Error: Administrator password cannot be empty.');
    process.exit(1);
  }

  const passCheck = validatePasswordStrength(password);
  if (!passCheck.valid) {
    console.error(`❌ Error: ${passCheck.message}`);
    process.exit(1);
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const now = new Date().toISOString();
  const { salt, hash } = await hashPassword(password);

  if (options.all) {
    const adminRes = await db.execute("SELECT id, email FROM users WHERE role = 'admin'");
    console.log(`\n📋 Resetting ${adminRes.rows.length} administrator account(s)...`);
    for (const a of adminRes.rows) {
      await db.execute({
        sql: 'UPDATE users SET salt = ?, hash = ?, login_attempts = 0, lock_until = NULL, updated_at = ? WHERE id = ?',
        args: [salt, hash, now, a.id],
      });
      console.log(`  ✅ Successfully updated admin [ID: ${a.id}] (${a.email})`);
    }
    process.exit(0);
  }

  // Check if target user exists
  const userRes = await db.execute({
    sql: 'SELECT id, email, role FROM users WHERE LOWER(email) = ? LIMIT 1',
    args: [cleanEmail],
  });

  if (userRes.rows.length > 0) {
    const existing = userRes.rows[0];
    console.log(`\n🔄 Updating existing user [ID: ${existing.id}] (${existing.email}) to role: admin...`);
    await db.execute({
      sql: 'UPDATE users SET role = ?, salt = ?, hash = ?, login_attempts = 0, lock_until = NULL, updated_at = ? WHERE id = ?',
      args: ['admin', salt, hash, now, existing.id],
    });
    console.log('✅ Admin credentials updated and account unlocked successfully!');
  } else {
    console.log(`\n➕ Creating new administrator account for: ${cleanEmail}`);
    await db.execute({
      sql: 'INSERT INTO users (email, role, salt, hash, login_attempts, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
      args: [cleanEmail, 'admin', salt, hash, now, now],
    });
    console.log('✅ New administrator account created successfully!');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error in setup-admin:', err);
  process.exit(1);
});
