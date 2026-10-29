import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Query user
    const res = await db.execute({
      sql: 'SELECT id, email, role, salt, hash, login_attempts, lock_until FROM users WHERE LOWER(email) = ? LIMIT 1',
      args: [cleanEmail],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // Check account lockout
    if (user.lock_until) {
      const lockUntil = new Date(user.lock_until as string).getTime();
      if (Date.now() < lockUntil) {
        const remainingMinutes = Math.ceil((lockUntil - Date.now()) / 60000);
        return NextResponse.json(
          {
            error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          },
          { status: 403 }
        );
      }
    }

    // Verify password
    const isValid = verifyPassword(
      String(password),
      String(user.salt || ''),
      String(user.hash || '')
    );

    if (!isValid) {
      const attempts = Number(user.login_attempts || 0) + 1;
      let lockUntilSql: string | null = null;

      if (attempts >= 5) {
        // Lock for 10 minutes
        const lockDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        lockUntilSql = lockDate;
      }

      await db.execute({
        sql: 'UPDATE users SET login_attempts = ?, lock_until = ? WHERE id = ?',
        args: [attempts, lockUntilSql, user.id],
      });

      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Success: reset attempts
    await db.execute({
      sql: 'UPDATE users SET login_attempts = 0, lock_until = NULL WHERE id = ?',
      args: [user.id],
    });

    // Create session token
    const token = createSessionToken({
      id: Number(user.id),
      email: String(user.email),
      role: String(user.role || 'editor'),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        email: String(user.email),
        role: String(user.role || 'editor'),
      },
    });

    const forwardedProto = req.headers.get('x-forwarded-proto');
    const isHttps =
      forwardedProto?.split(',')[0].trim().toLowerCase() === 'https' ||
      req.nextUrl.protocol === 'https:';

    // Set secure cookie - uses Secure flag whenever accessed over HTTPS or behind an HTTPS proxy
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev
      ? `Database connection error: ${err?.message || 'Authentication failed'}. Please check DATABASE_URL in .env.local.`
      : 'An unexpected server error occurred during authentication.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
