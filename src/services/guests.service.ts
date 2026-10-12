import { db } from '@/lib/db/client';

export interface GuestDetail {
  id: number;
  full_name: string;
  slug: string;
  role?: string;
  company?: string;
  short_overview?: string;
  biography?: string;
  portrait_id?: number;
  portrait_url?: string;
  portrait_alt?: string;
  portrait_credit?: string;
  links_linkedin?: string;
  links_website?: string;
  links_other?: string;
  featured?: boolean;
  status: 'draft' | 'published' | 'archived';
  seo_title?: string;
  seo_description?: string;
  canonical_override?: string;
  updated_at: string;
  created_at: string;
  topics: Array<{ id: number; name: string; slug: string }>;
  key_insights: Array<{ quote: string; context: string }>;
  episode_count: number;
}

export async function listGuests(options: {
  search?: string;
  status?: string;
  featuredOnly?: boolean;
  page?: number;
  limit?: number;
} = {}): Promise<{
  docs: GuestDetail[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 12);
  const offset = (page - 1) * limit;

  const conditions: string[] = ['1=1'];
  const args: any[] = [];

  if (options.status && options.status !== 'all') {
    conditions.push('g.status = ?');
    args.push(options.status);
  }

  if (options.featuredOnly) {
    conditions.push('g.featured = 1');
  }

  if (options.search) {
    conditions.push('(g.full_name LIKE ? OR g.company LIKE ? OR g.role LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q);
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM guests g WHERE ${whereClause}`,
    args,
  });
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const queryArgs = [...args, limit, offset];
  const listRes = await db.execute({
    sql: `
      SELECT 
        g.*,
        m.url as portrait_url,
        (SELECT COUNT(DISTINCT parent_id) FROM episodes_rels WHERE path = 'guests' AND guests_id = g.id) as episode_count
      FROM guests g
      LEFT JOIN media m ON g.portrait_id = m.id
      WHERE ${whereClause}
      ORDER BY g.full_name ASC
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const guestIds = listRes.rows.map((r) => Number(r.id));
  const topicsMap: Record<number, any[]> = {};

  if (guestIds.length > 0) {
    const idPlaceholders = guestIds.map(() => '?').join(',');
    const topicsRes = await db.execute({
      sql: `
        SELECT r.parent_id, t.id, t.name, t.slug
        FROM guests_rels r
        JOIN topics t ON r.topics_id = t.id
        WHERE r.path = 'topics' AND r.parent_id IN (${idPlaceholders})
        ORDER BY r."order" ASC
      `,
      args: guestIds,
    });

    for (const row of topicsRes.rows) {
      const parentId = Number(row.parent_id);
      if (!topicsMap[parentId]) topicsMap[parentId] = [];
      topicsMap[parentId].push({
        id: Number(row.id),
        name: String(row.name),
        slug: String(row.slug),
      });
    }
  }

  const docs: GuestDetail[] = listRes.rows.map((r) => {
    const id = Number(r.id);
    return {
      id,
      full_name: String(r.full_name),
      slug: String(r.slug),
      role: r.role ? String(r.role) : undefined,
      company: r.company ? String(r.company) : undefined,
      short_overview: r.short_overview ? String(r.short_overview) : undefined,
      biography: r.biography ? String(r.biography) : undefined,
      portrait_id: r.portrait_id ? Number(r.portrait_id) : undefined,
      portrait_url: r.portrait_url ? String(r.portrait_url) : undefined,
      portrait_alt: r.portrait_alt ? String(r.portrait_alt) : undefined,
      portrait_credit: r.portrait_credit ? String(r.portrait_credit) : undefined,
      links_linkedin: r.links_linkedin ? String(r.links_linkedin) : undefined,
      links_website: r.links_website ? String(r.links_website) : undefined,
      links_other: r.links_other ? String(r.links_other) : undefined,
      featured: Boolean(r.featured),
      status: (r.status as any) || 'draft',
      seo_title: r.seo_title ? String(r.seo_title) : undefined,
      seo_description: r.seo_description ? String(r.seo_description) : undefined,
      canonical_override: r.canonical_override ? String(r.canonical_override) : undefined,
      updated_at: String(r.updated_at || ''),
      created_at: String(r.created_at || ''),
      topics: topicsMap[id] || [],
      key_insights: [],
      episode_count: Number(r.episode_count || 0),
    };
  });

  return { docs, totalDocs, totalPages, page, limit };
}

export async function getGuestById(id: number): Promise<GuestDetail | null> {
  const res = await db.execute({
    sql: `
      SELECT 
        g.*,
        m.url as portrait_url,
        (SELECT COUNT(DISTINCT parent_id) FROM episodes_rels WHERE path = 'guests' AND guests_id = g.id) as episode_count
      FROM guests g
      LEFT JOIN media m ON g.portrait_id = m.id
      WHERE g.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  // Topics
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

  return {
    id: Number(r.id),
    full_name: String(r.full_name),
    slug: String(r.slug),
    role: r.role ? String(r.role) : undefined,
    company: r.company ? String(r.company) : undefined,
    short_overview: r.short_overview ? String(r.short_overview) : undefined,
    biography: r.biography ? String(r.biography) : undefined,
    portrait_id: r.portrait_id ? Number(r.portrait_id) : undefined,
    portrait_url: r.portrait_url ? String(r.portrait_url) : undefined,
    portrait_alt: r.portrait_alt ? String(r.portrait_alt) : undefined,
    portrait_credit: r.portrait_credit ? String(r.portrait_credit) : undefined,
    links_linkedin: r.links_linkedin ? String(r.links_linkedin) : undefined,
    links_website: r.links_website ? String(r.links_website) : undefined,
    links_other: r.links_other ? String(r.links_other) : undefined,
    featured: Boolean(r.featured),
    status: (r.status as any) || 'draft',
    seo_title: r.seo_title ? String(r.seo_title) : undefined,
    seo_description: r.seo_description ? String(r.seo_description) : undefined,
    canonical_override: r.canonical_override ? String(r.canonical_override) : undefined,
    updated_at: String(r.updated_at || ''),
    created_at: String(r.created_at || ''),
    topics: topicsRes.rows.map((t) => ({
      id: Number(t.id),
      name: String(t.name),
      slug: String(t.slug),
    })),
    key_insights: insightsRes.rows.map((i) => ({
      quote: String(i.quote || ''),
      context: String(i.context || ''),
    })),
    episode_count: Number(r.episode_count || 0),
  };
}

export async function createGuest(data: Partial<GuestDetail> & { topic_ids?: number[] }): Promise<number> {
  const now = new Date().toISOString();

  const insertRes = await db.execute({
    sql: `
      INSERT INTO guests (
        full_name, slug, role, company, short_overview, biography,
        portrait_id, portrait_alt, portrait_credit, links_linkedin,
        links_website, links_other, featured, status, seo_title,
        seo_description, canonical_override, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.full_name || 'Unnamed Guest',
      data.slug || `guest-${Date.now()}`,
      data.role || '',
      data.company || null,
      data.short_overview || '',
      data.biography || '',
      data.portrait_id || null,
      data.portrait_alt || null,
      data.portrait_credit || null,
      data.links_linkedin || null,
      data.links_website || null,
      data.links_other || null,
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

  if (data.topic_ids && data.topic_ids.length > 0) {
    for (let i = 0; i < data.topic_ids.length; i++) {
      await db.execute({
        sql: `INSERT INTO guests_rels ("order", parent_id, path, topics_id) VALUES (?, ?, 'topics', ?)`,
        args: [i + 1, newId, data.topic_ids[i]],
      });
    }
  }

  return newId;
}

export async function updateGuest(
  id: number,
  data: Partial<GuestDetail> & { topic_ids?: number[] }
): Promise<void> {
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE guests SET
        full_name = COALESCE(?, full_name),
        slug = COALESCE(?, slug),
        role = COALESCE(?, role),
        company = COALESCE(?, company),
        short_overview = COALESCE(?, short_overview),
        biography = COALESCE(?, biography),
        portrait_id = COALESCE(?, portrait_id),
        portrait_alt = COALESCE(?, portrait_alt),
        portrait_credit = COALESCE(?, portrait_credit),
        links_linkedin = COALESCE(?, links_linkedin),
        links_website = COALESCE(?, links_website),
        links_other = COALESCE(?, links_other),
        featured = COALESCE(?, featured),
        status = COALESCE(?, status),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        canonical_override = COALESCE(?, canonical_override),
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      data.full_name ?? null,
      data.slug ?? null,
      data.role ?? null,
      data.company ?? null,
      data.short_overview ?? null,
      data.biography ?? null,
      data.portrait_id ?? null,
      data.portrait_alt ?? null,
      data.portrait_credit ?? null,
      data.links_linkedin ?? null,
      data.links_website ?? null,
      data.links_other ?? null,
      data.featured ? 1 : 0,
      data.status ?? null,
      data.seo_title ?? null,
      data.seo_description ?? null,
      data.canonical_override ?? null,
      now,
      id,
    ],
  });

  if (data.topic_ids !== undefined) {
    await db.execute({
      sql: `DELETE FROM guests_rels WHERE parent_id = ? AND path = 'topics'`,
      args: [id],
    });
    for (let i = 0; i < data.topic_ids.length; i++) {
      await db.execute({
        sql: `INSERT INTO guests_rels ("order", parent_id, path, topics_id) VALUES (?, ?, 'topics', ?)`,
        args: [i + 1, id, data.topic_ids[i]],
      });
    }
  }
}

export async function deleteGuest(id: number): Promise<{ success: boolean; error?: string }> {
  // Safe deletion check: prevent deleting if referenced in episodes
  const relCheck = await db.execute({
    sql: `
      SELECT e.id, e.title 
      FROM episodes_rels r 
      JOIN episodes e ON r.parent_id = e.id 
      WHERE r.path = 'guests' AND r.guests_id = ?
    `,
    args: [id],
  });

  if (relCheck.rows.length > 0) {
    const titles = relCheck.rows.map((r) => `"${r.title}"`).join(', ');
    return {
      success: false,
      error: `Cannot delete this guest because they are associated with ${relCheck.rows.length} episode(s): ${titles}. Please reassign or remove the guest from those episodes first.`,
    };
  }

  // Delete relationships and child tables
  await db.execute({ sql: `DELETE FROM guests_rels WHERE parent_id = ?`, args: [id] });
  await db.execute({ sql: `DELETE FROM guests_key_insights WHERE _parent_id = ?`, args: [id] });
  await db.execute({ sql: `DELETE FROM guests WHERE id = ?`, args: [id] });

  return { success: true };
}
