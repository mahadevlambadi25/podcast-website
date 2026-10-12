import { db } from '@/lib/db/client';

export interface RedirectItem {
  id: number;
  from: string;
  to: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export async function listRedirects(): Promise<RedirectItem[]> {
  const res = await db.execute(`
    SELECT * FROM redirects ORDER BY created_at DESC
  `);

  return res.rows.map((r) => ({
    id: Number(r.id),
    from: String(r.from),
    to: String(r.to),
    type: String(r.type || '301'),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));
}

export async function getRedirectForPath(fromPath: string): Promise<string | null> {
  try {
    const res = await db.execute({
      sql: 'SELECT "to" FROM redirects WHERE "from" = ? LIMIT 1',
      args: [fromPath],
    });
    if (res.rows.length === 0) return null;
    return String(res.rows[0].to);
  } catch {
    return null;
  }
}

export async function createRedirect(data: {
  from: string;
  to: string;
  type?: string;
}): Promise<{ id?: number; error?: string }> {
  let fromPath = data.from.trim();
  let toPath = data.to.trim();

  if (!fromPath.startsWith('/')) fromPath = `/${fromPath}`;
  if (!toPath.startsWith('/') && !toPath.startsWith('http')) toPath = `/${toPath}`;

  if (fromPath === toPath) {
    return { error: 'Destination URL cannot be identical to the source URL.' };
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM redirects WHERE "from" = ? LIMIT 1',
    args: [fromPath],
  });

  const now = new Date().toISOString();

  if (existing.rows.length > 0) {
    // Update existing
    const id = Number(existing.rows[0].id);
    await db.execute({
      sql: 'UPDATE redirects SET "to" = ?, "type" = ?, updated_at = ? WHERE id = ?',
      args: [toPath, data.type || '301', now, id],
    });
    return { id };
  }

  const res = await db.execute({
    sql: 'INSERT INTO redirects ("from", "to", "type", created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    args: [fromPath, toPath, data.type || '301', now, now],
  });

  return { id: Number(res.lastInsertRowid) };
}

export async function deleteRedirect(id: number): Promise<void> {
  await db.execute({ sql: 'DELETE FROM redirects WHERE id = ?', args: [id] });
}
