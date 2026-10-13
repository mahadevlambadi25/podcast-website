import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'pg-connection-string';

export interface ExecuteOptions {
  sql: string;
  args?: any[];
}

export interface DbResult<T = any> {
  rows: T[];
  lastInsertRowid?: number | bigint;
  rowCount: number;
}

export interface FormattedDbError {
  message: string;
  code: string;
  detail?: string;
  hint?: string;
  position?: string;
  schema?: string;
  table?: string;
  column?: string;
  sql: string;
  args: any[];
}

const globalForDb = globalThis as unknown as { dbPool?: Pool };

export function sanitizeDatabaseUrl(urlStr: string): string {
  if (!urlStr) return urlStr;
  const match = urlStr.match(
    /^(postgres(?:ql)?:\/\/)([^:]+):(.*)@([^:\/@]+)(?::(\d+))?(\/.*)?$/
  );
  if (!match) return urlStr;
  const [, proto, user, rawPassword, host, port, rest] = match;
  let encodedPassword = rawPassword;
  try {
    encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
  } catch {
    // If malformed, preserve as-is
  }
  return `${proto}${user}:${encodedPassword}@${host}${port ? `:${port}` : ''}${rest || ''}`;
}

export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URI;
  if (!url) return null;
  // If user has SQLite file url left over in local env, ignore it for Postgres pool
  if (url.startsWith('file:')) return null;
  if (url.includes('[') || url.includes(']') || url.includes('YOUR-')) {
    console.warn(
      '⚠️ DATABASE_URL contains unreplaced placeholder tokens. Update .env.local with your real Supabase connection string.'
    );
  }
  return sanitizeDatabaseUrl(url);
}

export function getSslConfig(
  connectionString: string
): boolean | { rejectUnauthorized: boolean; ca?: string } {
  const isLocalhost =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const useSsl =
    connectionString.includes('sslmode=require') ||
    (!isLocalhost &&
      (process.env.NODE_ENV === 'production' ||
        connectionString.includes('render.com') ||
        connectionString.includes('supabase.co') ||
        connectionString.includes('pooler.supabase.com')) &&
      !connectionString.includes('sslmode=disable'));

  if (!useSsl) return false;

  // Check for custom CA certificate (e.g. Supabase Root CA: prod-ca-2021.crt)
  const caPath =
    process.env.DATABASE_CA_CERT ||
    process.env.SUPABASE_CA_CERT ||
    process.env.PGSSLROOTCERT;
  if (caPath && fs.existsSync(caPath)) {
    try {
      const ca = fs.readFileSync(caPath, 'utf8');
      return { ca, rejectUnauthorized: true };
    } catch {}
  }
  const defaultCertsPath = path.resolve(process.cwd(), 'certs/supabase-ca.crt');
  if (fs.existsSync(defaultCertsPath)) {
    try {
      const ca = fs.readFileSync(defaultCertsPath, 'utf8');
      return { ca, rejectUnauthorized: true };
    } catch {}
  }

  // Encrypted TLS transit without strict self-signed chain rejection for Supabase internal CA
  return { rejectUnauthorized: false };
}

export function getDbPool(): Pool | null {
  if (globalForDb.dbPool) {
    return globalForDb.dbPool;
  }

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  const parsed = parse(connectionString);
  const ssl = getSslConfig(connectionString);

  const pool = new Pool({
    user: parsed.user || undefined,
    password: parsed.password || undefined,
    host: parsed.host || undefined,
    port: parsed.port ? parseInt(parsed.port, 10) : undefined,
    database: parsed.database || undefined,
    ssl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool client error:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.dbPool = pool;
  }

  return pool;
}

/**
 * Converts SQLite-style '?' placeholders into PostgreSQL '$1', '$2', ... placeholders,
 * safely skipping '?' characters located inside string literals.
 */
export function convertPlaceholders(sql: string): string {
  let paramIndex = 1;
  let inString = false;
  let quoteChar = '';
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      quoteChar = char;
      result += char;
    } else if (inString && char === quoteChar) {
      if (i + 1 < sql.length && sql[i + 1] === quoteChar) {
        // Escaped quote
        result += char + sql[i + 1];
        i++;
      } else {
        inString = false;
        result += char;
      }
    } else if (!inString && char === '?') {
      result += `$${paramIndex++}`;
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Adapts common SQLite queries to PostgreSQL dialect.
 */
export function adaptSqlDialect(sql: string): string {
  let adapted = sql;

  // 1. Double-quoted literal fixes: path = "guests" -> path = 'guests'
  adapted = adapted.replace(/path\s*=\s*"guests"/g, "path = 'guests'");
  adapted = adapted.replace(/path\s*=\s*"topics"/g, "path = 'topics'");

  // 2. strftime conversions
  // strftime('%Y-%m', col) -> to_char(col::timestamptz, 'YYYY-MM')
  adapted = adapted.replace(
    /strftime\('%Y-%m',\s*([^)]+)\)/gi,
    "to_char($1::timestamptz, 'YYYY-MM')"
  );
  // strftime('%Y', col) -> to_char(col::timestamptz, 'YYYY')
  adapted = adapted.replace(
    /strftime\('%Y',\s*([^)]+)\)/gi,
    "to_char($1::timestamptz, 'YYYY')"
  );

  // 3. INSERT OR IGNORE -> ON CONFLICT DO NOTHING
  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i.test(adapted)) {
    adapted = adapted.replace(
      /^\s*INSERT\s+OR\s+IGNORE\s+INTO/i,
      'INSERT INTO'
    );
    if (!/ON\s+CONFLICT/i.test(adapted)) {
      adapted = `${adapted} ON CONFLICT DO NOTHING`;
    }
  }

  // 4. Auto-append RETURNING id for INSERT queries if not already present
  const trimmed = adapted.trim();
  if (
    /^\s*INSERT\s+INTO/i.test(trimmed) &&
    !/RETURNING/i.test(trimmed) &&
    !/ON\s+CONFLICT\s+DO\s+NOTHING/i.test(trimmed)
  ) {
    adapted = `${trimmed} RETURNING id`;
  }

  return adapted;
}

