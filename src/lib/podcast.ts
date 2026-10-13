import { db } from './db/client';
import { siteConfig } from '../config/site';
import {
  searchCollections,
  SearchGuestItem,
  SearchEpisodeItem,
  SearchResults,
} from '../utils/search';

// Helper to format an episode row into the object shape expected by frontend components
async function formatEpisode(row: any): Promise<any> {
  if (!row) return null;
  const id = Number(row.id);

  // Related guests
  const guestsRes = await db.execute({
    sql: `
      SELECT g.id, g.full_name, g.slug, g.role, g.company, m.url as portrait_url
      FROM episodes_rels r
      JOIN guests g ON r.guests_id = g.id
      LEFT JOIN media m ON g.portrait_id = m.id
      WHERE r.path = 'guests' AND r.parent_id = ?
      ORDER BY r."order" ASC
    `,
    args: [id],
  });

  // Related topics
  const topicsRes = await db.execute({
    sql: `
      SELECT t.id, t.name, t.slug
      FROM episodes_rels r
      JOIN topics t ON r.topics_id = t.id
      WHERE r.path = 'topics' AND r.parent_id = ?
      ORDER BY r."order" ASC
    `,
    args: [id],
  });

  // Key takeaways
  const takeawaysRes = await db.execute({
    sql: `SELECT takeaway FROM episodes_key_takeaways WHERE _parent_id = ? ORDER BY _order ASC`,
    args: [id],
  });

  // Quotes
  const quotesRes = await db.execute({
    sql: `SELECT quote, speaker FROM episodes_quotes WHERE _parent_id = ? ORDER BY _order ASC`,
    args: [id],
  });

  // Tags
  const tagsRes = await db.execute({
    sql: `SELECT tag FROM episodes_tags WHERE _parent_id = ? ORDER BY _order ASC`,
    args: [id],
  });

  const guests = guestsRes.rows.map((g) => ({
    id: Number(g.id),
    fullName: String(g.full_name),
    full_name: String(g.full_name),
    slug: String(g.slug),
    role: g.role ? String(g.role) : undefined,
    company: g.company ? String(g.company) : undefined,
    portraitUrl: g.portrait_url ? String(g.portrait_url) : undefined,
    portrait: g.portrait_url ? { url: String(g.portrait_url) } : null,
  }));

  const topics = topicsRes.rows.map((t) => ({
    id: Number(t.id),
    name: String(t.name),
    slug: String(t.slug),
  }));

  const thumbnailUrl = row.thumbnail_url ? String(row.thumbnail_url) : null;

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
    publishedAt: row.published_at ? String(row.published_at) : new Date().toISOString(),
    published_at: row.published_at ? String(row.published_at) : new Date().toISOString(),
    transcript: row.transcript ? String(row.transcript) : undefined,
    featured: Boolean(row.featured),
    status: row.status || 'draft',
    seoTitle: row.seo_title ? String(row.seo_title) : undefined,
    seo_title: row.seo_title ? String(row.seo_title) : undefined,
    seoDescription: row.seo_description ? String(row.seo_description) : undefined,
    seo_description: row.seo_description ? String(row.seo_description) : undefined,
    canonicalOverride: row.canonical_override ? String(row.canonical_override) : undefined,
    canonical_override: row.canonical_override ? String(row.canonical_override) : undefined,
    updatedAt: String(row.updated_at || ''),
    createdAt: String(row.created_at || ''),
    guests,
    topics,
    keyTakeaways: takeawaysRes.rows.map((t) => String(t.takeaway || '')).filter(Boolean),
    key_takeaways: takeawaysRes.rows.map((t) => String(t.takeaway || '')).filter(Boolean),
    quotes: quotesRes.rows.map((q) => ({
      quote: String(q.quote || ''),
      speaker: String(q.speaker || ''),
    })),
    tags: tagsRes.rows.map((t) => ({ tag: String(t.tag || '') })),
  };
}

