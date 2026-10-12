import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  try {
    // Lightweight count query to test live database connection
    await db.execute('SELECT COUNT(*) as count FROM topics');

    return NextResponse.json(
      {
        status: 'ok',
        healthy: true,
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(uptime),
        timestamp,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    console.error('Health check database connection error:', err);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Database connection failed',
        uptimeSeconds: Math.floor(uptime),
        timestamp,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
