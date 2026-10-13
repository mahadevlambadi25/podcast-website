import { db } from '@/lib/db/client';
import { invalidateSiteSettingsCache } from '@/lib/podcast';

export interface SiteSettingsData {
  id: number;
  brand_name: string;
  tagline?: string;
  publisher_name?: string;
  publisher_url?: string;
  attribution?: string;
  logo_id?: number;
  logo_url?: string;
  default_og_image_id?: number;
  default_og_image_url?: string;
  hero_headline?: string;
  hero_mission?: string;
  featured_episode_override_id?: number;
  about_mission?: string;
  about_audience?: string;
  about_editorial?: string;
  has_host_section?: boolean;
  host_name?: string;
  host_role?: string;
  host_bio?: string;
  host_portrait_id?: number;
  host_portrait_url?: string;
  youtube_channel_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  spotify_url?: string;
  apple_podcasts_url?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  nomination_recipient_email?: string;
  nomination_webhook_url?: string;
  analytics_id?: string;
  privacy_policy_content?: string;
  terms_content?: string;
  updated_at: string;
  created_at: string;
}

export async function getSiteSettings(): Promise<SiteSettingsData | null> {
  const res = await db.execute(`
    SELECT 
      s.*,
      m_logo.url as logo_url,
      m_og.url as default_og_image_url,
      m_host.url as host_portrait_url
    FROM site_settings s
    LEFT JOIN media m_logo ON s.logo_id = m_logo.id
    LEFT JOIN media m_og ON s.default_og_image_id = m_og.id
    LEFT JOIN media m_host ON s.host_portrait_id = m_host.id
    LIMIT 1
  `);

  if (res.rows.length === 0) return null;
  const r = res.rows[0];

  return {
    id: Number(r.id),
    brand_name: String(r.brand_name || 'Unchartered — Legends & Legacies'),
    tagline: r.tagline ? String(r.tagline) : undefined,
    publisher_name: r.publisher_name ? String(r.publisher_name) : undefined,
    publisher_url: r.publisher_url ? String(r.publisher_url) : undefined,
    attribution: r.attribution ? String(r.attribution) : undefined,
    logo_id: r.logo_id ? Number(r.logo_id) : undefined,
    logo_url: r.logo_url ? String(r.logo_url) : undefined,
    default_og_image_id: r.default_og_image_id ? Number(r.default_og_image_id) : undefined,
    default_og_image_url: r.default_og_image_url ? String(r.default_og_image_url) : undefined,
    hero_headline: r.hero_headline ? String(r.hero_headline) : undefined,
    hero_mission: r.hero_mission ? String(r.hero_mission) : undefined,
    featured_episode_override_id: r.featured_episode_override_id
      ? Number(r.featured_episode_override_id)
      : undefined,
    about_mission: r.about_mission ? String(r.about_mission) : undefined,
    about_audience: r.about_audience ? String(r.about_audience) : undefined,
    about_editorial: r.about_editorial ? String(r.about_editorial) : undefined,
    has_host_section: Boolean(r.has_host_section),
    host_name: r.host_name ? String(r.host_name) : undefined,
    host_role: r.host_role ? String(r.host_role) : undefined,
    host_bio: r.host_bio ? String(r.host_bio) : undefined,
    host_portrait_id: r.host_portrait_id ? Number(r.host_portrait_id) : undefined,
    host_portrait_url: r.host_portrait_url ? String(r.host_portrait_url) : undefined,
    youtube_channel_url: r.youtube_channel_url ? String(r.youtube_channel_url) : undefined,
    linkedin_url: r.linkedin_url ? String(r.linkedin_url) : undefined,
    twitter_url: r.twitter_url ? String(r.twitter_url) : undefined,
    spotify_url: r.spotify_url ? String(r.spotify_url) : undefined,
    apple_podcasts_url: r.apple_podcasts_url ? String(r.apple_podcasts_url) : undefined,
    contact_email: r.contact_email ? String(r.contact_email) : undefined,
    contact_phone: r.contact_phone ? String(r.contact_phone) : undefined,
    contact_address: r.contact_address ? String(r.contact_address) : undefined,
    nomination_recipient_email: r.nomination_recipient_email
      ? String(r.nomination_recipient_email)
      : undefined,
    nomination_webhook_url: r.nomination_webhook_url
      ? String(r.nomination_webhook_url)
      : undefined,
    analytics_id: r.analytics_id ? String(r.analytics_id) : undefined,
    privacy_policy_content: r.privacy_policy_content ? String(r.privacy_policy_content) : undefined,
    terms_content: r.terms_content ? String(r.terms_content) : undefined,
    updated_at: String(r.updated_at || ''),
    created_at: String(r.created_at || ''),
  };
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>): Promise<void> {
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE site_settings SET
        brand_name = COALESCE(?, brand_name),
        tagline = ?,
        publisher_name = ?,
        publisher_url = ?,
        attribution = ?,
        logo_id = ?,
        default_og_image_id = ?,
        hero_headline = ?,
        hero_mission = ?,
        about_mission = ?,
        about_audience = ?,
        about_editorial = ?,
        has_host_section = ?,
        host_name = ?,
        host_role = ?,
        host_bio = ?,
        host_portrait_id = ?,
        youtube_channel_url = ?,
        linkedin_url = ?,
        twitter_url = ?,
        spotify_url = ?,
        apple_podcasts_url = ?,
        contact_email = ?,
        contact_phone = ?,
        contact_address = ?,
        nomination_recipient_email = ?,
        nomination_webhook_url = ?,
        analytics_id = ?,
        privacy_policy_content = ?,
        terms_content = ?,
        updated_at = ?
      WHERE id = 1
    `,
    args: [
      data.brand_name ?? null,
      data.tagline ?? null,
      data.publisher_name ?? null,
      data.publisher_url ?? null,
      data.attribution ?? null,
      data.logo_id ?? null,
      data.default_og_image_id ?? null,
      data.hero_headline ?? null,
      data.hero_mission ?? null,
      data.about_mission ?? null,
      data.about_audience ?? null,
      data.about_editorial ?? null,
      data.has_host_section ? 1 : 0,
      data.host_name ?? null,
      data.host_role ?? null,
      data.host_bio ?? null,
      data.host_portrait_id ?? null,
      data.youtube_channel_url ?? null,
      data.linkedin_url ?? null,
      data.twitter_url ?? null,
      data.spotify_url ?? null,
      data.apple_podcasts_url ?? null,
      data.contact_email ?? null,
      data.contact_phone ?? null,
      data.contact_address ?? null,
      data.nomination_recipient_email ?? null,
      data.nomination_webhook_url ?? null,
      data.analytics_id ?? null,
      data.privacy_policy_content ?? null,
      data.terms_content ?? null,
      now,
    ],
  });

  invalidateSiteSettingsCache();
}
