import { NextRequest, NextResponse } from 'next/server';
import { findMediaFile } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/x-m4a',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;
    if (!filename || filename.length === 0) {
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    const requestedName = filename.join('/');
    // Prevent directory traversal attacks
    const safeName = path.basename(requestedName);
    const filePath = findMediaFile(safeName);
    let fileBuffer: Buffer | null = null;
    let contentType: string | null = null;

    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(safeName).toLowerCase();
      contentType = MIME_MAP[ext] || 'application/octet-stream';
      fileBuffer = fs.readFileSync(filePath);
    } else {
      // Check durable database storage fallback
      try {
        const { db } = await import('@/lib/db/client');
        const ext = path.extname(safeName).toLowerCase();
        const baseNameWithoutExt = path.basename(safeName, ext).replace(/-\d{10,}$/, '');

        const dbRes = await db.execute({
          sql: `
            SELECT filename, mime_type, data_base64
            FROM media
            WHERE filename = ? OR filename LIKE ?
            ORDER BY (filename = ?) DESC, created_at DESC
            LIMIT 1
          `,
          args: [safeName, `%${baseNameWithoutExt}%`, safeName],
        });

        if (dbRes.rows.length > 0 && dbRes.rows[0]?.data_base64) {
          const row = dbRes.rows[0];
          fileBuffer = Buffer.from(row.data_base64, 'base64');
          contentType = row.mime_type || MIME_MAP[ext] || 'application/octet-stream';

          // Asynchronously write to local disk cache for instant subsequent reads
          const { saveMediaFile } = await import('@/lib/storage');
          saveMediaFile(fileBuffer, safeName).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('Media DB lookup error:', dbErr);
      }
    }

    if (!fileBuffer || !contentType) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (err: any) {
    console.error('Error serving media file:', err);
    return NextResponse.json(
      { error: 'Internal media error' },
      { status: 500 }
    );
  }
}
