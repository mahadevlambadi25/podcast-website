import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getNominationById,
  updateNomination,
  deleteNomination,
} from '@/services/nominations.service';
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

    const nomination = await getNominationById(numId);
    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    return NextResponse.json(nomination);
  } catch (error: any) {
    console.error('Error fetching nomination:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nomination' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    await updateNomination(numId, {
      status: body.status,
      internal_notes: body.internal_notes,
    });

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'update',
      entity_type: 'nomination',
      entity_id: numId,
      details: `Updated nomination status to "${body.status || 'unchanged'}" for ID ${numId}`,
    });

    return NextResponse.json({ success: true, id: numId });
  } catch (error: any) {
    console.error('Error updating nomination:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update nomination' },
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

    const existing = await getNominationById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    await deleteNomination(numId);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'nomination',
      entity_id: numId,
      details: `Deleted nomination for "${existing.guest_name}" (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'Nomination deleted' });
  } catch (error: any) {
    console.error('Error deleting nomination:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete nomination' },
      { status: 500 }
    );
  }
}
