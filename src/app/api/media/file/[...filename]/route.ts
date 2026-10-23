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
    const safeName = path.basename(requestedName);
    const resolved = await resolveMediaFile(safeName);

    if (!resolved) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    const clientEtag = req.headers.get('if-none-match');
    if (resolved.etag && clientEtag && clientEtag === resolved.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': resolved.etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': resolved.contentType || getMimeType(safeName),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(resolved.contentLength),
    };

    if (resolved.etag) {
      headers['ETag'] = resolved.etag;
    }

    return new NextResponse(new Uint8Array(resolved.buffer), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('Error serving legacy api media file:', err);
    return NextResponse.json(
      { error: 'Internal media error' },
      { status: 500 }
    );
  }
}
