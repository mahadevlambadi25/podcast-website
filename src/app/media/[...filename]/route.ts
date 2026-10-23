import { NextRequest, NextResponse } from 'next/server';
import { resolveMediaFile, getMimeType } from '@/lib/storage';
import path from 'path';

export async function GET(
  req: NextRequest,
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

    // 1. Resolve from S3 or local storage
    const resolved = await resolveMediaFile(safeName);

    let fileBuffer: Buffer | null = resolved?.buffer ?? null;
    let contentType: string | null = resolved?.contentType ?? null;
    let etag: string | undefined = resolved?.etag;

    // 2. Fallback: Check durable database storage fallback
    if (!fileBuffer || !contentType) {
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
          contentType = row.mime_type || getMimeType(safeName);

          // Asynchronously write to local disk cache for instant subsequent reads
          const { saveMediaFile } = await import('@/lib/storage');
          saveMediaFile(fileBuffer, safeName, contentType || undefined).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('Media DB lookup error:', dbErr);
      }
    }

    if (!fileBuffer || !contentType) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Check ETag for 304 Not Modified
    const clientEtag = req.headers.get('if-none-match');
    if (etag && clientEtag && clientEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(fileBuffer.length),
    };

    if (etag) {
      headers['ETag'] = etag;
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Error serving media file:', err);
    return NextResponse.json(
      { error: 'Internal media error' },
      { status: 500 }
    );
  }
}
