import { describe, it, expect } from 'vitest';
import { convertPlaceholders, adaptSqlDialect, formatDbError, sanitizeDatabaseUrl } from '../src/lib/db/client';

describe('PostgreSQL Database Client Utilities', () => {
  describe('convertPlaceholders', () => {
    it('converts single and multiple question mark placeholders to $1, $2, ...', () => {
      const sql = 'SELECT * FROM episodes WHERE id = ? AND status = ?';
      const expected = 'SELECT * FROM episodes WHERE id = $1 AND status = $2';
      expect(convertPlaceholders(sql)).toBe(expected);
    });

    it('ignores question marks inside single-quoted string literals', () => {
      const sql = "SELECT * FROM episodes WHERE title = 'What is quantum?' AND id = ?";
      const expected = "SELECT * FROM episodes WHERE title = 'What is quantum?' AND id = $1";
      expect(convertPlaceholders(sql)).toBe(expected);
    });

    it('handles queries with no placeholders', () => {
      const sql = 'SELECT COUNT(*) as total FROM site_settings';
      expect(convertPlaceholders(sql)).toBe(sql);
    });
  });

  describe('adaptSqlDialect', () => {
    it('adapts strftime month formatting to PostgreSQL to_char', () => {
      const sql = "SELECT strftime('%Y-%m', created_at) as m FROM episodes";
      const adapted = adaptSqlDialect(sql);
      expect(adapted).toContain("to_char(created_at::timestamptz, 'YYYY-MM')");
    });

    it('adapts strftime year formatting to PostgreSQL to_char', () => {
      const sql = "SELECT * FROM episodes WHERE strftime('%Y', published_at) = ?";
      const adapted = adaptSqlDialect(sql);
      expect(adapted).toContain("to_char(published_at::timestamptz, 'YYYY')");
    });

    it('fixes double-quoted path literal identifiers in relationships', () => {
      const sql = 'SELECT * FROM episodes_rels WHERE path = "guests"';
      expect(adaptSqlDialect(sql)).toBe("SELECT * FROM episodes_rels WHERE path = 'guests'");
    });

    it('auto-appends RETURNING id to INSERT statements lacking a returning clause', () => {
      const sql = 'INSERT INTO topics (name, slug) VALUES (?, ?)';
      const adapted = adaptSqlDialect(sql);
      expect(adapted).toBe('INSERT INTO topics (name, slug) VALUES (?, ?) RETURNING id');
    });

    it('does not append duplicate RETURNING id if RETURNING is already present', () => {
      const sql = 'INSERT INTO topics (name, slug) VALUES (?, ?) RETURNING id, name';
      const adapted = adaptSqlDialect(sql);
      expect(adapted).toBe(sql);
    });
  });

  describe('formatDbError', () => {
    it('extracts error code and message from PostgreSQL errors', () => {
      const fakePgError = {
        message: 'password authentication failed for user "postgres"',
        code: '28P01',
        detail: 'User does not exist',
      };
      const formatted = formatDbError(fakePgError, 'SELECT * FROM users', ['admin']);
      expect(formatted.code).toBe('28P01');
      expect(formatted.message).toContain('password authentication failed');
      expect(formatted.detail).toBe('User does not exist');
      expect(formatted.args).toEqual(['admin']);
    });

    it('masks arguments in sensitive queries to prevent credential leaks', () => {
      const fakeError = { message: 'relation does not exist', code: '42P01' };
      const sql = 'INSERT INTO users (email, hash, salt) VALUES ($1, $2, $3)';
      const formatted = formatDbError(fakeError, sql, ['admin@example.com', 'supersecret', 'salt123']);
      expect(formatted.args).toEqual(['[REDACTED]', '[REDACTED]', '[REDACTED]']);
    });
  });

  describe('sanitizeDatabaseUrl', () => {
    it('properly encodes unencoded hash character in database password', () => {
      const raw = 'postgresql://postgres:my#secret@localhost:5432/unchartered';
      const sanitized = sanitizeDatabaseUrl(raw);
      expect(sanitized).toBe('postgresql://postgres:my%23secret@localhost:5432/unchartered');
    });

    it('preserves already encoded characters in database password', () => {
      const raw = 'postgresql://postgres:my%23secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';
      const sanitized = sanitizeDatabaseUrl(raw);
      expect(sanitized).toBe(raw);
    });

    it('returns empty or non-postgres strings without breaking', () => {
      expect(sanitizeDatabaseUrl('')).toBe('');
      expect(sanitizeDatabaseUrl('file:./payload.db')).toBe('file:./payload.db');
    });
  });
});
