import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listContactMessages } from '@/services/contact.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const data = await listContactMessages({ search, page, limit });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing contact messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list contact messages' },
      { status: 500 }
    );
  }
}
