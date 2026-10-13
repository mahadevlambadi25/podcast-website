import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDbPool, closeDbPool, db } from '../src/lib/db/client';
import {
  formatEpisodesBatch,
  formatGuestsBatch,
  getSiteSettings,
  invalidateSiteSettingsCache,
} from '../src/lib/podcast';

describe('Database Connection Pool & Exhaustion Prevention', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    await closeDbPool();
    invalidateSiteSettingsCache();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://postgres:test@localhost:5432/testdb',
    };
  });

  afterEach(async () => {
    await closeDbPool();
    invalidateSiteSettingsCache();
    process.env = { ...originalEnv };
  });

  describe('Pool Singleton Reuse across Environments', () => {
    it('returns the exact same pool instance in production NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool1 = getDbPool();
      const pool2 = getDbPool();
      const pool3 = getDbPool();

      expect(pool1).not.toBeNull();
      expect(pool1).toBe(pool2);
      expect(pool2).toBe(pool3);
    });

    it('returns the exact same pool instance in development NODE_ENV', () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool1 = getDbPool();
      const pool2 = getDbPool();

      expect(pool1).not.toBeNull();
      expect(pool1).toBe(pool2);
    });

    it('closes and resets the pool on closeDbPool()', async () => {
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool1 = getDbPool();
      expect(pool1).not.toBeNull();

      await closeDbPool();

      const pool2 = getDbPool();
      expect(pool2).not.toBeNull();
      expect(pool2).not.toBe(pool1);
    });
  });

  describe('Conservative Connection Pool Limits (Supabase 15-Connection Safety)', () => {
    it('defaults to conservative max 5 connections when DB_POOL_MAX is unset', () => {
      delete process.env.DB_POOL_MAX;
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool = getDbPool();
      expect(pool).not.toBeNull();
      expect((pool as any)?.options?.max).toBe(5);
    });

    it('clamps pool max to 7 even if DB_POOL_MAX is set to a high number (e.g. 20 or 50)', () => {
      process.env.DB_POOL_MAX = '50';
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool = getDbPool();
      expect(pool).not.toBeNull();
      // Must clamp to 7 so multiple app instances / jobs do not exhaust Supabase's 15 pooler limit
      expect((pool as any)?.options?.max).toBe(7);
    });

    it('respects a valid conservative DB_POOL_MAX below 7 (e.g. 3)', () => {
      process.env.DB_POOL_MAX = '3';
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool = getDbPool();
      expect(pool).not.toBeNull();
      expect((pool as any)?.options?.max).toBe(3);
    });

    it('configures conservative timeouts to avoid idle leaks', () => {
      process.env.DATABASE_URL = 'postgresql://postgres:test@localhost:5432/testdb';

      const pool = getDbPool();
      expect(pool).not.toBeNull();
      expect((pool as any)?.options?.idleTimeoutMillis).toBe(10000);
      expect((pool as any)?.options?.connectionTimeoutMillis).toBe(10000);
      expect((pool as any)?.options?.allowExitOnIdle).toBe(true);
    });
  });

  describe('Transaction Safety & Connection Release in finally', () => {
    it('checks out connection, commits, and releases client back to pool on success', async () => {
      const mockClient = {
        query: vi.fn().mockImplementation((sql: string) => {
          if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          return Promise.resolve({ rows: [{ id: 42 }], rowCount: 1 });
        }),
        release: vi.fn(),
      };

      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        query: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      };

      (globalThis as any).dbPool = mockPool;

      const result = await db.transaction(async (tx) => {
        const res = await tx.execute({ sql: 'INSERT INTO test (name) VALUES (?)', args: ['val'] });
        return res;
      });

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
      expect(result.rows[0].id).toBe(42);
    });

    it('rolls back and guarantees client release in finally on transaction error', async () => {
      const mockClient = {
        query: vi.fn().mockImplementation((sql: string) => {
          if (sql === 'BEGIN' || sql === 'ROLLBACK') {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          throw new Error('Transaction failure simulation');
        }),
        release: vi.fn(),
      };

      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        query: vi.fn(),
        end: vi.fn().mockResolvedValue(undefined),
      };

      (globalThis as any).dbPool = mockPool;

      await expect(
        db.transaction(async (tx) => {
          await tx.execute({ sql: 'UPDATE episodes SET status = ? WHERE id = ?', args: ['published', 1] });
        })
      ).rejects.toThrow('Transaction failure simulation');

      expect(mockPool.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Optimization: Batched Relations vs N+1 Cascades', () => {
    it('formatEpisodesBatch batches relation queries using IN (...) instead of per-row queries', async () => {
      const executedQueries: string[] = [];

      vi.spyOn(db, 'execute').mockImplementation(async (input: any) => {
        const sql = typeof input === 'string' ? input : input.sql;
        executedQueries.push(sql);

        if (sql.includes('episodes_rels') && sql.includes("path = 'guests'")) {
          return {
            rows: [
              { parent_id: 101, id: 1, full_name: 'Guest A', slug: 'guest-a' },
              { parent_id: 102, id: 2, full_name: 'Guest B', slug: 'guest-b' },
            ],
            rowCount: 2,
          };
        }
        if (sql.includes('episodes_rels') && sql.includes("path = 'topics'")) {
          return {
            rows: [
              { parent_id: 101, id: 10, name: 'AI', slug: 'ai' },
              { parent_id: 102, id: 11, name: 'Cloud', slug: 'cloud' },
            ],
            rowCount: 2,
          };
        }
        if (sql.includes('episodes_key_takeaways')) {
          return {
            rows: [
              { _parent_id: 101, takeaway: 'Takeaway 101' },
              { _parent_id: 102, takeaway: 'Takeaway 102' },
            ],
            rowCount: 2,
          };
        }
        if (sql.includes('episodes_quotes')) {
          return {
            rows: [
              { _parent_id: 101, quote: 'Quote 101', speaker: 'Speaker 1' },
            ],
            rowCount: 1,
          };
        }
        if (sql.includes('episodes_tags')) {
          return {
            rows: [
              { _parent_id: 101, tag: 'tech' },
              { _parent_id: 102, tag: 'innovation' },
            ],
            rowCount: 2,
          };
        }
        return { rows: [], rowCount: 0 };
      });

      const episodes = [
        { id: 101, title: 'Episode 101', slug: 'ep-101' },
        { id: 102, title: 'Episode 102', slug: 'ep-102' },
        { id: 103, title: 'Episode 103', slug: 'ep-103' },
      ];

      const formatted = await formatEpisodesBatch(episodes);

      // Exactly 5 batched queries executed for all 3 episodes combined
      // (Rather than 3 * 5 = 15 queries)
      expect(executedQueries.length).toBe(5);
      expect(executedQueries.every((q) => q.includes('IN (?,?,?)'))).toBe(true);

      expect(formatted).toHaveLength(3);
      expect(formatted[0].id).toBe(101);
      expect(formatted[0].guests[0].fullName).toBe('Guest A');
      expect(formatted[0].topics[0].name).toBe('AI');
      expect(formatted[0].keyTakeaways).toContain('Takeaway 101');

      expect(formatted[1].id).toBe(102);
      expect(formatted[1].guests[0].fullName).toBe('Guest B');
      expect(formatted[1].topics[0].name).toBe('Cloud');
      expect(formatted[1].keyTakeaways).toContain('Takeaway 102');

      expect(formatted[2].id).toBe(103);
      expect(formatted[2].guests).toHaveLength(0);
    });

    it('formatGuestsBatch batches topic and insight queries across all guests', async () => {
      const executedQueries: string[] = [];

      vi.spyOn(db, 'execute').mockImplementation(async (input: any) => {
        const sql = typeof input === 'string' ? input : input.sql;
        executedQueries.push(sql);

        if (sql.includes('guests_rels') && sql.includes("path = 'topics'")) {
          return {
            rows: [
              { parent_id: 201, id: 5, name: 'Finance', slug: 'finance' },
              { parent_id: 202, id: 6, name: 'Tech', slug: 'tech' },
            ],
            rowCount: 2,
          };
        }
        if (sql.includes('guests_key_insights')) {
          return {
            rows: [
              { _parent_id: 201, quote: 'Insight 1', context: 'Context 1' },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      });

      const guests = [
        { id: 201, full_name: 'Guest One', slug: 'guest-1' },
        { id: 202, full_name: 'Guest Two', slug: 'guest-2' },
      ];

      const formatted = await formatGuestsBatch(guests);

      // Exactly 2 batched queries executed for both guests
      expect(executedQueries.length).toBe(2);
      expect(executedQueries.every((q) => q.includes('IN (?,?)'))).toBe(true);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].fullName).toBe('Guest One');
      expect(formatted[0].topics[0].name).toBe('Finance');
      expect(formatted[1].fullName).toBe('Guest Two');
      expect(formatted[1].topics[0].name).toBe('Tech');
    });
  });

  describe('Site Settings Caching to Reduce Concurrent Page Load Churn', () => {
    it('caches site settings in memory for 30 seconds and reuses it across concurrent calls', async () => {
      let queryCount = 0;
      vi.spyOn(db, 'execute').mockImplementation(async () => {
        queryCount++;
        return {
          rows: [
            {
              id: 1,
              brand_name: 'Test Podcast',
              tagline: 'Testing tag',
            },
          ],
          rowCount: 1,
        };
      });

      // Call 5 times concurrently
      const results = await Promise.all([
        getSiteSettings(),
        getSiteSettings(),
        getSiteSettings(),
        getSiteSettings(),
        getSiteSettings(),
      ]);

      expect(queryCount).toBe(1);
      expect(results[0]?.brandName).toBe('Test Podcast');
      expect(results[4]?.brandName).toBe('Test Podcast');
    });

    it('refetches when invalidateSiteSettingsCache() is invoked', async () => {
      let queryCount = 0;
      vi.spyOn(db, 'execute').mockImplementation(async () => {
        queryCount++;
        return {
          rows: [
            { id: 1, brand_name: `Test Brand v${queryCount}` },
          ],
          rowCount: 1,
        };
      });

      const first = await getSiteSettings();
      expect(first?.brandName).toBe('Test Brand v1');
      expect(queryCount).toBe(1);

      invalidateSiteSettingsCache();

      const second = await getSiteSettings();
      expect(second?.brandName).toBe('Test Brand v2');
      expect(queryCount).toBe(2);
    });
  });
});
