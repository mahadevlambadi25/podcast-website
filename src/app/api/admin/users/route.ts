import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { listUsers, createUser } from '@/services/users.service';
import { logActivity } from '@/services/audit.service';

export async function GET() {
  try {
    const admin = await requireAdmin();

    const users = await listUsers();
    return NextResponse.json({ docs: users, totalDocs: users.length });
  } catch (error: any) {
    console.error('Error listing users:', error);
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to list users' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const result = await createUser(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity({
      user_id: admin.id,
      user_email: admin.email,
      action: 'create',
      entity_type: 'user',
      entity_id: result.id,
      details: `Created new user account: ${body.email} (${body.role})`,
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status });
  }
}
