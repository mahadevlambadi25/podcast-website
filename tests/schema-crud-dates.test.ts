import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeIsoTimestamp, toUtcIsoString } from '../src/lib/date';
import { db } from '../src/lib/db/client';
import { createMedia } from '../src/services/media.service';
import { createGuest, updateGuest } from '../src/services/guests.service';
import { createEpisode, updateEpisode } from '../src/services/episodes.service';

describe('Date & Timestamp Normalization', () => {
  it('converts GMT+0530 date strings to valid UTC ISO 8601 timestamps', () => {
    const gmtString = 'Tue Oct 13 2026 17:19:31 GMT+0530 (India Standard Time)';
    const normalized = normalizeIsoTimestamp(gmtString);
    expect(normalized).not.toBeNull();
    expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // 17:19:31 in GMT+0530 is 11:49:31 UTC
    expect(normalized).toContain('11:49:31');
  });

  it('converts GMT-0800 date strings to valid UTC ISO 8601 timestamps', () => {
    const gmtString = 'Mon Oct 12 2026 20:00:00 GMT-0800 (Pacific Standard Time)';
    const normalized = normalizeIsoTimestamp(gmtString);
    expect(normalized).not.toBeNull();
    expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // 20:00:00 in GMT-0800 is 04:00:00 UTC next day
    expect(normalized).toContain('04:00:00');
  });

  it('normalizes standard ISO strings to clean UTC ISO 8601', () => {
    const isoString = '2026-10-13T17:19:31+05:30';
    const normalized = normalizeIsoTimestamp(isoString);
    expect(normalized).not.toBeNull();
    expect(normalized).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(normalized).toContain('11:49:31');
  });

  it('normalizes Date objects to UTC ISO 8601', () => {
    const date = new Date('2026-10-13T12:00:00Z');
    const normalized = normalizeIsoTimestamp(date);
    expect(normalized).toBe('2026-10-13T12:00:00.000Z');
  });

  it('returns null for invalid dates without throwing', () => {
    expect(normalizeIsoTimestamp('invalid-date-string')).toBeNull();
    expect(normalizeIsoTimestamp(null)).toBeNull();
    expect(normalizeIsoTimestamp(undefined)).toBeNull();
    expect(normalizeIsoTimestamp('')).toBeNull();
  });

  it('toUtcIsoString formats dates consistently in UTC', () => {
    const date = new Date('2026-10-13T15:30:00Z');
    expect(toUtcIsoString(date)).toBe('2026-10-13T15:30:00.000Z');
  });
});

