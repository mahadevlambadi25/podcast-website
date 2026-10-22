import { db } from '@/lib/db/client';
import { normalizeIsoTimestamp, toUtcIsoString } from '@/lib/date';

export interface EpisodeDetail {
  id: number;
  title: string;
  slug: string;
  youtube_url?: string;
  youtube_video_id?: string;
  fallback_watch_url?: string;
  short_summary?: string;
  description?: string;
  thumbnail_id?: number;
  thumbnail_url?: string;
  episode_number?: number;
  season?: number;
  published_at?: string;
  transcript?: string;
  featured?: boolean;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  seo_title?: string;
  seo_description?: string;
  canonical_override?: string;
  updated_at: string;
  created_at: string;
  guests: Array<{ id: number; full_name: string; slug: string; role?: string; company?: string; portrait_url?: string }>;
  topics: Array<{ id: number; name: string; slug: string }>;
  key_takeaways: string[];
  quotes: Array<{ quote: string; speaker: string }>;
  tags: string[];
}

export async function listEpisodes(options: {
  status?: string;
  guestId?: number;
  topicId?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} = {}): Promise<{
  docs: EpisodeDetail[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 10);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['1=1'];
  const args: any[] = [];

  if (options.status && options.status !== 'all') {
    conditions.push('e.status = ?');
    args.push(options.status);
  }

  if (options.search) {
    conditions.push('(e.title LIKE ? OR e.slug LIKE ? OR e.short_summary LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q);
  }

  if (options.guestId) {
    conditions.push("e.id IN (SELECT parent_id FROM episodes_rels WHERE path = 'guests' AND guests_id = ?)");
    args.push(options.guestId);
  }

  if (options.topicId) {
    conditions.push("e.id IN (SELECT parent_id FROM episodes_rels WHERE path = 'topics' AND topics_id = ?)");
    args.push(options.topicId);
  }

  const whereClause = conditions.join(' AND ');

  // Count total
  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM episodes e WHERE ${whereClause}`,
    args,
  });
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  // Sorting
  const sortCol =
    options.sort === 'title'
      ? 'e.title'
      : options.sort === 'published_at'
      ? 'e.published_at'
      : 'e.created_at';
  const sortDir = options.direction === 'asc' ? 'ASC' : 'DESC';

  const queryArgs = [...args, limit, offset];
  const listRes = await db.execute({
    sql: `
      SELECT 
        e.*,
        m.url as thumbnail_url
      FROM episodes e
      LEFT JOIN media m ON e.thumbnail_id = m.id
      WHERE ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const episodeIds = listRes.rows.map((r) => Number(r.id));
  const guestsMap: Record<number, any[]> = {};
  const topicsMap: Record<number, any[]> = {};

  if (episodeIds.length > 0) {
    const idPlaceholders = episodeIds.map(() => '?').join(',');

    // Fetch related guests
    const relGuestsRes = await db.execute({
      sql: `
        SELECT r.parent_id, g.id, g.full_name, g.slug, g.role, g.company, COALESCE(g.portrait_url, m.url) as portrait_url
        FROM episodes_rels r
        JOIN guests g ON r.guests_id = g.id
        LEFT JOIN media m ON g.portrait_id = m.id
        WHERE r.path = 'guests' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: episodeIds,
    });

    for (const row of relGuestsRes.rows) {
      const parentId = Number(row.parent_id);
      if (!guestsMap[parentId]) guestsMap[parentId] = [];
      guestsMap[parentId].push({
        id: Number(row.id),
        full_name: String(row.full_name),
        slug: String(row.slug),
        role: row.role ? String(row.role) : undefined,
        company: row.company ? String(row.company) : undefined,
        portrait_url: row.portrait_url ? String(row.portrait_url) : undefined,
      });
    }

    // Fetch related topics
    const relTopicsRes = await db.execute({
      sql: `
        SELECT r.parent_id, t.id, t.name, t.slug
        FROM episodes_rels r
        JOIN topics t ON r.topics_id = t.id
        WHERE r.path = 'topics' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: episodeIds,
    });

    for (const row of relTopicsRes.rows) {
      const parentId = Number(row.parent_id);
      if (!topicsMap[parentId]) topicsMap[parentId] = [];
      topicsMap[parentId].push({
        id: Number(row.id),
        name: String(row.name),
        slug: String(row.slug),
      });
    }
  }

  const docs: EpisodeDetail[] = listRes.rows.map((r) => {
    const id = Number(r.id);
    return {
      id,
      title: String(r.title),
      slug: String(r.slug),
      youtube_url: r.youtube_url ? String(r.youtube_url) : undefined,
      youtube_video_id: r.youtube_video_id ? String(r.youtube_video_id) : undefined,
      fallback_watch_url: r.fallback_watch_url ? String(r.fallback_watch_url) : undefined,
      short_summary: r.short_summary ? String(r.short_summary) : undefined,
      description: r.description ? String(r.description) : undefined,
      thumbnail_id: r.thumbnail_id ? Number(r.thumbnail_id) : undefined,
      thumbnail_url: r.thumbnail_url ? String(r.thumbnail_url) : undefined,
      episode_number: r.episode_number ? Number(r.episode_number) : undefined,
      season: r.season ? Number(r.season) : undefined,
      published_at: normalizeIsoTimestamp(r.published_at) || undefined,
      transcript: r.transcript ? String(r.transcript) : undefined,
      featured: Boolean(r.featured),
      status: (r.status as any) || 'draft',
      seo_title: r.seo_title ? String(r.seo_title) : undefined,
      seo_description: r.seo_description ? String(r.seo_description) : undefined,
      canonical_override: r.canonical_override ? String(r.canonical_override) : undefined,
      updated_at: normalizeIsoTimestamp(r.updated_at) || '',
      created_at: normalizeIsoTimestamp(r.created_at) || '',
      guests: guestsMap[id] || [],
      topics: topicsMap[id] || [],
      key_takeaways: [],
      quotes: [],
      tags: [],
    };
  });

  return { docs, totalDocs, totalPages, page, limit };
}

export async function getEpisodeById(id: number): Promise<EpisodeDetail | null> {
  const epRes = await db.execute({
    sql: `
      SELECT e.*, m.url as thumbnail_url
      FROM episodes e
      LEFT JOIN media m ON e.thumbnail_id = m.id
      WHERE e.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  if (epRes.rows.length === 0) return null;
  const r = epRes.rows[0];

  // Related guests
  const guestsRes = await db.execute({
    sql: `
      SELECT g.id, g.full_name, g.slug, g.role, g.company, COALESCE(g.portrait_url, m.url) as portrait_url
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

  return {
    id: Number(r.id),
    title: String(r.title),
    slug: String(r.slug),
    youtube_url: r.youtube_url ? String(r.youtube_url) : undefined,
    youtube_video_id: r.youtube_video_id ? String(r.youtube_video_id) : undefined,
    fallback_watch_url: r.fallback_watch_url ? String(r.fallback_watch_url) : undefined,
    short_summary: r.short_summary ? String(r.short_summary) : undefined,
    description: r.description ? String(r.description) : undefined,
    thumbnail_id: r.thumbnail_id ? Number(r.thumbnail_id) : undefined,
    thumbnail_url: r.thumbnail_url ? String(r.thumbnail_url) : undefined,
    episode_number: r.episode_number ? Number(r.episode_number) : undefined,
    season: r.season ? Number(r.season) : undefined,
    published_at: normalizeIsoTimestamp(r.published_at) || undefined,
    transcript: r.transcript ? String(r.transcript) : undefined,
    featured: Boolean(r.featured),
    status: (r.status as any) || 'draft',
    seo_title: r.seo_title ? String(r.seo_title) : undefined,
    seo_description: r.seo_description ? String(r.seo_description) : undefined,
    canonical_override: r.canonical_override ? String(r.canonical_override) : undefined,
    updated_at: normalizeIsoTimestamp(r.updated_at) || '',
    created_at: normalizeIsoTimestamp(r.created_at) || '',
    guests: guestsRes.rows.map((g) => ({
      id: Number(g.id),
      full_name: String(g.full_name),
      slug: String(g.slug),
      role: g.role ? String(g.role) : undefined,
      company: g.company ? String(g.company) : undefined,
      portrait_url: g.portrait_url ? String(g.portrait_url) : undefined,
    })),
    topics: topicsRes.rows.map((t) => ({
      id: Number(t.id),
      name: String(t.name),
      slug: String(t.slug),
    })),
    key_takeaways: takeawaysRes.rows.map((t) => String(t.takeaway || '')).filter(Boolean),
    quotes: quotesRes.rows.map((q) => ({
      quote: String(q.quote || ''),
      speaker: String(q.speaker || ''),
    })),
    tags: tagsRes.rows.map((t) => String(t.tag || '')).filter(Boolean),
  };
}

export async function createEpisode(data: Partial<EpisodeDetail> & {
  guest_ids?: number[];
  topic_ids?: number[];
}): Promise<number> {
  const now = toUtcIsoString(new Date());
  const effectivePublishedAt = data.published_at
    ? (normalizeIsoTimestamp(data.published_at) || now)
    : now;

  return await db.transaction(async (tx) => {
    const insertRes = await tx.execute({
      sql: `
        INSERT INTO episodes (
          title, slug, youtube_url, youtube_video_id, fallback_watch_url,
          short_summary, description, thumbnail_id, episode_number, season,
          published_at, transcript, featured, status, seo_title, seo_description,
          canonical_override, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        data.title || 'Untitled Episode',
        data.slug || `episode-${Date.now()}`,
        data.youtube_url || null,
        data.youtube_video_id || null,
        data.fallback_watch_url || null,
        data.short_summary || '',
        data.description || data.short_summary || '',
        data.thumbnail_id || null,
        data.episode_number || null,
        data.season || null,
        effectivePublishedAt,
        data.transcript || null,
        data.featured ? 1 : 0,
        data.status || 'draft',
        data.seo_title || null,
        data.seo_description || null,
        data.canonical_override || null,
        now,
        now,
      ],
    });

    const newId = Number(insertRes.lastInsertRowid);

    // Sync relationships
    if (data.guest_ids && data.guest_ids.length > 0) {
      for (let i = 0; i < data.guest_ids.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_rels ("order", parent_id, path, guests_id) VALUES (?, ?, 'guests', ?)`,
          args: [i + 1, newId, data.guest_ids[i]],
        });
      }
    }

    if (data.topic_ids && data.topic_ids.length > 0) {
      for (let i = 0; i < data.topic_ids.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_rels ("order", parent_id, path, topics_id) VALUES (?, ?, 'topics', ?)`,
          args: [i + 1, newId, data.topic_ids[i]],
        });
      }
    }

    // Key takeaways
    if (data.key_takeaways && data.key_takeaways.length > 0) {
      for (let i = 0; i < data.key_takeaways.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_key_takeaways (_order, _parent_id, id, takeaway) VALUES (?, ?, ?, ?)`,
          args: [i + 1, newId, `kt-${Date.now()}-${i}`, data.key_takeaways[i]],
        });
      }
    }

    return newId;
  });
}

