import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getEpisodeById, updateEpisode } from '@/services/episodes.service';
import { logActivity } from '@/services/audit.service';
import { normalizeIsoTimestamp, toUtcIsoString } from '@/lib/date';

export async function POST(
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
    const action = body.action; // 'publish' | 'unpublish' | 'archive' | 'schedule'
    const scheduledAt = body.scheduledAt;

    const episode = await getEpisodeById(numId);
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    if (action === 'publish') {
      // Validate required fields before publishing
      const missingFields: string[] = [];
      if (!episode.title) missingFields.push('title');
      if (!episode.slug) missingFields.push('slug');
      if (!episode.short_summary && !episode.description) {
        missingFields.push('summary or description');
      }

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot publish: Missing required fields: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const published_at = normalizeIsoTimestamp(episode.published_at) || toUtcIsoString(new Date());
      await updateEpisode(numId, {
        status: 'published',
        published_at,
      });

      await logActivity({
        user_id: user.id,
        user_email: user.email,
        action: 'publish',
        entity_type: 'episode',
        entity_id: numId,
        details: `Published episode: "${episode.title}"`,
      });

      return NextResponse.json({ success: true, status: 'published', published_at });
    } else if (action === 'unpublish') {
      await updateEpisode(numId, {
        status: 'draft',
      });

      await logActivity({
        user_id: user.id,
        user_email: user.email,
        action: 'unpublish',
        entity_type: 'episode',
        entity_id: numId,
        details: `Reverted episode to draft: "${episode.title}"`,
      });

      return NextResponse.json({ success: true, status: 'draft' });
    } else if (action === 'archive') {
      await updateEpisode(numId, {
        status: 'archived',
      });

      await logActivity({
        user_id: user.id,
        user_email: user.email,
        action: 'archive',
        entity_type: 'episode',
        entity_id: numId,
        details: `Archived episode: "${episode.title}"`,
      });

      return NextResponse.json({ success: true, status: 'archived' });
    } else if (action === 'schedule') {
      if (!scheduledAt) {
        return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
      }
      const normalizedScheduled = normalizeIsoTimestamp(scheduledAt);
      if (!normalizedScheduled) {
        return NextResponse.json({ error: 'Invalid scheduled date/time format' }, { status: 400 });
      }
      await updateEpisode(numId, {
        status: 'scheduled',
        published_at: normalizedScheduled,
      });

      await logActivity({
        user_id: user.id,
        user_email: user.email,
        action: 'schedule',
        entity_type: 'episode',
        entity_id: numId,
        details: `Scheduled episode "${episode.title}" for ${normalizedScheduled}`,
      });

      return NextResponse.json({ success: true, status: 'scheduled', published_at: normalizedScheduled });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in episode publish action:', error);
    return NextResponse.json(
      { error: error.message || 'Action failed' },
      { status: 500 }
    );
  }
}
