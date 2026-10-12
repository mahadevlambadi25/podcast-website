import { db } from '@/lib/db/client';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

export interface UserItem {
  id: number;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
}

export async function listUsers(): Promise<UserItem[]> {
  const res = await db.execute(`
    SELECT id, email, role, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
  `);

  return res.rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    role: (r.role as 'admin' | 'editor') || 'editor',
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));
}

export async function getUserById(id: number): Promise<UserItem | null> {
  const res = await db.execute({
    sql: 'SELECT id, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  return {
    id: Number(r.id),
    email: String(r.email),
    role: (r.role as 'admin' | 'editor') || 'editor',
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  };
}

export async function createUser(data: {
  email: string;
  role: 'admin' | 'editor';
  password: string;
}): Promise<{ id?: number; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();

  // Validate duplicate email
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
    args: [cleanEmail],
  });

  if (existing.rows.length > 0) {
    return { error: `A user with email "${cleanEmail}" already exists.` };
  }

  // Validate password strength
  const passCheck = validatePasswordStrength(data.password);
  if (!passCheck.valid) {
    return { error: passCheck.message };
  }

  const { salt, hash } = await hashPassword(data.password);
  const now = new Date().toISOString();

  const insertRes = await db.execute({
    sql: `
      INSERT INTO users (email, role, salt, hash, login_attempts, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `,
    args: [cleanEmail, data.role || 'editor', salt, hash, now, now],
  });

  return { id: Number(insertRes.lastInsertRowid) };
}

export async function updateUser(
  id: number,
  data: {
    email?: string;
    role?: 'admin' | 'editor';
    password?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (data.email) {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1',
      args: [cleanEmail, id],
    });
    if (existing.rows.length > 0) {
      return { success: false, error: `Email "${cleanEmail}" is already taken.` };
    }
  }

  let newSalt: string | null = null;
  let newHash: string | null = null;

  if (data.password) {
    const passCheck = validatePasswordStrength(data.password);
    if (!passCheck.valid) {
      return { success: false, error: passCheck.message };
    }
    const hashed = await hashPassword(data.password);
    newSalt = hashed.salt;
    newHash = hashed.hash;
  }

  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE users SET
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        salt = COALESCE(?, salt),
        hash = COALESCE(?, hash),
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      data.email ? data.email.trim().toLowerCase() : null,
      data.role ?? null,
      newSalt,
      newHash,
      now,
      id,
    ],
  });

  return { success: true };
}

export async function deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
  // Prevent deleting the last administrator
  const userRes = await db.execute({
    sql: 'SELECT role FROM users WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (userRes.rows.length === 0) {
    return { success: false, error: 'User not found.' };
  }

  if (userRes.rows[0].role === 'admin') {
    const adminCountRes = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'");
    const adminCount = Number(adminCountRes.rows[0]?.cnt || 0);
    if (adminCount <= 1) {
      return {
        success: false,
        error: 'Cannot delete this account: it is the last administrator account on the system.',
      };
    }
  }

  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
  return { success: true };
}
