import { db } from '@/lib/db/client';

export interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  message: string;
  consent?: boolean;
  consent_timestamp?: string;
  email_delivery_failed?: boolean;
  created_at: string;
  updated_at: string;
}

export async function listContactMessages(options: {
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  docs: ContactMessageItem[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, options.limit || 15);
  const offset = (page - 1) * limit;

  const conditions = ['1=1'];
  const args: any[] = [];

  if (options.search) {
    conditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.message LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q);
  }

  const where = conditions.join(' AND ');

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM contact_messages c WHERE ${where}`,
    args,
  });
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const queryArgs = [...args, limit, offset];
  const listRes = await db.execute({
    sql: `
      SELECT c.*
      FROM contact_messages c
      WHERE ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const docs: ContactMessageItem[] = listRes.rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name || 'Anonymous'),
    email: String(r.email || ''),
    message: String(r.message || ''),
    consent: Boolean(r.consent),
    consent_timestamp: r.consent_timestamp ? String(r.consent_timestamp) : undefined,
    email_delivery_failed: Boolean(r.email_delivery_failed),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));

  return { docs, totalDocs, totalPages, page, limit };
}

export async function getContactMessageById(id: number): Promise<ContactMessageItem | null> {
  const res = await db.execute({
    sql: 'SELECT * FROM contact_messages WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  return {
    id: Number(r.id),
    name: String(r.name || 'Anonymous'),
    email: String(r.email || ''),
    message: String(r.message || ''),
    consent: Boolean(r.consent),
    consent_timestamp: r.consent_timestamp ? String(r.consent_timestamp) : undefined,
    email_delivery_failed: Boolean(r.email_delivery_failed),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  };
}

export async function deleteContactMessage(id: number): Promise<void> {
  await db.execute({ sql: 'DELETE FROM contact_messages WHERE id = ?', args: [id] });
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  message: string;
  consent?: boolean;
  consent_timestamp?: string;
  email_delivery_failed?: boolean;
}): Promise<number> {
  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `
      INSERT INTO contact_messages (name, email, message, consent, consent_timestamp, email_delivery_failed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.name,
      data.email,
      data.message,
      data.consent ? 1 : 0,
      data.consent_timestamp || now,
      data.email_delivery_failed ? 1 : 0,
      now,
      now,
    ],
  });
  return Number(res.lastInsertRowid);
}

export async function updateContactMessageDelivery(id: number, failed: boolean): Promise<void> {
  await db.execute({
    sql: `UPDATE contact_messages SET email_delivery_failed = ?, updated_at = ? WHERE id = ?`,
    args: [failed ? 1 : 0, new Date().toISOString(), id],
  });
}
