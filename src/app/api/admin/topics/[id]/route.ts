import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getTopicById, updateTopic, deleteTopic } from '@/services/topics.service';
import { logActivity } from '@/services/audit.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const topic = await getTopicById(numId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error: any) {
    console.error('Error fetching topic:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const result = await updateTopic(numId, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'update',
      entity_type: 'topic',
      entity_id: numId,
      details: `Updated topic ID ${numId}`,
    });

    return NextResponse.json({ success: true, id: numId });
  } catch (error: any) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update topic' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await getTopicById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const result = await deleteTopic(numId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'topic',
      entity_id: numId,
      details: `Deleted topic: "${existing.name}" (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'Topic deleted' });
  } catch (error: any) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
