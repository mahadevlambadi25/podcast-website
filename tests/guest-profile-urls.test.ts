import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../src/lib/db/client';
import { createGuest, updateGuest, getGuestById } from '../src/services/guests.service';
import { formatGuestsBatch } from '../src/lib/podcast';
import { normalizeUrl, normalizeImageUrl } from '../src/utils/url';

describe('Guest Profile URLs & Portrait Handling', () => {
  describe('URL Normalization', () => {
    it('normalizes domains without protocol by prepending https://', () => {
      expect(normalizeUrl('linkedin.com/in/alex-smith')).toBe('https://linkedin.com/in/alex-smith');
      expect(normalizeUrl('www.quantumdynamics.com')).toBe('https://www.quantumdynamics.com/');
      expect(normalizeUrl('quantumdynamics.com/about')).toBe('https://quantumdynamics.com/about');
    });

    it('preserves existing https and http URLs', () => {
      expect(normalizeUrl('https://linkedin.com/in/alex-smith')).toBe('https://linkedin.com/in/alex-smith');
      expect(normalizeUrl('http://insecure-domain.org')).toBe('http://insecure-domain.org/');
    });

    it('rejects unsafe protocols to prevent XSS attacks', () => {
      expect(normalizeUrl('javascript:alert(document.cookie)')).toBeNull();
      expect(normalizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(normalizeUrl('vbscript:msgbox("test")')).toBeNull();
    });

    it('normalizes relative vs absolute portrait image URLs safely', () => {
      expect(normalizeImageUrl('/placeholders/portrait-placeholder.svg')).toBe('/placeholders/portrait-placeholder.svg');
      expect(normalizeImageUrl('/media/portrait-photo.jpg')).toBe('/media/portrait-photo.jpg');
      expect(normalizeImageUrl('https://images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
      expect(normalizeImageUrl('images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
      expect(normalizeImageUrl('javascript:alert(1)')).toBeNull();
      expect(normalizeImageUrl('')).toBeNull();
      expect(normalizeImageUrl(null)).toBeNull();
    });
  });

  describe('formatGuestsBatch Data Structure', () => {
    it('populates structured guest.links object and portrait object correctly', async () => {
      const mockDbRows = [
        {
          id: 42,
          full_name: 'Dr. Evelyn Vance',
          slug: 'dr-evelyn-vance',
          role: 'Chief AI Scientist',
          company: 'Nexus Synthetics',
          short_overview: 'Leading research on synthetic biology and AI architectures.',
          biography: 'Extensive background in neural architectures.',
          portrait_id: null,
          portrait_url: 'https://images.unsplash.com/photo-42',
          portrait_alt: 'Dr. Evelyn Vance Portrait',
          portrait_credit: 'Nexus Press',
          links_linkedin: 'linkedin.com/in/evelyn-vance',
          links_website: 'nexussynthetics.io',
          links_other: 'https://scholar.google.com/citations?user=123',
          featured: 1,
          status: 'published',
          updated_at: '2026-10-22T12:00:00Z',
          created_at: '2026-10-22T10:00:00Z',
        },
      ];

      // Mock topics and insights queries in formatGuestsBatch
      vi.spyOn(db, 'execute').mockImplementation(async (opts) => {
        const sql = typeof opts === 'string' ? opts : opts.sql;
        if (sql.includes('guests_rels') && sql.includes('topics')) {
          return {
            rows: [{ parent_id: 42, id: 1, name: 'Artificial Intelligence', slug: 'ai' }],
            rowCount: 1,
          };
        }
        if (sql.includes('guests_key_insights')) {
          return {
            rows: [{ quote: 'Innovation is discipline.', context: 'Keynote 2026' }],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      });

      const formatted = await formatGuestsBatch(mockDbRows);

      expect(formatted).toHaveLength(1);
      const guest = formatted[0];

      // 1. Portrait checks
      expect(guest.portraitUrl).toBe('https://images.unsplash.com/photo-42');
      expect(guest.portrait).toEqual({
        url: 'https://images.unsplash.com/photo-42',
        alt: 'Dr. Evelyn Vance Portrait',
      });

      // 2. Structured links object check (CRITICAL FOR GUEST DETAIL PAGE)
      expect(guest.links).toBeDefined();
      expect(guest.links.linkedin).toBe('https://linkedin.com/in/evelyn-vance');
      expect(guest.links.website).toBe('https://nexussynthetics.io/');
      expect(guest.links.other).toBe('https://scholar.google.com/citations?user=123');

      // 3. Backward-compatible flat aliases
      expect(guest.linksLinkedin).toBe('https://linkedin.com/in/evelyn-vance');
      expect(guest.links_linkedin).toBe('https://linkedin.com/in/evelyn-vance');
      expect(guest.linksWebsite).toBe('https://nexussynthetics.io/');
      expect(guest.links_website).toBe('https://nexussynthetics.io/');

      // 4. Featured and Status checks
      expect(guest.featured).toBe(true);
      expect(guest.status).toBe('published');

      vi.restoreAllMocks();
    });

    it('gracefully handles missing, empty, or invalid links without throwing', async () => {
      const mockDbRows = [
        {
          id: 43,
          full_name: 'Empty Links Guest',
          slug: 'empty-links-guest',
          role: 'Advisor',
          company: null,
          short_overview: 'Overview blurb',
          biography: 'Bio text',
          portrait_id: null,
          portrait_url: null,
          links_linkedin: null,
          links_website: 'javascript:alert(1)', // Malicious / invalid URL
          links_other: '',
          featured: 0,
          status: 'draft',
          updated_at: '2026-10-22T12:00:00Z',
          created_at: '2026-10-22T10:00:00Z',
        },
      ];

      vi.spyOn(db, 'execute').mockResolvedValue({ rows: [], rowCount: 0 });

      const formatted = await formatGuestsBatch(mockDbRows);
      expect(formatted).toHaveLength(1);
      const guest = formatted[0];

      expect(guest.portraitUrl).toBeNull();
      expect(guest.portrait).toBeNull();
      expect(guest.links).toEqual({
        linkedin: null,
        website: null,
        other: null,
      });
      expect(guest.featured).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe('Database Persistence (createGuest & updateGuest)', () => {
    it('persists portrait_url, links_linkedin, and links_website on createGuest', async () => {
      let executedSql = '';
      let executedArgs: any[] = [];

      vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
        const mockTx = {
          execute: vi.fn().mockImplementation(async (options) => {
            executedSql = options.sql;
            executedArgs = options.args;
            return { rows: [{ id: 50 }], lastInsertRowid: 50, rowCount: 1 };
          }),
        };
        return await callback(mockTx as any);
      });

      const newId = await createGuest({
        full_name: 'Marcus Holloway',
        slug: 'marcus-holloway',
        role: 'Founder',
        company: 'DedSec Labs',
        portrait_url: 'https://images.unsplash.com/photo-portrait-50',
        links_linkedin: 'linkedin.com/in/marcus-holloway',
        links_website: 'dedsec.io',
        status: 'published',
        featured: true,
      });

      expect(newId).toBe(50);
      expect(executedSql).toContain('portrait_url');
      expect(executedSql).toContain('links_linkedin');
      expect(executedSql).toContain('links_website');

      // Verify that URLs were normalized before database insert
      expect(executedArgs).toContain('https://images.unsplash.com/photo-portrait-50');
      expect(executedArgs).toContain('https://linkedin.com/in/marcus-holloway');
      expect(executedArgs).toContain('https://dedsec.io/');

      vi.restoreAllMocks();
    });

    it('persists portrait_url and normalized URLs on updateGuest', async () => {
      let executedSql = '';
      let executedArgs: any[] = [];

      vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
        const mockTx = {
          execute: vi.fn().mockImplementation(async (options) => {
            executedSql = options.sql;
            executedArgs = options.args;
            return { rows: [], rowCount: 1 };
          }),
        };
        return await callback(mockTx as any);
      });

      await updateGuest(50, {
        portrait_url: 'https://cdn.example.com/portraits/new-marcus.png',
        links_linkedin: 'linkedin.com/in/marcus-updated',
        links_website: 'https://new-dedsec.io',
      });

      expect(executedSql).toContain('portrait_url = COALESCE(?, portrait_url)');
      expect(executedSql).toContain('links_linkedin = COALESCE(?, links_linkedin)');
      expect(executedSql).toContain('links_website = COALESCE(?, links_website)');

      expect(executedArgs).toContain('https://cdn.example.com/portraits/new-marcus.png');
      expect(executedArgs).toContain('https://linkedin.com/in/marcus-updated');
      expect(executedArgs).toContain('https://new-dedsec.io/');

      vi.restoreAllMocks();
    });
  });
});
