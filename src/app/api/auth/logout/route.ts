import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET(req: NextRequest) {
  const url = new URL('/admin/login', req.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
