import { cache } from 'react';
import { db } from './db/client';
import { siteConfig } from '../config/site';
import { normalizeIsoTimestamp, toUtcIsoString } from './date';
import {
  searchCollections,
  SearchGuestItem,
  SearchEpisodeItem,
  SearchResults,
} from '../utils/search';
import { normalizeUrl, normalizeImageUrl } from '../utils/url';

// In-memory cache for site settings to eliminate repetitive DB queries across concurrent page renders
let cachedSiteSettings: any = null;
let siteSettingsCacheExpiry = 0;
let siteSettingsInFlight: Promise<any> | null = null;

// Bounded in-memory TTL caching stores
const MAX_CACHE_ENTRIES = 80;

function setTimedCache<T>(cacheMap: Map<string, { data: T; expiry: number }>, key: string, data: T, ttlMs: number) {
  if (cacheMap.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cacheMap.keys().next().value;
    if (firstKey) cacheMap.delete(firstKey);
  }
  cacheMap.set(key, { data, expiry: Date.now() + ttlMs });
}

function getTimedCache<T>(cacheMap: Map<string, { data: T; expiry: number }>, key: string): T | null {
  const item = cacheMap.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cacheMap.delete(key);
    return null;
  }
  return item.data;
}

const episodesQueryCache = new Map<string, { data: any; expiry: number }>();
const guestsQueryCache = new Map<string, { data: any; expiry: number }>();
const episodeSlugCache = new Map<string, { data: any; expiry: number }>();
const guestSlugCache = new Map<string, { data: any; expiry: number }>();
const guestEpisodesCache = new Map<string, { data: any; expiry: number }>();
const adjacentEpisodesCache = new Map<string, { data: any; expiry: number }>();

let cachedTopics: any[] | null = null;
let topicsCacheExpiry = 0;
let topicsInFlight: Promise<any[]> | null = null;

let latestEpisodeCache: { data: any; expiry: number } | null = null;

export function invalidateSiteSettingsCache(): void {
  cachedSiteSettings = null;
  siteSettingsCacheExpiry = 0;
  siteSettingsInFlight = null;
}

export function invalidatePodcastCache(): void {
  invalidateSiteSettingsCache();
  cachedTopics = null;
  topicsCacheExpiry = 0;
  topicsInFlight = null;
  latestEpisodeCache = null;
  episodesQueryCache.clear();
  guestsQueryCache.clear();
  episodeSlugCache.clear();
  guestSlugCache.clear();
  guestEpisodesCache.clear();
  adjacentEpisodesCache.clear();
}

/**
 * Batched formatter for episodes. Fetches related guests, topics, takeaways, quotes, and tags
 * across all episode IDs in 5 parallel queries instead of 5N sequential/uncontrolled queries.
 */