// Helper to format a guest row
async function formatGuest(row: any): Promise<any> {
  if (!row) return null;
  const id = Number(row.id);

  // Topics / industries
  const topicsRes = await db.execute({
    sql: `
      SELECT t.id, t.name, t.slug
      FROM guests_rels r
      JOIN topics t ON r.topics_id = t.id
      WHERE r.path = 'topics' AND r.parent_id = ?
      ORDER BY r."order" ASC
    `,
    args: [id],
  });

  // Key insights
  const insightsRes = await db.execute({
    sql: `SELECT quote, context FROM guests_key_insights WHERE _parent_id = ? ORDER BY _order ASC`,
    args: [id],
  });

  const portraitUrl = row.portrait_url ? String(row.portrait_url) : null;
  const topics = topicsRes.rows.map((t) => ({
    id: Number(t.id),
    name: String(t.name),
    slug: String(t.slug),
  }));

  return {
    id,
    fullName: String(row.full_name),
    full_name: String(row.full_name),
    slug: String(row.slug),
    role: String(row.role || ''),
    company: row.company ? String(row.company) : null,
    shortOverview: row.short_overview ? String(row.short_overview) : '',
    short_overview: row.short_overview ? String(row.short_overview) : '',
    biography: row.biography ? String(row.biography) : '',
    portraitId: row.portrait_id ? Number(row.portrait_id) : undefined,
    portraitUrl,
    portrait: portraitUrl ? { url: portraitUrl, alt: row.portrait_alt || row.full_name } : null,
    portraitAlt: row.portrait_alt ? String(row.portrait_alt) : null,
    portraitCredit: row.portrait_credit ? String(row.portrait_credit) : null,
    linksLinkedin: row.links_linkedin ? String(row.links_linkedin) : null,
    links_linkedin: row.links_linkedin ? String(row.links_linkedin) : null,
    linksWebsite: row.links_website ? String(row.links_website) : null,
    links_website: row.links_website ? String(row.links_website) : null,
    linksOther: row.links_other ? String(row.links_other) : null,
    links_other: row.links_other ? String(row.links_other) : null,
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
    keyInsights: insightsRes.rows.map((i) => ({
      quote: String(i.quote || ''),
      context: i.context ? String(i.context) : undefined,
    })),
    updatedAt: String(row.updated_at || ''),
    createdAt: String(row.created_at || ''),
  };
}

export async function getPayloadClient() {
  return {
    find: async () => ({ docs: [], totalDocs: 0, totalPages: 1 }),
    findGlobal: async () => getSiteSettings(),
    count: async () => 0,
  };
}

