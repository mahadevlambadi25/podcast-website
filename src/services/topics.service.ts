import { db } from '@/lib/db/client';

export interface TopicDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  episode_count: number;
  updated_at: string;
  created_at: string;
}

export async function listTopics(options: { search?: string } = {}): Promise<TopicDetail[]> {
  const conditions = ['1=1'];
  const args: any[] = [];

  if (options.search) {
    conditions.push('(t.name LIKE ? OR t.slug LIKE ? OR t.description LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q);
  }

  const res = await db.execute({
    sql: `
      SELECT 
        t.*,
        (SELECT COUNT(DISTINCT parent_id) FROM episodes_rels WHERE path = 'topics' AND topics_id = t.id) as episode_count
      FROM topics t
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.name ASC
    `,
    args,
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: r.description ? String(r.description) : undefined,
    episode_count: Number(r.episode_count || 0),
    updated_at: String(r.updated_at || ''),
    created_at: String(r.created_at || ''),
  }));
}

export async function getTopicById(id: number): Promise<TopicDetail | null> {
  const res = await db.execute({
    sql: `
      SELECT 
        t.*,
        (SELECT COUNT(DISTINCT parent_id) FROM episodes_rels WHERE path = 'topics' AND topics_id = t.id) as episode_count
      FROM topics t
      WHERE t.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  return {
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: r.description ? String(r.description) : undefined,
    episode_count: Number(r.episode_count || 0),
    updated_at: String(r.updated_at || ''),
    created_at: String(r.created_at || ''),
  };
}

export async function createTopic(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<{ id?: number; error?: string }> {
  // Validate duplicate slug
  const existing = await db.execute({
    sql: 'SELECT id FROM topics WHERE slug = ? LIMIT 1',
    args: [data.slug],
  });

  if (existing.rows.length > 0) {
    return { error: `A topic with the slug "${data.slug}" already exists.` };
  }

  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `INSERT INTO topics (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [data.name, data.slug, data.description || null, now, now],
  });

  return { id: Number(res.lastInsertRowid) };
}

export async function updateTopic(
  id: number,
  data: { name?: string; slug?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  if (data.slug) {
    const existing = await db.execute({
      sql: 'SELECT id FROM topics WHERE slug = ? AND id != ? LIMIT 1',
      args: [data.slug, id],
    });
    if (existing.rows.length > 0) {
      return { success: false, error: `Slug "${data.slug}" is already in use by another topic.` };
    }
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: `
      UPDATE topics SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [data.name ?? null, data.slug ?? null, data.description ?? null, now, id],
  });

  return { success: true };
}

export async function deleteTopic(id: number): Promise<{ success: boolean; error?: string }> {
  // Check episode references
  const epCheck = await db.execute({
    sql: `
      SELECT COUNT(*) as cnt 
      FROM episodes_rels 
      WHERE path = 'topics' AND topics_id = ?
    `,
    args: [id],
  });

  const count = Number(epCheck.rows[0]?.cnt || 0);
  if (count > 0) {
    return {
      success: false,
      error: `Cannot delete topic because it is currently assigned to ${count} episode(s). Please remove it from those episodes before deleting.`,
    };
  }

  await db.execute({ sql: 'DELETE FROM topics WHERE id = ?', args: [id] });
  return { success: true };
}