/**
 * Safely formats PostgreSQL errors without leaking secrets or passwords.
 */
export function formatDbError(err: any, sql: string, args: any[]): FormattedDbError {
  const isSensitive = /password|hash|salt|secret|token/i.test(sql);
  const safeArgs = isSensitive
    ? args.map(() => '[REDACTED]')
    : args;

  return {
    message: err?.message || String(err),
    code: err?.code || 'UNKNOWN',
    detail: err?.detail || undefined,
    hint: err?.hint || undefined,
    position: err?.position || undefined,
    schema: err?.schema || undefined,
    table: err?.table || undefined,
    column: err?.column || undefined,
    sql,
    args: safeArgs,
  };
}

export class DatabaseClient {
  async execute<T = any>(
    input: string | ExecuteOptions
  ): Promise<DbResult<T>> {
    const rawSql = typeof input === 'string' ? input : input.sql;
    const args = typeof input === 'string' ? [] : input.args || [];

    const pool = getDbPool();
    if (!pool) {
      // During build time or when database is not yet configured, provide graceful empty result
      const isBuild =
        process.env.DOCKER_BUILD === '1' ||
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NODE_ENV !== 'production';

      if (isBuild) {
        return {
          rows: [],
          rowCount: 0,
        };
      }

      throw new Error(
        'DATABASE_URL is not configured. Please set the PostgreSQL connection URL.'
      );
    }

    const adaptedSql = adaptSqlDialect(rawSql);
    const convertedSql = convertPlaceholders(adaptedSql);

    // Flatten / clean args
    const normalizedArgs = args.map((arg) => {
      if (arg === undefined) return null;
      return arg;
    });

    try {
      const res = await pool.query(convertedSql, normalizedArgs);
      const rows = (res.rows || []) as T[];
      const firstRow: any = rows[0];
      const lastInsertRowid =
        firstRow && firstRow.id !== undefined ? Number(firstRow.id) : undefined;

      return {
        rows,
        lastInsertRowid,
        rowCount: res.rowCount ?? rows.length,
      };
    } catch (err: any) {
      const isBuild =
        process.env.DOCKER_BUILD === '1' ||
        process.env.NEXT_PHASE === 'phase-production-build';

      if (isBuild) {
        return {
          rows: [],
          rowCount: 0,
        };
      }

      const formatted = formatDbError(err, convertedSql, normalizedArgs);

      // Print comprehensive, human-readable error to console
      let diagnosticHint = '';
      if (formatted.code === '28P01') {
        diagnosticHint = ' | Hint: Password authentication failed. Run "npm run test:db" to diagnose host, credentials, or Supabase pooler username format.';
      } else if (formatted.code === '42703') {
        diagnosticHint = ' | Hint: Column does not exist. Ensure migrations have run: "node ./scripts/migrate-postgres.mjs".';
      } else if (formatted.code === '42P01') {
        diagnosticHint = ' | Hint: Table does not exist. Ensure migrations have run: "node ./scripts/migrate-postgres.mjs".';
      }

      console.error(
        `[PostgreSQL Error ${formatted.code}] ${formatted.message}${formatted.detail ? ` (${formatted.detail})` : ''}${diagnosticHint}\n` +
        `  SQL: ${formatted.sql}\n` +
        `  Args: ${JSON.stringify(formatted.args)}`
      );

      // Re-throw with enriched error object so callers never receive an empty object
      const enrichedError = new Error(
        `[PostgreSQL Error ${formatted.code}] ${formatted.message}${diagnosticHint}`
      );
      (enrichedError as any).code = formatted.code;
      (enrichedError as any).detail = formatted.detail;
      (enrichedError as any).hint = formatted.hint;
      (enrichedError as any).sql = formatted.sql;
      (enrichedError as any).args = formatted.args;

      throw enrichedError;
    }
  }
}

export const db = new DatabaseClient();
