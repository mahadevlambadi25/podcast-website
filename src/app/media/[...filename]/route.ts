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

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
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
