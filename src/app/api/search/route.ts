import { NextResponse } from 'next/server';
import { executeGlobalSearch } from '@/lib/payload';
import { checkRateLimit } from '@/utils/rate-limit';

export async function GET(req: Request) {
  // Rate limiting (30 requests/min per IP)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = await checkRateLimit(`search_${ip}`, 30, 60000);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many search requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      }
    );
  }

  const url = new URL(req.url);
  const rawQ = url.searchParams.get('q') || '';
  const trimmedQ = rawQ.trim().slice(0, 100); // Truncate overly long queries

  if (!trimmedQ) {
    return NextResponse.json({ query: '', guests: [], episodes: [], totalCount: 0 });
  }

  const results = await executeGlobalSearch(trimmedQ);
  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
