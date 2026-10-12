import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import {
  getContactMessageById,
  deleteContactMessage,
} from '@/services/contact.service';
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

    const message = await getContactMessageById(numId);
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error fetching contact message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact message' },
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

    const existing = await getContactMessageById(numId);
    if (!existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await deleteContactMessage(numId);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'delete',
      entity_type: 'contact_message',
      entity_id: numId,
      details: `Deleted contact message from "${existing.name}" <${existing.email}> (ID: ${numId})`,
    });

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    console.error('Error deleting contact message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact message' },
      { status: 500 }
    );
  }
}
