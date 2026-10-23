import { db } from '@/lib/db/client';
import { deleteMediaFile } from '@/lib/storage';
import { normalizeIsoTimestamp, toUtcIsoString } from '@/lib/date';

export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  thumbnail_url?: string;
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
        m.id, m.filename, m.url, m.thumbnail_url, m.mime_type, m.filesize, m.width, m.height, m.alt, m.caption, m.created_at, m.updated_at,
        (
          COALESCE((SELECT COUNT(*) FROM episodes WHERE thumbnail_id = m.id), 0) +
          COALESCE((SELECT COUNT(*) FROM guests WHERE portrait_id = m.id), 0) +
          COALESCE((SELECT COUNT(*) FROM site_settings WHERE logo_id = m.id OR host_portrait_id = m.id OR default_og_image_id = m.id), 0)
        ) as usage_count
      FROM media m
      WHERE ${where}
      ORDER BY m.created_at DESC NULLS LAST
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const docs: MediaItem[] = listRes.rows.map((r) => ({
    id: Number(r.id),
    filename: String(r.filename || 'media-asset'),
    url: String(r.url || `/media/${r.filename}`),
    thumbnail_url: r.thumbnail_url ? String(r.thumbnail_url) : (r.url ? String(r.url) : `/media/${r.filename}`),
    mime_type: r.mime_type ? String(r.mime_type) : undefined,
    filesize: r.filesize ? Number(r.filesize) : undefined,
    width: r.width ? Number(r.width) : undefined,
    height: r.height ? Number(r.height) : undefined,
    alt: r.alt ? String(r.alt) : undefined,
    caption: r.caption ? String(r.caption) : undefined,
    created_at: normalizeIsoTimestamp(r.created_at) || '',
    updated_at: normalizeIsoTimestamp(r.updated_at) || '',
    usage_count: Number(r.usage_count || 0),
  }));

  return { docs, totalDocs, totalPages, page, limit };
}

export async function createMedia(data: {
  filename: string;
  url: string;
  thumbnail_url?: string;
  mime_type?: string;
  filesize?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  data_base64?: string;
}): Promise<number> {
  const now = toUtcIsoString(new Date());
  const effectiveThumb = data.thumbnail_url || data.url;

  const res = await db.execute({
    sql: `
      INSERT INTO media (
        filename, url, thumbnail_url, mime_type, filesize, width, height, alt, caption, data_base64, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.filename,
      data.url,
      effectiveThumb,
      data.mime_type || null,
      data.filesize || null,
      data.width || null,
      data.height || null,
      data.alt || null,
      data.caption || null,
      data.data_base64 || null,
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
        m.id, m.filename, m.url, m.thumbnail_url, m.mime_type, m.filesize, m.width, m.height, m.alt, m.caption, m.created_at, m.updated_at,
        (
          COALESCE((SELECT COUNT(*) FROM episodes WHERE thumbnail_id = m.id), 0) +
          COALESCE((SELECT COUNT(*) FROM guests WHERE portrait_id = m.id), 0) +
          COALESCE((SELECT COUNT(*) FROM site_settings WHERE logo_id = m.id OR host_portrait_id = m.id OR default_og_image_id = m.id), 0)
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
    thumbnail_url: r.thumbnail_url ? String(r.thumbnail_url) : (r.url ? String(r.url) : `/media/${r.filename}`),
    mime_type: r.mime_type ? String(r.mime_type) : undefined,
    filesize: r.filesize ? Number(r.filesize) : undefined,
    width: r.width ? Number(r.width) : undefined,
    height: r.height ? Number(r.height) : undefined,
    alt: r.alt ? String(r.alt) : undefined,
    caption: r.caption ? String(r.caption) : undefined,
    created_at: normalizeIsoTimestamp(r.created_at) || '',
    updated_at: normalizeIsoTimestamp(r.updated_at) || '',
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
  // Check usage across episodes, guests, and site settings
  const epUsage = await db.execute({
    sql: 'SELECT id, title FROM episodes WHERE thumbnail_id = ? LIMIT 3',
    args: [id],
  });
  const guestUsage = await db.execute({
    sql: 'SELECT id, full_name FROM guests WHERE portrait_id = ? LIMIT 3',
    args: [id],
  });
  const settingsUsage = await db.execute({
    sql: 'SELECT id FROM site_settings WHERE logo_id = ? OR host_portrait_id = ? OR default_og_image_id = ? LIMIT 1',
    args: [id, id, id],
  });

  if (epUsage.rows.length > 0 || guestUsage.rows.length > 0 || settingsUsage.rows.length > 0) {
    const epTitles = epUsage.rows.map((r) => `Episode "${r.title}"`).join(', ');
    const guestNames = guestUsage.rows.map((r) => `Guest "${r.full_name}"`).join(', ');
    const settingsRef = settingsUsage.rows.length > 0 ? 'Site Settings' : '';
    const refs = [epTitles, guestNames, settingsRef].filter(Boolean).join(' and ');
    return {
      success: false,
      error: `Cannot delete asset: file is currently in active use by ${refs}. Please replace the reference first.`,
    };
  }

  // Fetch media record to verify existence and get filename
  const mediaRes = await db.execute({
    sql: 'SELECT filename FROM media WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (mediaRes.rows.length === 0) {
    return { success: false, error: 'Media asset not found.' };
  }

  const filename = String(mediaRes.rows[0].filename);

  // 1. Delete from database first to ensure relational integrity
  await db.execute({ sql: 'DELETE FROM media WHERE id = ?', args: [id] });

  // 2. Once database record is safely removed, delete file from S3 and local disk
  if (filename) {
    try {
      await deleteMediaFile(filename);
    } catch (cleanupErr) {
      console.warn(`Warning: Could not remove storage object for "${filename}":`, cleanupErr);
    }
  }

  return { success: true };
}