export async function formatEpisodesBatch(rows: any[]): Promise<any[]> {
  if (!rows || rows.length === 0) return [];

  const episodeIds = rows.map((r) => Number(r.id)).filter(Boolean);
  if (episodeIds.length === 0) return [];

  const idPlaceholders = episodeIds.map(() => '?').join(',');

  const [guestsRes, topicsRes, takeawaysRes, quotesRes, tagsRes] = await Promise.all([
    db.execute({
      sql: `
        SELECT r.parent_id, g.id, g.full_name, g.slug, g.role, g.company, COALESCE(g.portrait_url, m.url) as portrait_url
        FROM episodes_rels r
        JOIN guests g ON r.guests_id = g.id
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE r.path = 'guests' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: episodeIds,
    }),
    db.execute({
      sql: `
        SELECT r.parent_id, t.id, t.name, t.slug
        FROM episodes_rels r
        JOIN topics t ON r.topics_id = t.id
        WHERE r.path = 'topics' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: episodeIds,
    }),
    db.execute({
      sql: `SELECT _parent_id, takeaway FROM episodes_key_takeaways WHERE _parent_id IN (${idPlaceholders}) ORDER BY _order ASC`,
      args: episodeIds,
    }),
    db.execute({
      sql: `SELECT _parent_id, quote, speaker FROM episodes_quotes WHERE _parent_id IN (${idPlaceholders}) ORDER BY _order ASC`,
      args: episodeIds,
    }),
    db.execute({
      sql: `SELECT _parent_id, tag FROM episodes_tags WHERE _parent_id IN (${idPlaceholders}) ORDER BY _order ASC`,
      args: episodeIds,
    }),
  ]);

  const guestsByParent = new Map<number, any[]>();
  for (const g of guestsRes.rows) {
    const parentId = Number(g.parent_id);
    if (!guestsByParent.has(parentId)) guestsByParent.set(parentId, []);
    guestsByParent.get(parentId)!.push({
      id: Number(g.id),
      fullName: String(g.full_name),
      full_name: String(g.full_name),
      slug: String(g.slug),
      role: g.role ? String(g.role) : undefined,
      company: g.company ? String(g.company) : undefined,
      portraitUrl: g.portrait_url ? String(g.portrait_url) : undefined,
      portrait: g.portrait_url ? { url: String(g.portrait_url) } : null,
    });
  }

  const topicsByParent = new Map<number, any[]>();
  for (const t of topicsRes.rows) {
    const parentId = Number(t.parent_id);
    if (!topicsByParent.has(parentId)) topicsByParent.set(parentId, []);
    topicsByParent.get(parentId)!.push({
      id: Number(t.id),
      name: String(t.name),
      slug: String(t.slug),
    });
  }

  const takeawaysByParent = new Map<number, string[]>();
  for (const t of takeawaysRes.rows) {
    const parentId = Number(t._parent_id);
    if (!takeawaysByParent.has(parentId)) takeawaysByParent.set(parentId, []);
    if (t.takeaway) takeawaysByParent.get(parentId)!.push(String(t.takeaway));
  }

  const quotesByParent = new Map<number, any[]>();
  for (const q of quotesRes.rows) {
    const parentId = Number(q._parent_id);
    if (!quotesByParent.has(parentId)) quotesByParent.set(parentId, []);
    quotesByParent.get(parentId)!.push({
      quote: String(q.quote || ''),
      speaker: String(q.speaker || ''),
    });
  }

  const tagsByParent = new Map<number, any[]>();
  for (const tg of tagsRes.rows) {
    const parentId = Number(tg._parent_id);
    if (!tagsByParent.has(parentId)) tagsByParent.set(parentId, []);
    tagsByParent.get(parentId)!.push({ tag: String(tg.tag || '') });
  }

  return rows.map((row) => {
    const id = Number(row.id);
    const thumbnailUrl = row.thumbnail_url ? String(row.thumbnail_url) : null;
    const guests = guestsByParent.get(id) || [];
    const topics = topicsByParent.get(id) || [];
    const keyTakeaways = takeawaysByParent.get(id) || [];
    const quotes = quotesByParent.get(id) || [];
    const tags = tagsByParent.get(id) || [];

    return {
      id,
      title: String(row.title),
      slug: String(row.slug),
      youtubeUrl: row.youtube_url ? String(row.youtube_url) : undefined,
      youtube_url: row.youtube_url ? String(row.youtube_url) : undefined,
      youtubeVideoId: row.youtube_video_id ? String(row.youtube_video_id) : null,
      youtube_video_id: row.youtube_video_id ? String(row.youtube_video_id) : null,
      fallbackWatchUrl: row.fallback_watch_url ? String(row.fallback_watch_url) : undefined,
      fallback_watch_url: row.fallback_watch_url ? String(row.fallback_watch_url) : undefined,
      shortSummary: row.short_summary ? String(row.short_summary) : '',
      short_summary: row.short_summary ? String(row.short_summary) : '',
      description: row.description ? String(row.description) : '',
      thumbnailId: row.thumbnail_id ? Number(row.thumbnail_id) : undefined,
      thumbnail_id: row.thumbnail_id ? Number(row.thumbnail_id) : undefined,
      thumbnailUrl,
      thumbnail: thumbnailUrl ? { url: thumbnailUrl, alt: row.title } : null,
      episodeNumber: row.episode_number ? Number(row.episode_number) : null,
      episode_number: row.episode_number ? Number(row.episode_number) : null,
      season: row.season ? Number(row.season) : null,
      publishedAt: normalizeIsoTimestamp(row.published_at) || toUtcIsoString(new Date()),
      published_at: normalizeIsoTimestamp(row.published_at) || toUtcIsoString(new Date()),
      transcript: row.transcript ? String(row.transcript) : undefined,
      featured: Boolean(row.featured),
      status: row.status || 'draft',
      seoTitle: row.seo_title ? String(row.seo_title) : undefined,
      seo_title: row.seo_title ? String(row.seo_title) : undefined,
      seoDescription: row.seo_description ? String(row.seo_description) : undefined,
      seo_description: row.seo_description ? String(row.seo_description) : undefined,
      canonicalOverride: row.canonical_override ? String(row.canonical_override) : undefined,
      canonical_override: row.canonical_override ? String(row.canonical_override) : undefined,
      updatedAt: normalizeIsoTimestamp(row.updated_at) || '',
      createdAt: normalizeIsoTimestamp(row.created_at) || '',
      guests,
      topics,
      keyTakeaways,
      key_takeaways: keyTakeaways,
      quotes,
      tags,
    };
  });
}

