import { db } from '@/lib/db/client';

export interface DashboardMetrics {
  counts: {
    totalEpisodes: number;
    publishedEpisodes: number;
    draftEpisodes: number;
    scheduledEpisodes: number;
    totalGuests: number;
    pendingNominations: number;
    unreadMessages: number;
    totalMedia: number;
  };
  recentEpisodes: Array<{
    id: number;
    title: string;
    slug: string;
    status: string;
    episode_number?: number;
    season?: number;
    published_at?: string;
    created_at: string;
  }>;
  recentNominations: Array<{
    id: number;
    guest_name: string;
    guest_role_company: string;
    status: string;
    email: string;
    created_at: string;
  }>;
  recentMessages: Array<{
    id: number;
    name: string;
    email: string;
    message: string;
    created_at: string;
  }>;
  publishingActivity: Array<{
    month: string;
    count: number;
  }>;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date().toISOString();

  // 1. Episode status counts
  const epRes = await db.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'published' AND (published_at IS NULL OR published_at <= '${now}') THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'published' AND published_at > '${now}' THEN 1 ELSE 0 END) as scheduled
    FROM episodes
  `);

  const totalEpisodes = Number(epRes.rows[0]?.total || 0);
  const publishedEpisodes = Number(epRes.rows[0]?.published || 0);
  const draftEpisodes = Number(epRes.rows[0]?.draft || 0);
  const scheduledEpisodes = Number(epRes.rows[0]?.scheduled || 0);

  // 2. Guests count
  const guestRes = await db.execute('SELECT COUNT(*) as cnt FROM guests');
  const totalGuests = Number(guestRes.rows[0]?.cnt || 0);

  // 3. Pending Nominations
  const nomRes = await db.execute(`
    SELECT COUNT(*) as cnt FROM nominations WHERE status = 'pending' OR status IS NULL OR status = ''
  `);
  const pendingNominations = Number(nomRes.rows[0]?.cnt || 0);

  // 4. Contact messages count
  const msgRes = await db.execute('SELECT COUNT(*) as cnt FROM contact_messages');
  const unreadMessages = Number(msgRes.rows[0]?.cnt || 0);

  // 5. Media count
  const mediaRes = await db.execute('SELECT COUNT(*) as cnt FROM media');
  const totalMedia = Number(mediaRes.rows[0]?.cnt || 0);

  // 6. Recent Episodes
  const recentEpRes = await db.execute(`
    SELECT id, title, slug, status, episode_number, season, published_at, created_at
    FROM episodes
    ORDER BY created_at DESC
    LIMIT 5
  `);

  // 7. Recent Nominations
  const recentNomRes = await db.execute(`
    SELECT id, guest_name, guest_role_company, status, email, created_at
    FROM nominations
    ORDER BY created_at DESC
    LIMIT 5
  `);

  // 8. Recent Messages
  const recentMsgRes = await db.execute(`
    SELECT id, name, email, message, created_at
    FROM contact_messages
    ORDER BY created_at DESC
    LIMIT 5
  `);

  // 9. Publishing activity (past 6 months)
  const activityRes = await db.execute(`
    SELECT strftime('%Y-%m', created_at) as m, COUNT(*) as cnt
    FROM episodes
    WHERE created_at IS NOT NULL
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY m DESC
    LIMIT 6
  `);

  const publishingActivity = activityRes.rows
    .map((r) => ({
      month: String(r.m || 'Unknown'),
      count: Number(r.cnt || 0),
    }))
    .reverse();

  return {
    counts: {
      totalEpisodes,
      publishedEpisodes,
      draftEpisodes,
      scheduledEpisodes,
      totalGuests,
      pendingNominations,
      unreadMessages,
      totalMedia,
    },
    recentEpisodes: recentEpRes.rows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      slug: String(r.slug),
      status: String(r.status || 'draft'),
      episode_number: r.episode_number ? Number(r.episode_number) : undefined,
      season: r.season ? Number(r.season) : undefined,
      published_at: r.published_at ? String(r.published_at) : undefined,
      created_at: String(r.created_at || ''),
    })),
    recentNominations: recentNomRes.rows.map((r) => ({
      id: Number(r.id),
      guest_name: String(r.guest_name || 'Anonymous'),
      guest_role_company: String(r.guest_role_company || ''),
      status: String(r.status || 'pending'),
      email: String(r.email || ''),
      created_at: String(r.created_at || ''),
    })),
    recentMessages: recentMsgRes.rows.map((r) => ({
      id: Number(r.id),
      name: String(r.name || 'Anonymous'),
      email: String(r.email || ''),
      message: String(r.message || ''),
      created_at: String(r.created_at || ''),
    })),
    publishingActivity,
  };
}
