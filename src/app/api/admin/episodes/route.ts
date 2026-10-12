import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listEpisodes, createEpisode } from '@/services/episodes.service';
import { logActivity } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || 'published_at';
    const direction = (searchParams.get('direction') as 'asc' | 'desc') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const guestId = searchParams.get('guestId') ? parseInt(searchParams.get('guestId')!, 10) : undefined;
    const topicId = searchParams.get('topicId') ? parseInt(searchParams.get('topicId')!, 10) : undefined;

    const data = await listEpisodes({
      status,
      search,
      sort,
      direction,
      page,
      limit,
      guestId,
      topicId,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing episodes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list episodes' },
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

    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = await createEpisode(body);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'create',
      entity_type: 'episode',
      entity_id: id,
      details: `Created episode: ${body.title}`,
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating episode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create episode' },
      { status: 500 }
    );
  }
}
