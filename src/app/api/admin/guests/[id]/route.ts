import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getGuestById, updateGuest, deleteGuest } from '@/services/guests.service';
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

    const guest = await getGuestById(numId);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch (error: any) {
    console.error('Error fetching guest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guest' },
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
    await updateGuest(numId, body);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'update',
      entity_type: 'guest',
      entity_id: numId,
      details: `Updated guest ID ${numId}`,
    });

    return NextResponse.json({ success: true, id: numId });
  } catch (error: any) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update guest' },
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

    const existing = await getGuestById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    const result = await deleteGuest(numId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'guest',
      entity_id: numId,
      details: `Deleted guest: "${existing.full_name}" (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'Guest deleted' });
  } catch (error: any) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete guest' },
      { status: 500 }
    );
  }
}
