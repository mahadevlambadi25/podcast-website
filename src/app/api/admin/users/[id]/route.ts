import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getUserById, updateUser, deleteUser } from '@/services/users.service';
import { logActivity } from '@/services/audit.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const user = await getUserById(numId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const result = await updateUser(numId, body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity({
      user_id: admin.id,
      user_email: admin.email,
      action: 'update',
      entity_type: 'user',
      entity_id: numId,
      details: `Updated user account ID ${numId}`,
    });

    return NextResponse.json({ success: true, id: numId });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await getUserById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting their own active account
    if (admin.id === numId) {
      return NextResponse.json(
        { error: 'You cannot delete your own active administrator account.' },
        { status: 400 }
      );
    }

    const result = await deleteUser(numId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    await logActivity({
      user_id: admin.id,
      user_email: admin.email,
      action: 'delete',
      entity_type: 'user',
      entity_id: numId,
      details: `Deleted user: ${existing.email} (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
