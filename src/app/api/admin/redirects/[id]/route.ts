import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { deleteRedirect } from '@/services/redirects.service';
import { logActivity } from '@/services/audit.service';

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

    await deleteRedirect(numId);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'redirect',
      entity_id: numId,
      details: `Deleted redirect ID ${numId}`,
    });

    return NextResponse.json({ success: true, message: 'Redirect rule deleted' });
  } catch (error: any) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete redirect' },
      { status: 500 }
    );
  }
}
