import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from '../db/client';

export const SESSION_COOKIE_NAME = 'unchartered_session';
const SESSION_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecretKey(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.PAYLOAD_SECRET ||
    'unchartered-portal-dev-secret-key-at-least-32-characters-long'
  );
}

export interface SessionPayload {
  userId: number;
  email: string;
  role: 'admin' | 'editor';
  exp: number;
  iat: number;
}

export function createSessionToken(user: {
  id: number;
  email: string;
  role: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: (user.role as 'admin' | 'editor') || 'editor',
    iat: now,
    exp: now + SESSION_EXPIRATION_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', getSecretKey())
      .update(payloadB64)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSig);
    const signatureBuf = Buffer.from(signature);

    if (expectedBuf.length !== signatureBuf.length) return null;
    if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}

export async function getCurrentUser(): Promise<{
  id: number;
  email: string;
  role: 'admin' | 'editor';
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session) return null;

    // Verify user still exists in database and is not locked
    const userRes = await db.execute({
      sql: 'SELECT id, email, role, lock_until FROM users WHERE id = ? LIMIT 1',
      args: [session.userId],
    });

    if (userRes.rows.length === 0) return null;
    const user = userRes.rows[0];

    if (user.lock_until) {
      const lockUntil = new Date(user.lock_until as string).getTime();
      if (Date.now() < lockUntil) return null;
    }

    return {
      id: Number(user.id),
      email: String(user.email),
      role: (user.role as 'admin' | 'editor') || 'editor',
    };
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Administrator role required');
  }
  return user;
}
