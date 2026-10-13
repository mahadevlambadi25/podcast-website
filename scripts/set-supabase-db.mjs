import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envLocalPath = path.resolve(process.cwd(), '.env.local');

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

const inputUrl = process.argv[2]?.trim();

if (!inputUrl) {
  console.log('='.repeat(70));
  console.log('  UNCHARTERED PODCAST — SUPABASE DATABASE CONFIGURATION TOOL');
  console.log('='.repeat(70));
  console.log('Usage:');
  console.log('  node ./scripts/set-supabase-db.mjs "<YOUR-SUPABASE-CONNECTION-STRING>"');
  console.log('\nExample (Session Pooler):');
  console.log('  node ./scripts/set-supabase-db.mjs "postgresql://postgres.yourref:yourpass@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"');
  console.log('\nWhere to find it in Supabase:');
  console.log('  Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI (Session Pooler)');
  console.log('='.repeat(70));
  process.exit(1);
}

// Ensure sslmode=require is set for remote connections
let finalUrl = sanitizeDatabaseUrl(inputUrl);
if (!finalUrl.includes('localhost') && !finalUrl.includes('127.0.0.1') && !finalUrl.includes('sslmode=')) {
  finalUrl += finalUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}

if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, `DATABASE_URL="${finalUrl}"\n`, 'utf8');
} else {
  let content = fs.readFileSync(envLocalPath, 'utf8');
  if (/^DATABASE_URL\s*=/m.test(content)) {
    content = content.replace(/^DATABASE_URL\s*=.*$/m, `DATABASE_URL="${finalUrl}"`);
  } else {
    content = `DATABASE_URL="${finalUrl}"\n` + content;
  }
  fs.writeFileSync(envLocalPath, content, 'utf8');
}

console.log('✅ Successfully updated DATABASE_URL in .env.local');
console.log('Running connection test now...\n');

try {
  execSync('node ./scripts/test-db-connection.mjs', { stdio: 'inherit' });
} catch (e) {
  // test-db-connection will have printed the error details
  process.exit(1);
}
