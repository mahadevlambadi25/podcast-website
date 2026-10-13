import { describe, it, expect } from 'vitest';
import { convertPlaceholders, adaptSqlDialect } from '../src/lib/db/client';

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
});
