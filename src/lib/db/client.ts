import { Pool, type QueryResult } from 'pg';

export interface ExecuteOptions {
  sql: string;
  args?: any[];
}

export interface DbResult<T = any> {
  rows: T[];
  lastInsertRowid?: number | bigint;
  rowCount: number;
}

let poolInstance: Pool | null = null;

export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URI;
  if (!url) return null;
  // If user has SQLite file url left over in local env, ignore it for Postgres pool
  if (url.startsWith('file:')) return null;
  return url;
}

export function getDbPool(): Pool | null {
  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return null;
  }

  const isLocalhost =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');

  const useSsl =
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('render.com') ||
    connectionString.includes('sslmode=') ||
    (!isLocalhost && !connectionString.includes('sslmode=disable'));

  poolInstance = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  poolInstance.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool client error:', err);
  });

  return poolInstance;
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
        'DATABASE_URL is not configured. Please set the Render PostgreSQL connection URL.'
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
      console.error('PostgreSQL execution error for query:', {
        sql: convertedSql,
        args: normalizedArgs,
        error: err.message,
      });
      throw err;
    }
  }
}

export const db = new DatabaseClient();