export async function getSiteSettings() {
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

    return {
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
  } catch (err) {
    console.error('getSiteSettings error:', err);
    return null;
  }
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
  try {
    const res = await db.execute('SELECT * FROM topics ORDER BY name ASC LIMIT 100');
    return res.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name),
      slug: String(r.slug),
      description: r.description ? String(r.description) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function getLatestEpisode() {
  try {
    const now = new Date().toISOString();
    const res = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at <= ?
        ORDER BY e.published_at DESC
        LIMIT 1
      `,
      args: [now],
    });

    if (res.rows.length === 0) return null;
    return await formatEpisode(res.rows[0]);
  } catch (err) {
    console.error('getLatestEpisode error:', err);
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

    const docs = await Promise.all(docsRes.rows.map(formatEpisode));

    return {
      docs,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  } catch (err) {
    console.error('getPublishedEpisodes error:', err);
    return { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false };
  }
}

export async function getEpisodeBySlug(slug: string) {
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
    return await formatEpisode(res.rows[0]);
  } catch (err) {
    console.error('getEpisodeBySlug error:', err);
    return null;
  }
}

export async function getAdjacentEpisodes(currentPublishedAt: string) {
  try {
    const now = new Date().toISOString();

    const prevRes = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at < ?
        ORDER BY e.published_at DESC
        LIMIT 1
      `,
      args: [currentPublishedAt],
    });

    const nextRes = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at > ? AND e.published_at <= ?
        ORDER BY e.published_at ASC
        LIMIT 1
      `,
      args: [currentPublishedAt, now],
    });

    const prev = prevRes.rows.length > 0 ? await formatEpisode(prevRes.rows[0]) : null;
    const next = nextRes.rows.length > 0 ? await formatEpisode(nextRes.rows[0]) : null;

    return { prev, next };
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
        SELECT g.*, m.url as portrait_url
        FROM guests g
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE ${whereClause}
        ORDER BY g.full_name ASC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    });

    const docs = await Promise.all(docsRes.rows.map(formatGuest));

    return {
      docs,
      totalDocs,
      totalPages,
      page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  } catch (err) {
    console.error('getPublishedGuests error:', err);
    return { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false };
  }
}

export async function getGuestBySlug(slug: string) {
  try {
    const res = await db.execute({
      sql: `
        SELECT g.*, m.url as portrait_url
        FROM guests g
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE g.slug = ?
        LIMIT 1
      `,
      args: [slug],
    });

    if (res.rows.length === 0) return null;
    return await formatGuest(res.rows[0]);
  } catch (err) {
    console.error('getGuestBySlug error:', err);
    return null;
  }
}

export async function getEpisodesForGuest(guestId: string | number) {
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

    return await Promise.all(res.rows.map(formatEpisode));
  } catch (err) {
    console.error('getEpisodesForGuest error:', err);
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

    // 1. Direct SQL search on guests
    const guestsRes = await db.execute({
      sql: `
        SELECT g.*, m.url as portrait_url
        FROM guests g
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE g.status = 'published'
          AND (g.full_name LIKE ? OR g.role LIKE ? OR g.company LIKE ? OR g.short_overview LIKE ?)
        LIMIT 25
      `,
      args: [searchTerm, searchTerm, searchTerm, searchTerm],
    });

    // 2. Direct SQL search on episodes
    const episodesRes = await db.execute({
      sql: `
        SELECT e.*, m.url as thumbnail_url
        FROM episodes e
        LEFT JOIN media m ON e.thumbnail_id = m.id
        WHERE e.status = 'published' AND e.published_at <= ?
          AND (e.title LIKE ? OR e.short_summary LIKE ? OR e.description LIKE ?)
        LIMIT 25
      `,
      args: [now, searchTerm, searchTerm, searchTerm],
    });

    const formattedGuests: SearchGuestItem[] = await Promise.all(
      guestsRes.rows.map(async (g) => {
        const topicsRes = await db.execute({
          sql: `SELECT t.name, t.slug FROM guests_rels r JOIN topics t ON r.topics_id = t.id WHERE r.path = 'topics' AND r.parent_id = ?`,
          args: [g.id],
        });
        return {
          id: String(g.id),
          fullName: String(g.full_name),
          alternateNames: [],
          slug: String(g.slug),
          role: String(g.role || ''),
          company: g.company ? String(g.company) : null,
          shortOverview: String(g.short_overview || ''),
          portraitUrl: g.portrait_url ? String(g.portrait_url) : null,
          industries: topicsRes.rows.map((t) => ({ name: String(t.name), slug: String(t.slug) })),
        };
      })
    );

    const formattedEpisodes: SearchEpisodeItem[] = await Promise.all(
      episodesRes.rows.map(async (e) => {
        const [guestsRel, tagsRel, topicsRel] = await Promise.all([
          db.execute({
            sql: `SELECT g.full_name FROM episodes_rels r JOIN guests g ON r.guests_id = g.id WHERE r.path = 'guests' AND r.parent_id = ?`,
            args: [e.id],
          }),
          db.execute({
            sql: `SELECT tag FROM episodes_tags WHERE _parent_id = ?`,
            args: [e.id],
          }),
          db.execute({
            sql: `SELECT t.name, t.slug FROM episodes_rels r JOIN topics t ON r.topics_id = t.id WHERE r.path = 'topics' AND r.parent_id = ?`,
            args: [e.id],
          }),
        ]);

        return {
          id: String(e.id),
          title: String(e.title),
          slug: String(e.slug),
          shortSummary: String(e.short_summary || ''),
          thumbnailUrl: e.thumbnail_url ? String(e.thumbnail_url) : null,
          youtubeVideoId: e.youtube_video_id ? String(e.youtube_video_id) : null,
          publishedAt: String(e.published_at),
          guestNames: guestsRel.rows.map((g) => String(g.full_name)),
          tags: tagsRel.rows.map((t) => String(t.tag)),
          topics: topicsRel.rows.map((t) => ({ name: String(t.name), slug: String(t.slug) })),
        };
      })
    );

    return searchCollections(cleanQ, formattedGuests, formattedEpisodes);
  } catch (err) {
    console.error('executeGlobalSearch error:', err);
    return { query: cleanQ, guests: [], episodes: [], totalCount: 0 };
  }
}
