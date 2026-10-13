import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import dns from 'dns/promises';
import { parse } from 'pg-connection-string';

const { Client } = pg;

// 1. Load environment variables with exact Next.js priority (.env.local overrides .env)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

let loadedFrom = 'none';
const localEnv = {};
const rootEnv = {};

if (fs.existsSync(envPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  Object.assign(rootEnv, parsed);
}

if (fs.existsSync(envLocalPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envLocalPath));
  Object.assign(localEnv, parsed);
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

let connectionString = process.env.DATABASE_URL || process.env.DATABASE_URI;
let fileModTime = null;

if (connectionString) {
  loadedFrom = 'process.env (Shell / Environment Variable)';
} else if (localEnv.DATABASE_URL || localEnv.DATABASE_URI) {
  connectionString = localEnv.DATABASE_URL || localEnv.DATABASE_URI;
  loadedFrom = '.env.local';
  if (fs.existsSync(envLocalPath)) {
    fileModTime = fs.statSync(envLocalPath).mtime.toISOString();
  }
} else if (rootEnv.DATABASE_URL || rootEnv.DATABASE_URI) {
  connectionString = rootEnv.DATABASE_URL || rootEnv.DATABASE_URI;
  loadedFrom = '.env';
  if (fs.existsSync(envPath)) {
    fileModTime = fs.statSync(envPath).mtime.toISOString();
  }
}

console.log('='.repeat(70));
console.log('  UNCHARTERED PODCAST — DATABASE CONNECTION DIAGNOSTIC TOOL');
console.log('='.repeat(70));
console.log(`Active Environment Source : ${loadedFrom}`);
if (fileModTime) {
  console.log(`Source Last Modified      : ${fileModTime}`);
}

if (!connectionString) {
  console.error('\n❌ ERROR: No DATABASE_URL or DATABASE_URI configured in .env.local or .env');
  process.exit(1);
}

// Check for unreplaced placeholder tokens
const hasPlaceholders =
  connectionString.includes('[') ||
  connectionString.includes(']') ||
  connectionString.includes('YOUR-');

if (hasPlaceholders) {
  console.log('\n❌ CONFIGURATION REQUIRED: DATABASE_URL contains unreplaced placeholders (e.g. [YOUR-PROJECT-REF] or [PASSWORD]).');
  console.log('   Please replace placeholders in .env.local with your real Supabase connection string:');
  console.log('     DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"');
  console.log('\n   Or run:');
  console.log('     npm run db:set "<YOUR-SUPABASE-CONNECTION-STRING>"');
  console.log('='.repeat(70));
  process.exit(1);
}

// 2. Safe Parsing (NEVER logs credentials)
const sanitizedUrl = sanitizeDatabaseUrl(connectionString);
let parsedUrl;
let parseError = null;

try {
  parsedUrl = new URL(sanitizedUrl);
} catch (e) {
  parseError = e.message;
}

if (parseError || !parsedUrl) {
  console.error(`\n❌ URL Parse Error: ${parseError}`);
  console.log('Hint: Check for unencoded special characters in your password (e.g. #, @, %, ?, :)');
  process.exit(1);
}

const host = parsedUrl.hostname;
const port = parsedUrl.port || '5432';
const database = parsedUrl.pathname.replace(/^\//, '');
const username = parsedUrl.username;
const passwordLength = parsedUrl.password ? parsedUrl.password.length : 0;
const hasSpecialChars = parsedUrl.password ? /[^a-zA-Z0-9]/.test(parsedUrl.password) : false;
const hasUnencodedChars = parsedUrl.password ? /[#@:/?&%]/.test(parsedUrl.password) : false;

// Determine connection method
let connectionMethod = 'Custom / Other PostgreSQL';
let isSupabaseDirect = false;
let isSupabasePooler = false;
let isRender = false;
let isLocal = false;

if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
  connectionMethod = 'Local PostgreSQL (localhost)';
  isLocal = true;
} else if (host.endsWith('pooler.supabase.com')) {
  isSupabasePooler = true;
  connectionMethod = port === '6543'
    ? 'Supabase Transaction Pooler (Port 6543, IPv4 compatible)'
    : 'Supabase Session Pooler (Port 5432, IPv4 compatible)';
} else if (host.includes('supabase.co')) {
  isSupabaseDirect = true;
  connectionMethod = 'Supabase Direct Connection (Port 5432, IPv6 only on free tier)';
} else if (host.includes('render.com') || host.startsWith('dpg-')) {
  isRender = true;
  connectionMethod = host.includes('render.com')
    ? 'Render PostgreSQL (External Connection)'
    : 'Render PostgreSQL (Internal Render Private Network)';
}

const isLocalhost = isLocal;
const useSsl =
  connectionString.includes('sslmode=require') ||
  (!isLocalhost &&
    !connectionString.includes('sslmode=disable') &&
    (isRender || isSupabaseDirect || isSupabasePooler || process.env.NODE_ENV === 'production'));

// Configure SSL securely per-client without globally disabling Node TLS verification
let sslConfig = false;
let sslVerificationMode = 'Disabled (Local / unencrypted)';

if (useSsl) {
  const caPath =
    process.env.DATABASE_CA_CERT ||
    process.env.SUPABASE_CA_CERT ||
    process.env.PGSSLROOTCERT;
  const defaultCertsPath = path.resolve(process.cwd(), 'certs/supabase-ca.crt');

  if (caPath && fs.existsSync(caPath)) {
    sslConfig = { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true };
    sslVerificationMode = `Custom CA (${caPath}) - Full Strict Verification`;
  } else if (fs.existsSync(defaultCertsPath)) {
    sslConfig = { ca: fs.readFileSync(defaultCertsPath, 'utf8'), rejectUnauthorized: true };
    sslVerificationMode = 'Default certs/supabase-ca.crt - Full Strict Verification';
  } else {
    // Standard Supabase client configuration: TLS encryption in transit
    sslConfig = { rejectUnauthorized: false };
    sslVerificationMode = 'TLS Encrypted (rejectUnauthorized: false for Supabase private CA chain)';
  }
}

console.log('\n--- Connection Parameters ---');
console.log(`Connection Method : ${connectionMethod}`);
console.log(`Host              : ${host}`);
console.log(`Port              : ${port}`);
console.log(`Database Name     : ${database}`);
console.log(`Database User     : ${username}`);
console.log(`SSL Mode          : ${sslVerificationMode}`);
console.log(`Password Config   : Length ${passwordLength} chars, special chars: ${hasSpecialChars ? 'yes' : 'no'}`);

// 3. Configuration Sanity Diagnostics
console.log('\n--- Pre-Flight Configuration Checks ---');
let hasConfigWarning = false;

if (isLocal) {
  console.log('⚠️  TARGET IS LOCALHOST: The active environment file (.env.local) has DATABASE_URL pointing to localhost:5432.');
  console.log('   If you intend to connect to Supabase PostgreSQL, update DATABASE_URL in .env.local with your Supabase connection string and save.');
  hasConfigWarning = true;
}

if (isSupabasePooler) {
  if (!username.includes('.')) {
    console.log('⚠️  CRITICAL WARNING: Connecting to Supabase Pooler (*.pooler.supabase.com) requires username format:');
    console.log('   "postgres.[YOUR-PROJECT-REF]" (e.g., postgres.abcdefghijklmno)');
    console.log(`   Current username is "${username}", which will cause error 28P01.`);
    hasConfigWarning = true;
  }
}

if (isSupabaseDirect) {
  console.log('ℹ️  INFO: Supabase Direct (db.*.supabase.co:5432) uses IPv6 only on free-tier projects.');
  console.log('   If local DNS cannot reach IPv6, switch to the Supabase Session Pooler.');
}

if (isRender && !host.includes('render.com')) {
  console.log('⚠️  CRITICAL WARNING: You are using Render internal host (dpg-*) outside Render private network.');
  console.log('   Local connections must use the "External Database URL" ending with .frankfurt-postgres.render.com (or your region).');
  hasConfigWarning = true;
}

if (!hasConfigWarning) {
  console.log('✓ Pre-flight URL syntax checks passed.');
}

// 4. DNS Check for remote hosts
async function checkDns(hostname) {
  if (isLocal) return;
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    console.log(`✓ DNS Resolution: ${hostname} resolved to ${addresses.map(a => `${a.address} (IPv${a.family})`).join(', ')}`);
  } catch (err) {
    console.log(`❌ DNS Resolution Failed: Cannot resolve ${hostname} (${err.code || err.message})`);
  }
}

// 5. Active Connection Test
async function runConnectionTest() {
  await checkDns(host);

  console.log('\n--- Live Connection Test ---');
  console.log('Connecting to PostgreSQL server...');
  const startTime = Date.now();

  const parsedClientConfig = parse(sanitizedUrl);
  delete parsedClientConfig.connectionString;

  const client = new Client({
    ...parsedClientConfig,
    ssl: sslConfig,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const latency = Date.now() - startTime;
    const res = await client.query(`
      SELECT 
        1 AS ok,
        current_database() AS db_name,
        current_user AS db_user,
        version() AS db_version
    `);
    await client.end();

    const row = res.rows[0];
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log(`Latency         : ${latency}ms`);
    console.log(`Server Database : ${row.db_name}`);
    console.log(`Server User     : ${row.db_user}`);
    console.log(`PostgreSQL Ver  : ${row.db_version ? row.db_version.split(',')[0] : 'Unknown'}`);
    console.log('='.repeat(70));
    process.exit(0);
  } catch (err) {
    const latency = Date.now() - startTime;
    console.log('❌ CONNECTION FAILED!');
    console.log(`Latency before error: ${latency}ms`);
    console.log(`Error Code          : ${err.code || 'NO_CODE'}`);
    console.log(`Error Message       : ${err.message}`);
    if (err.detail) console.log(`Error Detail        : ${err.detail}`);
    if (err.hint) console.log(`Error Hint          : ${err.hint}`);

    console.log('\n--- Diagnostic Root Cause Analysis ---');
    if (err.code === '28P01') {
      console.log('Cause: Password authentication failed for the specified user.');
      if (isLocal) {
        console.log('Remedy for Local PostgreSQL:');
        console.log('  1. The password in .env.local does not match your local Windows PostgreSQL service.');
        console.log('  2. Update DATABASE_URL in .env.local with the password you set during PostgreSQL 18 installation.');
        console.log('  3. Or connect to your Supabase/Render database instead by replacing DATABASE_URL in .env.local.');
      } else if (isSupabasePooler && !username.includes('.')) {
        console.log('Remedy for Supabase Pooler:');
        console.log('  The username must be "postgres.[PROJECT-REF]". Update DATABASE_URL with the exact connection string from Supabase Dashboard.');
      } else if (isSupabaseDirect || isSupabasePooler) {
        console.log('Remedy for Supabase:');
        console.log('  1. Verify your database password in Supabase: Project Settings -> Database -> Database Password.');
        console.log('  2. If your password has special characters like "#", "@", "%", URL-encode them (e.g. # -> %23, @ -> %40).');
        console.log('  3. Note: The database password is NOT your Supabase account login password.');
      } else if (isRender) {
        console.log('Remedy for Render:');
        console.log('  Copy the External Database URL directly from your Render PostgreSQL Dashboard.');
      }
    } else if (err.code === 'ECONNREFUSED') {
      console.log('Cause: TCP connection refused.');
      if (isLocal) {
        console.log('  Local PostgreSQL is not running or listening on port ' + port + '.');
      } else {
        console.log('  Remote server refused the connection on port ' + port + '.');
      }
    } else if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.log('Cause: Network timeout or DNS failure reaching ' + host);
      if (isSupabaseDirect) {
        console.log('  Supabase direct connections (db.*.supabase.co) only support IPv6.');
        console.log('  Switch to the Supabase Session Pooler (port 5432 on aws-0-*.pooler.supabase.com) which supports IPv4.');
      }
    } else if (err.message && err.message.includes('SSL')) {
      console.log('Cause: SSL negotiation failure.');
      console.log('  Ensure "?sslmode=require" is present at the end of the connection string.');
    }
    console.log('='.repeat(70));
    process.exit(1);
  }
}

runConnectionTest();
