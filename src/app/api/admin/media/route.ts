import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listMedia, createMedia } from '@/services/media.service';
import { logActivity } from '@/services/audit.service';
import { saveMediaFile } from '@/lib/storage';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await listMedia({ search, page, limit });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list media' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const alt = (formData.get('alt') as string) || '';
    const caption = (formData.get('caption') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, SVG, AVIF, MP3, WAV, M4A, MP4, WebM`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 50MB.` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const originalName = file.name || 'upload';
    const ext = path.extname(originalName) || '.bin';
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const uniqueFilename = `${baseName}-${Date.now()}${ext}`;

    // Write file using unified storage helper
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveMediaFile(buffer, uniqueFilename);

    const publicUrl = `/media/${uniqueFilename}`;

    const id = await createMedia({
      filename: uniqueFilename,
      url: publicUrl,
      thumbnail_url: publicUrl,
      mime_type: file.type,
      filesize: file.size,
      alt: alt || baseName,
      caption: caption || undefined,
      data_base64: buffer.toString('base64'),
    });

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'create',
      entity_type: 'media',
      entity_id: id,
      details: `Uploaded media asset: ${uniqueFilename} (${file.type})`,
    });

    return NextResponse.json(
      {
        success: true,
        id,
        filename: uniqueFilename,
        url: publicUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}
