-- Unchartered Podcast PostgreSQL Production Schema
-- Compatible with PostgreSQL 14+, Supabase, and Render PostgreSQL

-- 0. Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'editor' NOT NULL,
  salt TEXT,
  hash TEXT,
  login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMPTZ,
  reset_password_token TEXT,
  reset_password_expiration TIMESTAMPTZ,
  reset_password_requested_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

CREATE TABLE IF NOT EXISTS users_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS users_sessions_token_idx ON users_sessions (token);
CREATE INDEX IF NOT EXISTS users_sessions_user_id_idx ON users_sessions (user_id);

-- 2. Media Uploads & File Metadata
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,
  thumbnail_u_r_l TEXT,
  mime_type TEXT,
  filesize BIGINT,
  width INTEGER,
  height INTEGER,
  focal_x NUMERIC,
  focal_y NUMERIC,
  alt TEXT,
  caption TEXT,
  sizes_thumbnail_url TEXT,
  sizes_thumbnail_width NUMERIC,
  sizes_thumbnail_height NUMERIC,
  sizes_thumbnail_mime_type TEXT,
  sizes_thumbnail_filesize NUMERIC,
  sizes_thumbnail_filename TEXT,
  sizes_portrait_url TEXT,
  sizes_portrait_width NUMERIC,
  sizes_portrait_height NUMERIC,
  sizes_portrait_mime_type TEXT,
  sizes_portrait_filesize NUMERIC,
  sizes_portrait_filename TEXT,
  sizes_og_url TEXT,
  sizes_og_width NUMERIC,
  sizes_og_height NUMERIC,
  sizes_og_mime_type TEXT,
  sizes_og_filesize NUMERIC,
  sizes_og_filename TEXT,
  data_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS media_filename_idx ON media (filename);
CREATE INDEX IF NOT EXISTS media_created_at_idx ON media (created_at);

-- 3. Topics
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS topics_slug_idx ON topics (slug);

-- 4. Guests
CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  role TEXT,
  company TEXT,
  short_overview TEXT,
  biography TEXT,
  bio TEXT,
  portrait_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  portrait_url TEXT,
  portrait_alt TEXT,
  portrait_credit TEXT,
  links_linkedin TEXT,
  links_website TEXT,
  links_other TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  social_image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  canonical_override TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS guests_slug_idx ON guests (slug);
CREATE INDEX IF NOT EXISTS guests_status_idx ON guests (status);
CREATE INDEX IF NOT EXISTS guests_featured_idx ON guests (featured);
CREATE INDEX IF NOT EXISTS guests_portrait_idx ON guests (portrait_id);

