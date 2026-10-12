import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getSiteSettings, updateSiteSettings } from '@/services/settings.service';
import { logActivity } from '@/services/audit.service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json(settings || {});
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await updateSiteSettings(body);

    await logActivity({
      user_id: user.id,
      user_email: user.email,
      action: 'update',
      entity_type: 'settings',
      entity_id: '1',
      details: 'Updated global site settings',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
