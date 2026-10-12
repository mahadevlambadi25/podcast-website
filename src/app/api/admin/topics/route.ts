import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listTopics, createTopic } from '@/services/topics.service';
import { logActivity } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;

    const topics = await listTopics({ search });
    return NextResponse.json({ docs: topics, totalDocs: topics.length });
  } catch (error: any) {
    console.error('Error listing topics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list topics' },
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
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Topic name is required' }, { status: 400 });
    }

    const result = await createTopic(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'create',
      entity_type: 'topic',
      entity_id: result.id,
      details: `Created topic: ${body.name}`,
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create topic' },
      { status: 500 }
    );
  }
}