CREATE TABLE IF NOT EXISTS guests_alternate_names (
  _order INTEGER NOT NULL,
  _parent_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS guests_alt_names_parent_idx ON guests_alternate_names (_parent_id);

CREATE TABLE IF NOT EXISTS guests_key_insights (
  _order INTEGER NOT NULL,
  _parent_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
  id TEXT PRIMARY KEY NOT NULL,
  quote TEXT NOT NULL,
  context TEXT
);

CREATE INDEX IF NOT EXISTS guests_insights_parent_idx ON guests_key_insights (_parent_id);

CREATE TABLE IF NOT EXISTS guests_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  topics_id INTEGER REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS guests_rels_parent_idx ON guests_rels (parent_id);
CREATE INDEX IF NOT EXISTS guests_rels_topics_idx ON guests_rels (topics_id);
CREATE INDEX IF NOT EXISTS guests_rels_path_idx ON guests_rels (path);

-- 5. Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  youtube_url TEXT,
  youtube_video_id TEXT,
  fallback_watch_url TEXT,
  short_summary TEXT,
  description TEXT,
  thumbnail_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  episode_number NUMERIC,
  season NUMERIC,
  published_at TIMESTAMPTZ,
  transcript TEXT,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  canonical_override TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS episodes_slug_idx ON episodes (slug);
CREATE INDEX IF NOT EXISTS episodes_status_idx ON episodes (status);
CREATE INDEX IF NOT EXISTS episodes_published_at_idx ON episodes (published_at);
CREATE INDEX IF NOT EXISTS episodes_featured_idx ON episodes (featured);
CREATE INDEX IF NOT EXISTS episodes_thumbnail_idx ON episodes (thumbnail_id);

CREATE TABLE IF NOT EXISTS episodes_key_takeaways (
  _order INTEGER NOT NULL,
  _parent_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  id TEXT PRIMARY KEY NOT NULL,
  takeaway TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS episodes_takeaways_parent_idx ON episodes_key_takeaways (_parent_id);

CREATE TABLE IF NOT EXISTS episodes_quotes (
  _order INTEGER NOT NULL,
  _parent_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  id TEXT PRIMARY KEY NOT NULL,
  quote TEXT NOT NULL,
  speaker TEXT
);

CREATE INDEX IF NOT EXISTS episodes_quotes_parent_idx ON episodes_quotes (_parent_id);

CREATE TABLE IF NOT EXISTS episodes_tags (
  _order INTEGER NOT NULL,
  _parent_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  id TEXT PRIMARY KEY NOT NULL,
  tag TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS episodes_tags_parent_idx ON episodes_tags (_parent_id);

CREATE TABLE IF NOT EXISTS episodes_rels (
  id SERIAL PRIMARY KEY,
  "order" INTEGER,
  parent_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  guests_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
  topics_id INTEGER REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS episodes_rels_parent_idx ON episodes_rels (parent_id);
CREATE INDEX IF NOT EXISTS episodes_rels_guests_idx ON episodes_rels (guests_id);
CREATE INDEX IF NOT EXISTS episodes_rels_topics_idx ON episodes_rels (topics_id);
CREATE INDEX IF NOT EXISTS episodes_rels_path_idx ON episodes_rels (path);

-- 6. Site Settings (Global singleton)
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  brand_name TEXT,
  tagline TEXT,
  publisher_name TEXT,
  publisher_url TEXT,
  attribution TEXT,
  logo_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  default_og_image_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  hero_headline TEXT,
  hero_mission TEXT,
  featured_episode_override_id INTEGER REFERENCES episodes(id) ON DELETE SET NULL,
  about_mission TEXT,
  about_audience TEXT,
  about_editorial TEXT,
  has_host_section INTEGER DEFAULT 0,
  host_name TEXT,
  host_role TEXT,
  host_bio TEXT,
  host_portrait_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  youtube_channel_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  spotify_url TEXT,
  apple_podcasts_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  nomination_recipient_email TEXT,
  nomination_webhook_url TEXT,
  analytics_id TEXT,
  privacy_policy_content TEXT,
  terms_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_settings_logo_idx ON site_settings (logo_id);
CREATE INDEX IF NOT EXISTS site_settings_default_og_idx ON site_settings (default_og_image_id);
CREATE INDEX IF NOT EXISTS site_settings_host_portrait_idx ON site_settings (host_portrait_id);

-- 7. Redirects
CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  "from" TEXT UNIQUE NOT NULL,
  "to" TEXT NOT NULL,
  type TEXT DEFAULT '301',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS redirects_from_idx ON redirects ("from");

-- 8. Nominations
CREATE TABLE IF NOT EXISTS nominations (
  id SERIAL PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_role_company TEXT,
  profile_link TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  internal_notes TEXT,
  name TEXT,
  email TEXT,
  consent INTEGER DEFAULT 1,
  consent_timestamp TEXT,
  email_delivery_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nominations_status_idx ON nominations (status);
CREATE INDEX IF NOT EXISTS nominations_created_at_idx ON nominations (created_at);

-- 9. Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'unread',
  consent INTEGER DEFAULT 1,
  consent_timestamp TEXT,
  email_delivery_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages (status);
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx ON contact_messages (created_at);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