/**
 * Batched formatter for guests. Fetches related topics and key insights
 * across all guest IDs in 2 parallel queries instead of 2N sequential/uncontrolled queries.
 */
export async function formatGuestsBatch(rows: any[]): Promise<any[]> {
  if (!rows || rows.length === 0) return [];

  const guestIds = rows.map((r) => Number(r.id)).filter(Boolean);
  if (guestIds.length === 0) return [];

  const idPlaceholders = guestIds.map(() => '?').join(',');

  const [topicsRes, insightsRes] = await Promise.all([
    db.execute({
      sql: `
        SELECT r.parent_id, t.id, t.name, t.slug
        FROM guests_rels r
        JOIN topics t ON r.topics_id = t.id
        WHERE r.path = 'topics' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: guestIds,
    }),
    db.execute({
      sql: `SELECT _parent_id, quote, context FROM guests_key_insights WHERE _parent_id IN (${idPlaceholders}) ORDER BY _order ASC`,
      args: guestIds,
    }),
  ]);

  const topicsByParent = new Map<number, any[]>();
  for (const t of topicsRes.rows) {
    const parentId = Number(t.parent_id);
    if (!topicsByParent.has(parentId)) topicsByParent.set(parentId, []);
    topicsByParent.get(parentId)!.push({
      id: Number(t.id),
      name: String(t.name),
      slug: String(t.slug),
    });
  }

  const insightsByParent = new Map<number, any[]>();
  for (const i of insightsRes.rows) {
    const parentId = Number(i._parent_id);
    if (!insightsByParent.has(parentId)) insightsByParent.set(parentId, []);
    insightsByParent.get(parentId)!.push({
      quote: String(i.quote || ''),
      context: i.context ? String(i.context) : undefined,
    });
  }

  return rows.map((row) => {
    const id = Number(row.id);
    const rawPortraitUrl = row.portrait_url ? String(row.portrait_url) : null;
    const portraitUrl = normalizeImageUrl(rawPortraitUrl);
    const topics = topicsByParent.get(id) || [];
    const keyInsights = insightsByParent.get(id) || [];

    const rawLinkedin = row.links_linkedin || row.linkedin_url || null;
    const rawWebsite = row.links_website || row.website_url || null;
    const rawOther = row.links_other || null;

    const linksLinkedin = normalizeUrl(rawLinkedin ? String(rawLinkedin) : null);
    const linksWebsite = normalizeUrl(rawWebsite ? String(rawWebsite) : null);
    const linksOther = normalizeUrl(rawOther ? String(rawOther) : null);

    const links = {
      linkedin: linksLinkedin,
      website: linksWebsite,
      other: linksOther,
    };

    return {
      id,
      fullName: String(row.full_name),
      full_name: String(row.full_name),
      slug: String(row.slug),
      role: String(row.role || ''),
      company: row.company ? String(row.company) : null,
      shortOverview: row.short_overview ? String(row.short_overview) : '',
      short_overview: row.short_overview ? String(row.short_overview) : '',
      biography: row.biography ? String(row.biography) : (row.bio ? String(row.bio) : ''),
      portraitId: row.portrait_id ? Number(row.portrait_id) : undefined,
      portraitUrl,
      portrait: portraitUrl ? { url: portraitUrl, alt: row.portrait_alt || row.full_name } : null,
      portraitAlt: row.portrait_alt ? String(row.portrait_alt) : null,
      portraitCredit: row.portrait_credit ? String(row.portrait_credit) : null,
      links,
      linksLinkedin,
      links_linkedin: linksLinkedin,
      linksWebsite,
      links_website: linksWebsite,
      linksOther,
      links_other: linksOther,
      featured: Boolean(row.featured),
      status: row.status || 'draft',
      seoTitle: row.seo_title ? String(row.seo_title) : undefined,
      seo_title: row.seo_title ? String(row.seo_title) : undefined,
      seoDescription: row.seo_description ? String(row.seo_description) : undefined,
      seo_description: row.seo_description ? String(row.seo_description) : undefined,
      canonicalOverride: row.canonical_override ? String(row.canonical_override) : undefined,
      canonical_override: row.canonical_override ? String(row.canonical_override) : undefined,
      topics,
      industries: topics,
      keyInsights,
      updatedAt: normalizeIsoTimestamp(row.updated_at) || '',
      createdAt: normalizeIsoTimestamp(row.created_at) || '',
    };
  });
}

// Single-episode helper delegating to the batched implementation
async function formatEpisode(row: any): Promise<any> {
  if (!row) return null;
  const [formatted] = await formatEpisodesBatch([row]);
  return formatted || null;
}

// Single-guest helper delegating to the batched implementation
async function formatGuest(row: any): Promise<any> {
  if (!row) return null;
  const [formatted] = await formatGuestsBatch([row]);
  return formatted || null;
}

export async function getPayloadClient() {
  return {
    find: async () => ({ docs: [], totalDocs: 0, totalPages: 1 }),
    findGlobal: async () => getSiteSettings(),
    count: async () => 0,
  };
}

export async function getSiteSettings() {
  const now = Date.now();
  if (cachedSiteSettings && now < siteSettingsCacheExpiry) {
    return cachedSiteSettings;
  }

  if (siteSettingsInFlight) {
    return await siteSettingsInFlight;
  }

  siteSettingsInFlight = (async () => {
    try {
      const res = await db.execute(`
        SELECT 
          s.*,
          m_logo.url as logo_url,
          m_og.url as default_og_image_url,
          m_host.url as host_portrait_url
        FROM site_settings s
        LEFT JOIN media m_logo ON s.logo_id = m_logo.id
        LEFT JOIN media m_og ON s.default_og_image_id = m_og.id
        LEFT JOIN media m_host ON s.host_portrait_id = m_host.id
        LIMIT 1
      `);

      if (res.rows.length === 0) return null;
      const r = res.rows[0];

      const parsed = {
        id: Number(r.id),
        brandName: r.brand_name ? String(r.brand_name) : siteConfig.brandName,
        brand_name: r.brand_name ? String(r.brand_name) : siteConfig.brandName,
        tagline: r.tagline ? String(r.tagline) : siteConfig.tagline,
        publisherName: r.publisher_name ? String(r.publisher_name) : siteConfig.publisher.name,
        publisher_name: r.publisher_name ? String(r.publisher_name) : siteConfig.publisher.name,
        publisherUrl: r.publisher_url ? String(r.publisher_url) : siteConfig.publisher.url,
        publisher_url: r.publisher_url ? String(r.publisher_url) : siteConfig.publisher.url,
        attribution: r.attribution ? String(r.attribution) : undefined,
        heroHeadline: r.hero_headline ? String(r.hero_headline) : undefined,
        hero_headline: r.hero_headline ? String(r.hero_headline) : undefined,
        heroMission: r.hero_mission ? String(r.hero_mission) : undefined,
        hero_mission: r.hero_mission ? String(r.hero_mission) : undefined,
        aboutMission: r.about_mission ? String(r.about_mission) : undefined,
        about_mission: r.about_mission ? String(r.about_mission) : undefined,
        aboutAudience: r.about_audience ? String(r.about_audience) : undefined,
        about_audience: r.about_audience ? String(r.about_audience) : undefined,
        aboutEditorial: r.about_editorial ? String(r.about_editorial) : undefined,
        about_editorial: r.about_editorial ? String(r.about_editorial) : undefined,
        hasHostSection: Boolean(r.has_host_section),
        has_host_section: Boolean(r.has_host_section),
        hostName: r.host_name ? String(r.host_name) : undefined,
        host_name: r.host_name ? String(r.host_name) : undefined,
        hostRole: r.host_role ? String(r.host_role) : undefined,
        host_role: r.host_role ? String(r.host_role) : undefined,
        hostBio: r.host_bio ? String(r.host_bio) : undefined,
        host_bio: r.host_bio ? String(r.host_bio) : undefined,
        hostPortrait: r.host_portrait_url ? { url: String(r.host_portrait_url) } : null,
        host_portrait_url: r.host_portrait_url ? String(r.host_portrait_url) : undefined,
        logo: r.logo_url ? { url: String(r.logo_url) } : null,
        logoUrl: r.logo_url ? String(r.logo_url) : undefined,
        defaultOgImage: r.default_og_image_url ? { url: String(r.default_og_image_url) } : null,
        youtubeChannelUrl: r.youtube_channel_url ? String(r.youtube_channel_url) : undefined,
        youtube_channel_url: r.youtube_channel_url ? String(r.youtube_channel_url) : undefined,
        linkedinUrl: r.linkedin_url ? String(r.linkedin_url) : undefined,
        linkedin_url: r.linkedin_url ? String(r.linkedin_url) : undefined,
        twitterUrl: r.twitter_url ? String(r.twitter_url) : undefined,
        twitter_url: r.twitter_url ? String(r.twitter_url) : undefined,
        spotifyUrl: r.spotify_url ? String(r.spotify_url) : undefined,
        spotify_url: r.spotify_url ? String(r.spotify_url) : undefined,
        applePodcastsUrl: r.apple_podcasts_url ? String(r.apple_podcasts_url) : undefined,
        apple_podcasts_url: r.apple_podcasts_url ? String(r.apple_podcasts_url) : undefined,
        contactEmail: r.contact_email ? String(r.contact_email) : undefined,
        contact_email: r.contact_email ? String(r.contact_email) : undefined,
        contactPhone: r.contact_phone ? String(r.contact_phone) : undefined,
        contactAddress: r.contact_address ? String(r.contact_address) : undefined,
        nominationRecipientEmail: r.nomination_recipient_email ? String(r.nomination_recipient_email) : undefined,
        nomination_recipient_email: r.nomination_recipient_email ? String(r.nomination_recipient_email) : undefined,
        nominationWebhookUrl: r.nomination_webhook_url ? String(r.nomination_webhook_url) : undefined,
        analyticsId: r.analytics_id ? String(r.analytics_id) : undefined,
        analytics_id: r.analytics_id ? String(r.analytics_id) : undefined,
        privacyPolicyContent: r.privacy_policy_content ? String(r.privacy_policy_content) : undefined,
        termsContent: r.terms_content ? String(r.terms_content) : undefined,
      };

      cachedSiteSettings = parsed;
      siteSettingsCacheExpiry = Date.now() + 30_000; // 30 seconds cache TTL
      return parsed;
    } catch (err: any) {
      console.error('getSiteSettings error:', err?.message || err);
      return null;
    } finally {
      siteSettingsInFlight = null;
    }
  })();

  return await siteSettingsInFlight;
}

export async function getRedirectForPath(fromPath: string): Promise<string | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT "to" FROM redirects WHERE "from" = ? LIMIT 1',
      args: [fromPath],
    });
    return res.rows[0]?.to ? String(res.rows[0].to) : null;
  } catch {
    return null;
  }
}

export async function getTopics() {
  const now = Date.now();
  if (cachedTopics && now < topicsCacheExpiry) {
    return cachedTopics;
  }

  if (topicsInFlight) {
    return await topicsInFlight;
  }

  topicsInFlight = (async () => {
    try {
      const res = await db.execute('SELECT * FROM topics ORDER BY name ASC LIMIT 100');
      const parsed = res.rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name),
        slug: String(r.slug),
        description: r.description ? String(r.description) : undefined,
      }));
      cachedTopics = parsed;
      topicsCacheExpiry = Date.now() + 300_000; // 5 minutes TTL
      return parsed;
    } catch {
      return [];
    } finally {
      topicsInFlight = null;
    }
  })();

  return await topicsInFlight;
}

export async function getLatestEpisode() {
  const now = Date.now();
  if (latestEpisodeCache && now < latestEpisodeCache.expiry) {
    return latestEpisodeCache.data;
  }

  try {
    const nowIso = new Date().toISOString();
    const res = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at <= ?
        ORDER BY e.published_at DESC
        LIMIT 1
      `,
      args: [nowIso],
    });

    if (res.rows.length === 0) return null;
    const formatted = await formatEpisode(res.rows[0]);
    latestEpisodeCache = { data: formatted, expiry: Date.now() + 45_000 }; // 45 seconds TTL
    return formatted;
  } catch (err: any) {
    console.error('getLatestEpisode error:', err?.message || err);
    return null;
  }
}

export async function getPublishedEpisodes(options: {
  topicSlug?: string;
  guestSlug?: string;
  year?: string;
  page?: number;
  limit?: number;
} = {}) {
  const cacheKey = JSON.stringify(options);
  const cached = getTimedCache(episodesQueryCache, cacheKey);
  if (cached) return cached;

  try {
    const now = new Date().toISOString();
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 12);
    const offset = (page - 1) * limit;

    const conditions: string[] = ["e.status = 'published'", 'e.published_at <= ?'];
    const args: any[] = [now];

    if (options.year) {
      conditions.push("to_char(e.published_at::timestamptz, 'YYYY') = ?");
      args.push(options.year);
    }

    if (options.topicSlug) {
      conditions.push(`
        e.id IN (
          SELECT r.parent_id FROM episodes_rels r
          JOIN topics t ON r.topics_id = t.id
          WHERE r.path = 'topics' AND t.slug = ?
        )
      `);
      args.push(options.topicSlug);
    }

    if (options.guestSlug) {
      conditions.push(`
        e.id IN (
          SELECT r.parent_id FROM episodes_rels r
          JOIN guests g ON r.guests_id = g.id
          WHERE r.path = 'guests' AND g.slug = ?
        )
      `);
      args.push(options.guestSlug);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM episodes e WHERE ${whereClause}`,
      args: [...args],
    });
    const totalDocs = Number(countRes.rows[0]?.total || 0);
    const totalPages = Math.ceil(totalDocs / limit) || 1;

    // Docs
    const docsRes = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE ${whereClause}
        ORDER BY e.published_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    const docs = await formatEpisodesBatch(docsRes.rows);

    const result = {
      docs,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    setTimedCache(episodesQueryCache, cacheKey, result, 30_000); // 30 seconds TTL
    return result;
  } catch (err: any) {
    console.error('getPublishedEpisodes error:', err?.message || err);
    return { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false };
  }
}

const fetchEpisodeBySlug = async (slug: string) => {
  const cached = getTimedCache(episodeSlugCache, slug);
  if (cached) return cached;

  try {
    const res = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.slug = ?
        LIMIT 1
      `,
      args: [slug],
    });

    if (res.rows.length === 0) return null;
    const formatted = await formatEpisode(res.rows[0]);
    if (formatted) {
      setTimedCache(episodeSlugCache, slug, formatted, 60_000); // 60 seconds TTL
    }
    return formatted;
  } catch (err: any) {
    console.error('getEpisodeBySlug error:', err?.message || err);
    return null;
  }
};

