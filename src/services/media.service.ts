import { db } from '@/lib/db/client';
import fs from 'fs';
import path from 'path';

export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mime_type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

export async function listMedia(options: {
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  docs: MediaItem[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 20);
  const offset = (page - 1) * limit;

  const conditions = ['1=1'];
  const args: any[] = [];

  if (options.search) {
    conditions.push('(m.filename LIKE ? OR m.alt LIKE ? OR m.caption LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q);
  }

  const where = conditions.join(' AND ');

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM media m WHERE ${where}`,
    args,
  });
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const queryArgs = [...args, limit, offset];
  const listRes = await db.execute({
    sql: `
      SELECT 
        m.*,
        (
          (SELECT COUNT(*) FROM episodes WHERE thumbnail_id = m.id) +
          (SELECT COUNT(*) FROM guests WHERE portrait_id = m.id) +
          (SELECT COUNT(*) FROM site_settings WHERE logo_id = m.id OR host_portrait_id = m.id OR default_og_image_id = m.id)
        ) as usage_count
      FROM media m
      WHERE ${where}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const docs: MediaItem[] = listRes.rows.map((r) => ({
    id: Number(r.id),
    filename: String(r.filename || 'media-asset'),
    url: String(r.url || `/media/${r.filename}`),
    mime_type: r.mime_type ? String(r.mime_type) : undefined,
    filesize: r.filesize ? Number(r.filesize) : undefined,
    width: r.width ? Number(r.width) : undefined,
    height: r.height ? Number(r.height) : undefined,
    alt: r.alt ? String(r.alt) : undefined,
    caption: r.caption ? String(r.caption) : undefined,
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
    usage_count: Number(r.usage_count || 0),
  }));

  return { docs, totalDocs, totalPages, page, limit };
}

export async function createMedia(data: {
  filename: string;
  url: string;
  mime_type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
}): Promise<number> {
  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `
      INSERT INTO media (
        filename, url, mime_type, filesize, width, height, alt, caption, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.filename,
      data.url,
      data.mime_type || null,
      data.filesize || null,
      data.width || null,
      data.height || null,
      data.alt || null,
      data.caption || null,
      now,
      now,
    ],
  });

  return Number(res.lastInsertRowid);
}

export async function getMediaById(id: number): Promise<MediaItem | null> {
  const res = await db.execute({
    sql: `
      SELECT 
        m.*,
        (
          (SELECT COUNT(*) FROM episodes WHERE thumbnail_id = m.id) +
          (SELECT COUNT(*) FROM guests WHERE portrait_id = m.id) +
          (SELECT COUNT(*) FROM site_settings WHERE logo_id = m.id OR host_portrait_id = m.id OR default_og_image_id = m.id)
        ) as usage_count
      FROM media m
      WHERE m.id = ?
      LIMIT 1
    `,
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: Number(r.id),
    filename: String(r.filename || 'media-asset'),
    url: String(r.url || `/media/${r.filename}`),
    mime_type: r.mime_type ? String(r.mime_type) : undefined,
    filesize: r.filesize ? Number(r.filesize) : undefined,
    width: r.width ? Number(r.width) : undefined,
    height: r.height ? Number(r.height) : undefined,
    alt: r.alt ? String(r.alt) : undefined,
    caption: r.caption ? String(r.caption) : undefined,
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
    usage_count: Number(r.usage_count || 0),
  };
}

export async function updateMedia(
  id: number,
  data: { alt?: string; caption?: string }
): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE media SET alt = COALESCE(?, alt), caption = COALESCE(?, caption), updated_at = ? WHERE id = ?`,
    args: [data.alt ?? null, data.caption ?? null, now, id],
  });
}

export async function deleteMedia(id: number): Promise<{ success: boolean; error?: string }> {
  // Check usage
  const epUsage = await db.execute({
    sql: 'SELECT id, title FROM episodes WHERE thumbnail_id = ? LIMIT 3',
    args: [id],
  });
  const guestUsage = await db.execute({
    sql: 'SELECT id, full_name FROM guests WHERE portrait_id = ? LIMIT 3',
    args: [id],
  });

  if (epUsage.rows.length > 0 || guestUsage.rows.length > 0) {
    const epTitles = epUsage.rows.map((r) => `Episode "${r.title}"`).join(', ');
    const guestNames = guestUsage.rows.map((r) => `Guest "${r.full_name}"`).join(', ');
    const refs = [epTitles, guestNames].filter(Boolean).join(' and ');
    return {
      success: false,
      error: `Cannot delete asset: file is currently in active use by ${refs}. Please replace the thumbnail/portrait first.`,
    };
  }

  // Get filename to optionally remove local file
  const mediaRes = await db.execute({
    sql: 'SELECT filename FROM media WHERE id = ? LIMIT 1',
    args: [id],
  });
  if (mediaRes.rows.length > 0 && mediaRes.rows[0].filename) {
    const filePath = path.resolve(process.cwd(), 'media', String(mediaRes.rows[0].filename));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Could not delete physical media file:', err);
      }
    }
  }

  await db.execute({ sql: 'DELETE FROM media WHERE id = ?', args: [id] });
  return { success: true };
}
