import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listAuditLogs } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const logs = await listAuditLogs({ page, limit });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error listing audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list audit logs' },
      { status: 500 }
    );
  }
}