export const getEpisodeBySlug = cache(fetchEpisodeBySlug);

export async function getAdjacentEpisodes(currentPublishedAt: string) {
  const cached = getTimedCache(adjacentEpisodesCache, currentPublishedAt);
  if (cached) return cached;

  try {
    const now = new Date().toISOString();

    const [prevRes, nextRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT e.*, m.url as thumbnail_url
          FROM episodes e
          LEFT JOIN media m ON e.thumbnail_id = m.id
          WHERE e.status = 'published' AND e.published_at < ?
          ORDER BY e.published_at DESC
          LIMIT 1
        `,
        args: [currentPublishedAt],
      }),
      db.execute({
        sql: `
          SELECT e.*, m.url as thumbnail_url
          FROM episodes e
          LEFT JOIN media m ON e.thumbnail_id = m.id
          WHERE e.status = 'published' AND e.published_at > ? AND e.published_at <= ?
          ORDER BY e.published_at ASC
          LIMIT 1
        `,
        args: [currentPublishedAt, now],
      }),
    ]);

    const [prev, next] = await Promise.all([
      prevRes.rows.length > 0 ? formatEpisode(prevRes.rows[0]) : null,
      nextRes.rows.length > 0 ? formatEpisode(nextRes.rows[0]) : null,
    ]);

    const result = { prev, next };
    setTimedCache(adjacentEpisodesCache, currentPublishedAt, result, 60_000); // 60 seconds TTL
    return result;
  } catch {
    return { prev: null, next: null };
  }
}

export async function getPublishedGuests(options: {
  industrySlug?: string;
  page?: number;
  limit?: number;
  featuredOnly?: boolean;
} = {}) {
  const cacheKey = JSON.stringify(options);
  const cached = getTimedCache(guestsQueryCache, cacheKey);
  if (cached) return cached;

  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 24);
    const offset = (page - 1) * limit;

    const conditions: string[] = ["g.status = 'published'"];
    const args: any[] = [];

    if (options.featuredOnly) {
      conditions.push('g.featured = 1');
    }

    if (options.industrySlug) {
      conditions.push(`
        g.id IN (
          SELECT r.parent_id FROM guests_rels r
          JOIN topics t ON r.topics_id = t.id
          WHERE r.path = 'topics' AND t.slug = ?
        )
      `);
      args.push(options.industrySlug);
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM guests g WHERE ${whereClause}`,
      args: [...args],
    });
    const totalDocs = Number(countRes.rows[0]?.total || 0);
    const totalPages = Math.ceil(totalDocs / limit) || 1;

    // Docs
    const docsRes = await db.execute({
      sql: `
        SELECT g.*, COALESCE(g.portrait_url, m.url) as portrait_url
        FROM guests g
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE ${whereClause}
        ORDER BY g.featured DESC, g.full_name ASC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    const docs = await formatGuestsBatch(docsRes.rows);

    const result = {
      docs,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    setTimedCache(guestsQueryCache, cacheKey, result, 30_000); // 30 seconds TTL
    return result;
  } catch (err: any) {
    console.error('getPublishedGuests error:', err?.message || err);
    return { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false };
  }
}

const fetchGuestBySlug = async (slug: string) => {
  const cached = getTimedCache(guestSlugCache, slug);
  if (cached) return cached;

  try {
    const res = await db.execute({
      sql: `
        SELECT g.*, COALESCE(g.portrait_url, m.url) as portrait_url
        FROM guests g
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE g.slug = ?
        LIMIT 1
      `,
      args: [slug],
    });

    if (res.rows.length === 0) return null;
    const formatted = await formatGuest(res.rows[0]);
    if (formatted) {
      setTimedCache(guestSlugCache, slug, formatted, 60_000); // 60 seconds TTL
    }
    return formatted;
  } catch (err: any) {
    console.error('getGuestBySlug error:', err?.message || err);
    return null;
  }
};

export const getGuestBySlug = cache(fetchGuestBySlug);

export async function getEpisodesForGuest(guestId: string | number) {
  const key = String(guestId);
  const cached = getTimedCache(guestEpisodesCache, key);
  if (cached) return cached;

  try {
    const now = new Date().toISOString();
    const res = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        JOIN episodes_rels r ON r.parent_id = e.id AND r.path = 'guests' AND r.guests_id = ?
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at <= ?
        ORDER BY e.published_at DESC
        LIMIT 50
      `,
      args: [Number(guestId), now],
    });

    const formatted = await formatEpisodesBatch(res.rows);
    setTimedCache(guestEpisodesCache, key, formatted, 60_000); // 60 seconds TTL
    return formatted;
  } catch (err: any) {
    console.error('getEpisodesForGuest error:', err?.message || err);
    return [];
  }
}

