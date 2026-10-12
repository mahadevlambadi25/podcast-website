import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listRedirects, createRedirect } from '@/services/redirects.service';
import { logActivity } from '@/services/audit.service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redirects = await listRedirects();
    return NextResponse.json({ docs: redirects, totalDocs: redirects.length });
  } catch (error: any) {
    console.error('Error listing redirects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list redirects' },
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
    if (!body.from || !body.to) {
      return NextResponse.json(
        { error: 'Source (from) and target (to) paths are required' },
        { status: 400 }
      );
    }

    const result = await createRedirect(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'create',
      entity_type: 'redirect',
      entity_id: result.id,
      details: `Created redirect rule: ${body.from} -> ${body.to}`,
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating redirect:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create redirect' },
      { status: 500 }
    );
  }
}
