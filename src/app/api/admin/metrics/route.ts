import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDashboardMetrics } from '@/services/metrics.service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getDashboardMetrics();

    return NextResponse.json({
      metrics: data.counts,
      recentEpisodes: data.recentEpisodes,
      recentNominations: data.recentNominations,
      recentMessages: data.recentMessages,
      publishingActivity: data.publishingActivity,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
