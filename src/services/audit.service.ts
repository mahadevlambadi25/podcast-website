import { db } from '@/lib/db/client';

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

let tableEnsured = false;
async function ensureAuditTable() {
  if (tableEnsured) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);
  tableEnsured = true;
}

export async function logAuditAction(data: {
  userId?: number;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string | number;
  details?: string;
}): Promise<void> {
  try {
    await ensureAuditTable();
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        data.userId || null,
        data.userEmail || null,
        data.action,
        data.entity,
        data.entityId ? String(data.entityId) : null,
        data.details || null,
        now,
      ],
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function logActivity(data: {
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string | number;
  details?: string;
}): Promise<void> {
  return logAuditAction({
    userId: data.user_id,
    userEmail: data.user_email,
    action: data.action,
    entity: data.entity_type,
    entityId: data.entity_id,
    details: data.details,
  });
}

export async function listAuditLogs(options: {
  limit?: number;
  page?: number;
} = {}): Promise<{
  docs: AuditLogItem[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  await ensureAuditTable();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 20);
  const offset = (page - 1) * limit;

  const countRes = await db.execute('SELECT COUNT(*) as total FROM audit_logs');
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const listRes = await db.execute({
    sql: 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, offset],
  });

  const docs: AuditLogItem[] = listRes.rows.map((r) => ({
    id: Number(r.id),
    user_id: r.user_id ? Number(r.user_id) : undefined,
    user_email: r.user_email ? String(r.user_email) : undefined,
    action: String(r.action),
    entity: String(r.entity),
    entity_id: r.entity_id ? String(r.entity_id) : undefined,
    details: r.details ? String(r.details) : undefined,
    created_at: String(r.created_at),
  }));

  return { docs, totalDocs, totalPages, page, limit };
}