export async function executeGlobalSearch(query: string): Promise<SearchResults> {
  const cleanQ = query.trim();
  if (!cleanQ) {
    return { query: '', guests: [], episodes: [], totalCount: 0 };
  }

  try {
    const now = new Date().toISOString();
    const searchTerm = `%${cleanQ}%`;

    // Execute guests and episodes search queries in parallel
    const [guestsRes, episodesRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT g.*, m.url as portrait_url
          FROM guests g
          LEFT JOIN media m ON g.portrait_id = m.id
          WHERE g.status = 'published'
            AND (g.full_name LIKE ? OR g.role LIKE ? OR g.company LIKE ? OR g.short_overview LIKE ?)
          LIMIT 25
        `,
        args: [searchTerm, searchTerm, searchTerm, searchTerm],
      }),
      db.execute({
        sql: `
          SELECT e.*, m.url as thumbnail_url
          FROM episodes e
          LEFT JOIN media m ON e.thumbnail_id = m.id
          WHERE e.status = 'published' AND e.published_at <= ?
            AND (e.title LIKE ? OR e.short_summary LIKE ? OR e.description LIKE ?)
          LIMIT 25
        `,
        args: [now, searchTerm, searchTerm, searchTerm],
      }),
    ]);

    // Batch guest industries
    const guestIds = guestsRes.rows.map((g) => Number(g.id)).filter(Boolean);
    const guestTopicsMap = new Map<number, Array<{ name: string; slug: string }>>();
    if (guestIds.length > 0) {
      const gPlaceholders = guestIds.map(() => '?').join(',');
      const gtRes = await db.execute({
        sql: `SELECT r.parent_id, t.name, t.slug FROM guests_rels r JOIN topics t ON r.topics_id = t.id WHERE r.path = 'topics' AND r.parent_id IN (${gPlaceholders}) ORDER BY r."order" ASC`,
        args: guestIds,
      });
      for (const row of gtRes.rows) {
        const pid = Number(row.parent_id);
        if (!guestTopicsMap.has(pid)) guestTopicsMap.set(pid, []);
        guestTopicsMap.get(pid)!.push({ name: String(row.name), slug: String(row.slug) });
      }
    }

    const formattedGuests: SearchGuestItem[] = guestsRes.rows.map((g) => ({
      id: String(g.id),
      fullName: String(g.full_name),
      alternateNames: [],
      slug: String(g.slug),
      role: String(g.role || ''),
      company: g.company ? String(g.company) : null,
      shortOverview: String(g.short_overview || ''),
      portraitUrl: g.portrait_url ? String(g.portrait_url) : null,
      industries: guestTopicsMap.get(Number(g.id)) || [],
    }));

    // Batch episode relations
    const episodeIds = episodesRes.rows.map((e) => Number(e.id)).filter(Boolean);
    const epGuestsMap = new Map<number, string[]>();
    const epTagsMap = new Map<number, string[]>();
    const epTopicsMap = new Map<number, Array<{ name: string; slug: string }>>();

    if (episodeIds.length > 0) {
      const ePlaceholders = episodeIds.map(() => '?').join(',');
      const [guestsRel, tagsRel, topicsRel] = await Promise.all([
        db.execute({
          sql: `SELECT r.parent_id, g.full_name FROM episodes_rels r JOIN guests g ON r.guests_id = g.id WHERE r.path = 'guests' AND r.parent_id IN (${ePlaceholders}) ORDER BY r."order" ASC`,
          args: episodeIds,
        }),
        db.execute({
          sql: `SELECT _parent_id, tag FROM episodes_tags WHERE _parent_id IN (${ePlaceholders}) ORDER BY _order ASC`,
          args: episodeIds,
        }),
        db.execute({
          sql: `SELECT r.parent_id, t.name, t.slug FROM episodes_rels r JOIN topics t ON r.topics_id = t.id WHERE r.path = 'topics' AND r.parent_id IN (${ePlaceholders}) ORDER BY r."order" ASC`,
          args: episodeIds,
        }),
      ]);

      for (const row of guestsRel.rows) {
        const pid = Number(row.parent_id);
        if (!epGuestsMap.has(pid)) epGuestsMap.set(pid, []);
        epGuestsMap.get(pid)!.push(String(row.full_name));
      }
      for (const row of tagsRel.rows) {
        const pid = Number(row._parent_id);
        if (!epTagsMap.has(pid)) epTagsMap.set(pid, []);
        if (row.tag) epTagsMap.get(pid)!.push(String(row.tag));
      }
      for (const row of topicsRel.rows) {
        const pid = Number(row.parent_id);
        if (!epTopicsMap.has(pid)) epTopicsMap.set(pid, []);
        epTopicsMap.get(pid)!.push({ name: String(row.name), slug: String(row.slug) });
      }
    }

    const formattedEpisodes: SearchEpisodeItem[] = episodesRes.rows.map((e) => ({
      id: String(e.id),
      title: String(e.title),
      slug: String(e.slug),
      shortSummary: String(e.short_summary || ''),
      thumbnailUrl: e.thumbnail_url ? String(e.thumbnail_url) : null,
      youtubeVideoId: e.youtube_video_id ? String(e.youtube_video_id) : null,
      publishedAt: normalizeIsoTimestamp(e.published_at) || '',
      guestNames: epGuestsMap.get(Number(e.id)) || [],
      tags: epTagsMap.get(Number(e.id)) || [],
      topics: epTopicsMap.get(Number(e.id)) || [],
    }));

    return searchCollections(cleanQ, formattedGuests, formattedEpisodes);
  } catch (err: any) {
    console.error('executeGlobalSearch error:', err?.message || err);
    return { query: cleanQ, guests: [], episodes: [], totalCount: 0 };
  }
}
