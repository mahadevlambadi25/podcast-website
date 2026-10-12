import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { publishScheduledEpisodes } from '@/services/episodes.service';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * Constant-time comparison to prevent timing side-channel attacks on the cron secret
 */
function timingSafeCheck(headerToken: string, expectedToken: string): boolean {
  if (!headerToken || !expectedToken) return false;
  const tokenBuf = Buffer.from(headerToken);
  const expectedBuf = Buffer.from(expectedToken);
  if (tokenBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, expectedBuf);
}

/**
 * POST /api/cron/publish
 * Scheduled Publishing Cron Job
 * Must be called via POST with Authorization: Bearer <CRON_SECRET>
 * Never accepts tokens in query parameters to prevent leakage in logs.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const secret = process.env.CRON_SECRET;

    if (!secret) {
      console.error('CRON_SECRET is not configured on the server.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7).trim();
    if (!timingSafeCheck(token, secret)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const published = await publishScheduledEpisodes();
    const publishedIds = published.map((p) => p.id);
    const publishedSlugs = published.map((p) => p.slug);

    // Comprehensive ISR cache revalidation
    if (publishedIds.length > 0) {
      try {
        revalidatePath('/');
        revalidatePath('/episodes');
        revalidatePath('/sitemap.xml');
        revalidatePath('/search');
        for (const slug of publishedSlugs) {
          revalidatePath(`/episodes/${slug}`);
        }
        revalidateTag('episodes');
      } catch {
        // Safe fallback in non-request contexts
      }
    }

    return NextResponse.json({
      success: true,
      publishedCount: publishedIds.length,
      publishedIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Scheduled publishing cron error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
