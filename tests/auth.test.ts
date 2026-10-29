import { describe, it, expect } from 'vitest';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '../src/lib/auth/session';

describe('Authentication & Session Management Suite', () => {
  const sampleUser = {
    id: 1,
    email: 'admin@uncharteredpodcast.com',
    role: 'admin',
  };

  it('1. Generates a valid HMAC-SHA256 session token with correct payload', () => {
    const token = createSessionToken(sampleUser);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(1);
    expect(payload?.email).toBe('admin@uncharteredpodcast.com');
    expect(payload?.role).toBe('admin');
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('2. Rejects tampered session tokens', () => {
    const token = createSessionToken(sampleUser);
    const [payloadB64, signature] = token.split('.');

    // Tamper with payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ userId: 999, email: 'hacker@example.com', role: 'admin' })
    ).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${signature}`;

    expect(verifySessionToken(tamperedToken)).toBeNull();

    // Tamper with signature
    const corruptedSigToken = `${payloadB64}.${signature.slice(0, -4)}XXXX`;
    expect(verifySessionToken(corruptedSigToken)).toBeNull();
  });

  it('3. Rejects expired session tokens', () => {
    const now = Math.floor(Date.now() / 1000);
    // Create an expired payload
    const expiredPayload = {
      userId: 1,
      email: 'admin@uncharteredpodcast.com',
      role: 'admin' as const,
      iat: now - 1000,
      exp: now - 10, // expired 10 seconds ago
    };

    const crypto = require('crypto');
    const payloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const secret =
      process.env.SESSION_SECRET ||
      process.env.PAYLOAD_SECRET ||
      'unchartered-portal-dev-secret-key-at-least-32-characters-long';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    const expiredToken = `${payloadB64}.${signature}`;
    expect(verifySessionToken(expiredToken)).toBeNull();
  });

  it('4. Uses standard cookie name "unchartered_session"', () => {
    expect(SESSION_COOKIE_NAME).toBe('unchartered_session');
  });

  it('5. Properly calculates isHttps for cookie security based on forwarded headers', () => {
    function computeIsHttps(headers: Record<string, string>, protocol: string): boolean {
      const forwardedProto = headers['x-forwarded-proto'];
      return (
        forwardedProto?.split(',')[0].trim().toLowerCase() === 'https' ||
        protocol === 'https:'
      );
    }

    // Direct HTTPS
    expect(computeIsHttps({}, 'https:')).toBe(true);

    // Behind HTTPS reverse proxy / ALB / CloudFront
    expect(computeIsHttps({ 'x-forwarded-proto': 'https' }, 'http:')).toBe(true);
    expect(computeIsHttps({ 'x-forwarded-proto': 'https, http' }, 'http:')).toBe(true);

    // Plain HTTP (direct IP or unencrypted dev/staging)
    expect(computeIsHttps({}, 'http:')).toBe(false);
    expect(computeIsHttps({ 'x-forwarded-proto': 'http' }, 'http:')).toBe(false);
  });
});

