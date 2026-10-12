import { db } from '@/lib/db/client';

export interface NominationItem {
  id: number;
  guest_name: string;
  guest_role_company: string;
  profile_link?: string;
  reason?: string;
  status: 'pending' | 'under_review' | 'approved' | 'declined';
  internal_notes?: string;
  name?: string;
  email?: string;
  consent?: boolean;
  consent_timestamp?: string;
  email_delivery_failed?: boolean;
  created_at: string;
  updated_at: string;
}

export async function listNominations(options: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{
  docs: NominationItem[];
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

  if (options.status && options.status !== 'all') {
    conditions.push('n.status = ?');
    args.push(options.status);
  }

  if (options.search) {
    conditions.push('(n.guest_name LIKE ? OR n.guest_role_company LIKE ? OR n.name LIKE ? OR n.email LIKE ?)');
    const q = `%${options.search}%`;
    args.push(q, q, q, q);
  }

  const where = conditions.join(' AND ');

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM nominations n WHERE ${where}`,
    args,
  });
  const totalDocs = Number(countRes.rows[0]?.total || 0);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const queryArgs = [...args, limit, offset];
  const listRes = await db.execute({
    sql: `
      SELECT n.*
      FROM nominations n
      WHERE ${where}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `,
    args: queryArgs,
  });

  const docs: NominationItem[] = listRes.rows.map((r) => ({
    id: Number(r.id),
    guest_name: String(r.guest_name || 'Anonymous'),
    guest_role_company: String(r.guest_role_company || ''),
    profile_link: r.profile_link ? String(r.profile_link) : undefined,
    reason: r.reason ? String(r.reason) : undefined,
    status: (r.status as any) || 'pending',
    internal_notes: r.internal_notes ? String(r.internal_notes) : undefined,
    name: r.name ? String(r.name) : undefined,
    email: r.email ? String(r.email) : undefined,
    consent: Boolean(r.consent),
    consent_timestamp: r.consent_timestamp ? String(r.consent_timestamp) : undefined,
    email_delivery_failed: Boolean(r.email_delivery_failed),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  }));

  return { docs, totalDocs, totalPages, page, limit };
}

export async function getNominationById(id: number): Promise<NominationItem | null> {
  const res = await db.execute({
    sql: 'SELECT * FROM nominations WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  return {
    id: Number(r.id),
    guest_name: String(r.guest_name || 'Anonymous'),
    guest_role_company: String(r.guest_role_company || ''),
    profile_link: r.profile_link ? String(r.profile_link) : undefined,
    reason: r.reason ? String(r.reason) : undefined,
    status: (r.status as any) || 'pending',
    internal_notes: r.internal_notes ? String(r.internal_notes) : undefined,
    name: r.name ? String(r.name) : undefined,
    email: r.email ? String(r.email) : undefined,
    consent: Boolean(r.consent),
    consent_timestamp: r.consent_timestamp ? String(r.consent_timestamp) : undefined,
    email_delivery_failed: Boolean(r.email_delivery_failed),
    created_at: String(r.created_at || ''),
    updated_at: String(r.updated_at || ''),
  };
}

export async function updateNomination(
  id: number,
  data: { status?: string; internal_notes?: string }
): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      UPDATE nominations SET
        status = COALESCE(?, status),
        internal_notes = COALESCE(?, internal_notes),
        updated_at = ?
      WHERE id = ?
    `,
    args: [data.status ?? null, data.internal_notes ?? null, now, id],
  });
}

export async function deleteNomination(id: number): Promise<void> {
  await db.execute({ sql: 'DELETE FROM nominations WHERE id = ?', args: [id] });
}

export async function createNomination(data: {
  guest_name: string;
  guest_role_company: string;
  profile_link?: string;
  reason?: string;
  name?: string;
  email?: string;
  consent?: boolean;
  consent_timestamp?: string;
  email_delivery_failed?: boolean;
}): Promise<number> {
  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `
      INSERT INTO nominations (
        guest_name, guest_role_company, profile_link, reason, status,
        name, email, consent, consent_timestamp, email_delivery_failed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      data.guest_name,
      data.guest_role_company,
      data.profile_link || null,
      data.reason || null,
      data.name || null,
      data.email || null,
      data.consent ? 1 : 0,
      data.consent_timestamp || now,
      data.email_delivery_failed ? 1 : 0,
      now,
      now,
    ],
  });
  return Number(res.lastInsertRowid);
}

export async function updateNominationDelivery(id: number, failed: boolean): Promise<void> {
  await db.execute({
    sql: `UPDATE nominations SET email_delivery_failed = ?, updated_at = ? WHERE id = ?`,
    args: [failed ? 1 : 0, new Date().toISOString(), id],
  });
}
