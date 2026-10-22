import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { listGuests, createGuest } from '@/services/guests.service';
import { logActivity } from '@/services/audit.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const featuredOnly = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const data = await listGuests({ search, status, featuredOnly, page, limit });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing guests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list guests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.full_name || !body.full_name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const id = await createGuest(body);

    try {
      revalidatePath('/guests');
      revalidatePath('/');
      if (body.slug) {
        revalidatePath(`/guests/${body.slug}`);
      }
    } catch {
      // Revalidation errors should not fail the API response
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'create',
      entity_type: 'guest',
      entity_id: id,
      details: `Created guest: ${body.full_name}`,
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating guest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create guest' },
      { status: 500 }
    );
  }
}
