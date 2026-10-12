import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';
import { Writable } from 'stream';

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

  // Dynamic import ensures process.env is populated before src/env.ts validates
  const { getPayload } = await import('payload');
  const { default: configPromise } = await import('../src/payload.config');
  const { STRONG_PASSWORD_REGEX } = await import('../src/collections/Users');

  const payload = await getPayload({ config: configPromise });

  // 1. List users if requested
  if (options.list) {
    const users = await payload.find({
      collection: 'users',
      showHiddenFields: true,
      limit: 100,
    });
    console.log(`\n📋 Registered User(s): ${users.totalDocs}`);
    for (const u of users.docs) {
      const isLocked = (u as any).lockUntil && new Date((u as any).lockUntil) > new Date();
      const statusNote = isLocked ? ' [LOCKED]' : ' [ACTIVE]';
      console.log(`  - [ID: ${u.id}] Email: ${u.email} | Role: ${u.role}${statusNote} | Attempts: ${(u as any).loginAttempts ?? 0}`);
    }
    process.exit(0);
  }

  // 2. Reset ALL admin accounts if requested
  if (options.all) {
    let password = (options.password as string) || process.env.ADMIN_PASSWORD;
    if (!password) {
      password = await promptInput('Enter New Admin Password for ALL admins: ', Boolean(process.stdin.isTTY));
    }
    if (!password) {
      console.error('❌ Error: Admin password is required.');
      process.exit(1);
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      console.error(
        '❌ Error: Password does not meet security requirements.\n' +
        'It must be at least 8 characters long and include at least one letter, one number, and one special character.'
      );
      process.exit(1);
    }

    const adminUsers = await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
      showHiddenFields: true,
      limit: 100,
    });

    console.log(`\n📋 Found ${adminUsers.totalDocs} administrator account(s) to reset.`);
    for (const u of adminUsers.docs) {
      const normEmail = u.email.toLowerCase().trim();
      console.log(`--> Updating credentials for admin: ${normEmail} (ID: ${u.id})...`);
      await payload.update({
        collection: 'users',
        id: u.id,
        data: {
          password,
          role: 'admin',
        },
        overrideAccess: true,
      });

      try {
        await payload.unlock({
          collection: 'users',
          data: { email: normEmail } as any,
          overrideAccess: true,
        });
      } catch {
        // best effort
      }

      try {
        const verifyAuth = await payload.login({
          collection: 'users',
          data: { email: normEmail, password },
        });
        if (verifyAuth && verifyAuth.token) {
          console.log(`✅ [ID: ${u.id}] ${normEmail}: Password updated, account unlocked, login verified.`);
        } else {
          console.warn(`⚠️ [ID: ${u.id}] ${normEmail}: Password updated, but no token returned.`);
        }
      } catch (authErr: any) {
        console.error(`❌ [ID: ${u.id}] ${normEmail}: Login verification failed: ${authErr?.message || authErr}`);
        process.exit(1);
      }
    }

    console.log('\n🎉 All administrator accounts have been updated and verified!\n');
    process.exit(0);
  }

  // 3. Resolve target email
  let email = (options.email as string) || process.env.ADMIN_EMAIL;
  if (!email && process.stdin.isTTY) {
    email = await promptInput('Enter Admin Email (e.g. admin@gmail.com): ');
  }
  if (!email) {
    email = process.env.SEED_ADMIN_EMAIL;
  }

  if (!email) {
    console.error('❌ Error: Admin email is required (via --email, ADMIN_EMAIL, SEED_ADMIN_EMAIL, or interactive input).');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 4. Check if user already exists
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: normalizedEmail } },
    showHiddenFields: true,
    limit: 1,
  });

  const userExists = existingUsers.totalDocs > 0;
  const existing = userExists ? existingUsers.docs[0] : null;

  // If user only wanted to unlock the account
  if (options.unlock && userExists && existing) {
    console.log(`--> Unlocking account for ${normalizedEmail}...`);
    await payload.unlock({
      collection: 'users',
      data: { email: normalizedEmail } as any,
      overrideAccess: true,
    });
    console.log(`✅ Success: Account unlocked and login attempts reset for ${normalizedEmail}.`);
    process.exit(0);
  }

  // 5. Resolve password
  let password = (options.password as string) || process.env.ADMIN_PASSWORD;

  // Determine whether to update an existing user
  let shouldUpdateExisting = Boolean(
    options.reset ||
    process.env.RESET_EXISTING_ADMIN === 'true' ||
    options.password
  );

  if (userExists && !shouldUpdateExisting && process.stdin.isTTY) {
    const confirm = await promptInput(`User ${normalizedEmail} exists. Do you want to update password and unlock? [Y/n]: `);
    if (confirm.toLowerCase() === 'y' || confirm === '') {
      shouldUpdateExisting = true;
    } else {
      console.log(`ℹ️ Operation cancelled. User ${normalizedEmail} remains unchanged.`);
      process.exit(0);
    }
  }

  // If user exists but no reset requested in non-interactive mode
  if (userExists && !shouldUpdateExisting && !password) {
    console.log(`ℹ️ User ${normalizedEmail} already exists (Role: ${existing?.role}).`);
    console.log(`   To reset this user's password, run: npm run admin:setup -- --reset --email ${normalizedEmail} --password <new-password>`);
    process.exit(0);
  }

  // Prompt for password if not provided
  if (!password) {
    const promptLabel = userExists
      ? `Enter New Admin Password for ${normalizedEmail}: `
      : `Enter Admin Password for ${normalizedEmail}: `;
    password = await promptInput(promptLabel, Boolean(process.stdin.isTTY));
  }

  if (!password) {
    console.error('❌ Error: Admin password is required.');
    process.exit(1);
  }

  // 6. Validate password strength
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    console.error(
      '❌ Error: Password does not meet security requirements.\n' +
      'It must be at least 8 characters long and include at least one letter, one number, and one special character.'
    );
    process.exit(1);
  }

  // 7. Execute create or update
  if (userExists && existing) {
    console.log(`--> Updating credentials and admin role for: ${normalizedEmail}...`);
    await payload.update({
      collection: 'users',
      id: existing.id,
      data: {
        password,
        role: 'admin',
      },
      overrideAccess: true,
    });

    // Explicitly unlock and reset login attempts
    try {
      await payload.unlock({
        collection: 'users',
        data: { email: normalizedEmail } as any,
        overrideAccess: true,
      });
    } catch {
      // unlock is best-effort if lock was not active
    }

    console.log(`✅ Success: Password updated and account unlocked for ${normalizedEmail}.`);
  } else {
    console.log(`--> Creating new admin user: ${normalizedEmail}...`);
    await payload.create({
      collection: 'users',
      data: {
        email: normalizedEmail,
        password,
        role: 'admin',
      },
      overrideAccess: true,
    });
    console.log(`✅ Success: Created new admin user ${normalizedEmail}.`);
  }

  // 8. Verify authentication using Payload's official auth engine
  try {
    console.log(`--> Verifying authentication with Payload auth engine...`);
    const loginTest = await payload.login({
      collection: 'users',
      data: {
        email: normalizedEmail,
        password,
      },
    });

    if (loginTest && loginTest.token) {
      console.log(`✅ Verification: Authentication confirmed! Account is active and ready for login.`);
    } else {
      console.warn(`⚠️ Warning: Authentication check completed but no token returned.`);
    }
  } catch (authErr: any) {
    console.error(`❌ Authentication verification failed: ${authErr?.message || authErr}`);
    process.exit(1);
  }

  console.log(`\n🎉 You can now log in at: http://localhost:3000/admin using ${normalizedEmail}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Setup failed:', err?.message || err);
  process.exit(1);
});