export async function updateEpisode(
  id: number,
  data: Partial<EpisodeDetail> & {
    guest_ids?: number[];
    topic_ids?: number[];
  }
): Promise<void> {
  const now = toUtcIsoString(new Date());
  const normalizedPublishedAt =
    data.published_at !== undefined
      ? (normalizeIsoTimestamp(data.published_at) || null)
      : null;

  await db.transaction(async (tx) => {
    await tx.execute({
      sql: `
        UPDATE episodes SET
          title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          youtube_url = COALESCE(?, youtube_url),
          youtube_video_id = COALESCE(?, youtube_video_id),
          fallback_watch_url = COALESCE(?, fallback_watch_url),
          short_summary = COALESCE(?, short_summary),
          description = COALESCE(?, description),
          thumbnail_id = COALESCE(?, thumbnail_id),
          episode_number = COALESCE(?, episode_number),
          season = COALESCE(?, season),
          published_at = COALESCE(?, published_at),
          transcript = COALESCE(?, transcript),
          featured = COALESCE(?, featured),
          status = COALESCE(?, status),
          seo_title = COALESCE(?, seo_title),
          seo_description = COALESCE(?, seo_description),
          canonical_override = COALESCE(?, canonical_override),
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        data.title ?? null,
        data.slug ?? null,
        data.youtube_url ?? null,
        data.youtube_video_id ?? null,
        data.fallback_watch_url ?? null,
        data.short_summary ?? null,
        data.description ?? null,
        data.thumbnail_id ?? null,
        data.episode_number ?? null,
        data.season ?? null,
        normalizedPublishedAt,
        data.transcript ?? null,
        data.featured !== undefined ? (data.featured ? 1 : 0) : null,
        data.status ?? null,
        data.seo_title ?? null,
        data.seo_description ?? null,
        data.canonical_override ?? null,
        now,
        id,
      ],
    });

    // Update guests rels if provided
    if (data.guest_ids !== undefined) {
      await tx.execute({
        sql: `DELETE FROM episodes_rels WHERE parent_id = ? AND path = 'guests'`,
        args: [id],
      });
      for (let i = 0; i < data.guest_ids.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_rels ("order", parent_id, path, guests_id) VALUES (?, ?, 'guests', ?)`,
          args: [i + 1, id, data.guest_ids[i]],
        });
      }
    }

    // Update topics rels if provided
    if (data.topic_ids !== undefined) {
      await tx.execute({
        sql: `DELETE FROM episodes_rels WHERE parent_id = ? AND path = 'topics'`,
        args: [id],
      });
      for (let i = 0; i < data.topic_ids.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_rels ("order", parent_id, path, topics_id) VALUES (?, ?, 'topics', ?)`,
          args: [i + 1, id, data.topic_ids[i]],
        });
      }
    }

    // Update key takeaways if provided
    if (data.key_takeaways !== undefined) {
      await tx.execute({
        sql: `DELETE FROM episodes_key_takeaways WHERE _parent_id = ?`,
        args: [id],
      });
      for (let i = 0; i < data.key_takeaways.length; i++) {
        await tx.execute({
          sql: `INSERT INTO episodes_key_takeaways (_order, _parent_id, id, takeaway) VALUES (?, ?, ?, ?)`,
          args: [i + 1, id, `kt-${Date.now()}-${i}`, data.key_takeaways[i]],
        });
      }
    }
  });
}

export async function deleteEpisode(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete relations and child items first
    await tx.execute({ sql: 'DELETE FROM episodes_rels WHERE parent_id = ?', args: [id] });
    await tx.execute({ sql: 'DELETE FROM episodes_key_takeaways WHERE _parent_id = ?', args: [id] });
    await tx.execute({ sql: 'DELETE FROM episodes_quotes WHERE _parent_id = ?', args: [id] });
    await tx.execute({ sql: 'DELETE FROM episodes_tags WHERE _parent_id = ?', args: [id] });
    // Delete main episode
    await tx.execute({ sql: 'DELETE FROM episodes WHERE id = ?', args: [id] });
  });
}

export async function publishScheduledEpisodes(): Promise<{ id: number; slug: string }[]> {
  const now = toUtcIsoString(new Date());
  return await db.transaction(async (tx) => {
    const res = await tx.execute({
      sql: `SELECT id, slug FROM episodes WHERE status = 'scheduled' AND published_at <= ? LIMIT 100`,
      args: [now],
    });
    if (res.rows.length === 0) return [];

    await tx.execute({
      sql: `UPDATE episodes SET status = 'published', updated_at = ? WHERE status = 'scheduled' AND published_at <= ?`,
      args: [now, now],
    });

    return res.rows.map((row) => ({ id: Number(row.id), slug: String(row.slug) }));
  });
}

