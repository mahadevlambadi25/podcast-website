import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getEpisodeById, updateEpisode, deleteEpisode } from '@/services/episodes.service';
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

    const episode = await getEpisodeById(numId);
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error: any) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch episode' },
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
    await updateEpisode(numId, body);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'update',
      entity_type: 'episode',
      entity_id: numId,
      details: `Updated episode ID ${numId}`,
    });

    return NextResponse.json({ success: true, id: numId });
  } catch (error: any) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update episode' },
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

    const existing = await getEpisodeById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    await deleteEpisode(numId);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'episode',
      entity_id: numId,
      details: `Deleted episode: "${existing.title}" (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'Episode deleted' });
  } catch (error: any) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete episode' },
      { status: 500 }
    );
  }
}