describe('Database Client Argument Normalization', () => {
  it('converts Date instances and GMT strings in execute args before sending to database', async () => {
    const { normalizeSqlArgs } = await import('../src/lib/db/client');
    const testDate = new Date('2026-10-13T12:00:00Z');
    const gmtDate = 'Tue Oct 13 2026 17:19:31 GMT+0530 (India Standard Time)';

    const normalized = normalizeSqlArgs([testDate, gmtDate, 'regular-string', 123]);

    expect(normalized[0]).toBe('2026-10-13T12:00:00.000Z');
    expect(normalized[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(normalized[1]).toContain('11:49:31');
    expect(normalized[2]).toBe('regular-string');
    expect(normalized[3]).toBe(123);
  });
});

describe('Media Service Schema & Upload Integrity', () => {
  it('inserts into thumbnail_url and does not use non-existent thumbnail_u_r_l column', async () => {
    let capturedSql = '';
    let capturedArgs: any[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      capturedSql = typeof options === 'string' ? options : options.sql;
      capturedArgs = typeof options === 'string' ? [] : (options.args || []);
      return { rows: [], lastInsertRowid: 42, rowCount: 1 };
    });

    const newId = await createMedia({
      filename: 'test-podcast-hero.jpg',
      url: 'https://cdn.unchartered.com/test-podcast-hero.jpg',
      thumbnail_url: 'https://cdn.unchartered.com/test-thumb.jpg',
      mime_type: 'image/jpeg',
      filesize: 102400,
      width: 1200,
      height: 630,
      alt: 'Test episode hero cover',
    });

    expect(newId).toBe(42);
    // Verify SQL does NOT contain the erroneous column thumbnail_u_r_l
    expect(capturedSql).not.toContain('thumbnail_u_r_l');
    // Verify SQL DOES contain canonical thumbnail_url
    expect(capturedSql).toContain('thumbnail_url');
    // Verify timestamps are valid ISO UTC
    const createdAt = capturedArgs[capturedArgs.length - 2];
    const updatedAt = capturedArgs[capturedArgs.length - 1];
    expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    executeSpy.mockRestore();
  });
});

describe('Guest Service Schema Resiliency', () => {
  it('creates guest using biography and bio with fallback if biography column is missing', async () => {
    let callCount = 0;
    const executedQueries: string[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      callCount++;
      const sql = typeof options === 'string' ? options : options.sql;
      executedQueries.push(sql);
      // Simulate 42703 column biography does not exist on first attempt
      if (callCount === 1) {
        const error: any = new Error('column "biography" of relation "guests" does not exist');
        error.code = '42703';
        throw error;
      }
      return { rows: [], lastInsertRowid: 99, rowCount: 1 };
    });

    const guestId = await createGuest({
      full_name: 'Dr. Jane Doe',
      slug: 'dr-jane-doe',
      role: 'Chief Technology Officer',
      biography: 'Renowned expert in artificial intelligence.',
      links_linkedin: 'https://linkedin.com/in/janedoe',
      links_website: 'https://janedoe.ai',
    });

    expect(guestId).toBe(99);
    expect(callCount).toBe(2);
    // First query attempted full canonical columns
    expect(executedQueries[0]).toContain('biography');
    // Second query gracefully fell back to legacy schema (bio, linkedin_url, website_url)
    expect(executedQueries[1]).toContain('bio');
    expect(executedQueries[1]).not.toContain('biography');

    executeSpy.mockRestore();
  });

  it('updates guest gracefully if biography column is not yet migrated', async () => {
    let callCount = 0;
    const executedQueries: string[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      callCount++;
      const sql = typeof options === 'string' ? options : options.sql;
      executedQueries.push(sql);
      if (callCount === 1) {
        const error: any = new Error('column "biography" of relation "guests" does not exist');
        error.code = '42703';
        throw error;
      }
      return { rows: [], rowCount: 1 };
    });

    await updateGuest(99, {
      biography: 'Updated biography content',
      links_linkedin: 'https://linkedin.com/in/janedoe-updated',
    });

    expect(callCount).toBe(2);
    expect(executedQueries[1]).toContain('bio = COALESCE(?, bio)');
    expect(executedQueries[1]).not.toContain('biography');

    executeSpy.mockRestore();
  });
});

describe('Episode Service Publishing & Scheduling Dates', () => {
  it('normalizes local GMT timestamps to UTC ISO strings when saving episode', async () => {
    let capturedArgs: any[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      capturedArgs = typeof options === 'string' ? [] : (options.args || []);
      return { rows: [], lastInsertRowid: 12, rowCount: 1 };
    });

    const gmtDate = 'Tue Oct 13 2026 17:19:31 GMT+0530 (India Standard Time)';
    await createEpisode({
      title: 'Episode 10: Future of AI',
      slug: 'episode-10-future-of-ai',
      published_at: gmtDate,
    });

    // published_at is index 10 in args
    const publishedAt = capturedArgs[10];
    expect(publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(publishedAt).toContain('11:49:31');

    executeSpy.mockRestore();
  });

  it('normalizes local GMT timestamps when updating and scheduling episode', async () => {
    let capturedArgs: any[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      capturedArgs = typeof options === 'string' ? [] : (options.args || []);
      return { rows: [], rowCount: 1 };
    });

    const gmtDate = 'Wed Oct 14 2026 18:30:00 GMT+0530 (India Standard Time)';
    await updateEpisode(12, {
      status: 'scheduled',
      published_at: gmtDate,
    });

    // published_at arg in UPDATE query
    const publishedAt = capturedArgs[10];
    expect(publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(publishedAt).toContain('13:00:00');

    executeSpy.mockRestore();
  });

  it('correctly passes thumbnail_id when creating and updating an episode', async () => {
    let capturedArgs: any[] = [];

    const executeSpy = vi.spyOn(db, 'execute').mockImplementation(async (options) => {
      capturedArgs = typeof options === 'string' ? [] : (options.args || []);
      return { rows: [], lastInsertRowid: 15, rowCount: 1 };
    });

    await createEpisode({
      title: 'Episode with Cover',
      slug: 'episode-with-cover',
      thumbnail_id: 42,
    });

    // In createEpisode, thumbnail_id is arg 7
    expect(capturedArgs[7]).toBe(42);

    await updateEpisode(15, {
      thumbnail_id: 99,
    });

    // In updateEpisode, thumbnail_id is arg 7
    expect(capturedArgs[7]).toBe(99);

    executeSpy.mockRestore();
  });
});
