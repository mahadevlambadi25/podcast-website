import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`guests_alternate_names\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`guests_alternate_names_order_idx\` ON \`guests_alternate_names\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`guests_alternate_names_parent_id_idx\` ON \`guests_alternate_names\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`guests_key_insights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`quote\` text NOT NULL,
  	\`context\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`guests_key_insights_order_idx\` ON \`guests_key_insights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`guests_key_insights_parent_id_idx\` ON \`guests_key_insights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`guests\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`full_name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`role\` text NOT NULL,
  	\`company\` text,
  	\`short_overview\` text NOT NULL,
  	\`biography\` text NOT NULL,
  	\`portrait_id\` integer,
  	\`portrait_alt\` text,
  	\`portrait_credit\` text,
  	\`social_image_id\` integer,
  	\`links_linkedin\` text,
  	\`links_website\` text,
  	\`links_other\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`featured\` integer DEFAULT false,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`canonical_override\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`social_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`guests_slug_idx\` ON \`guests\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`guests_portrait_idx\` ON \`guests\` (\`portrait_id\`);`)
  await db.run(sql`CREATE INDEX \`guests_social_image_idx\` ON \`guests\` (\`social_image_id\`);`)
  await db.run(sql`CREATE INDEX \`guests_status_idx\` ON \`guests\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`guests_featured_idx\` ON \`guests\` (\`featured\`);`)
  await db.run(sql`CREATE INDEX \`guests_updated_at_idx\` ON \`guests\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`guests_created_at_idx\` ON \`guests\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`guests_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`topics_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`topics_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`guests_rels_order_idx\` ON \`guests_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`guests_rels_parent_idx\` ON \`guests_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`guests_rels_path_idx\` ON \`guests_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`guests_rels_topics_id_idx\` ON \`guests_rels\` (\`topics_id\`);`)
  await db.run(sql`CREATE TABLE \`episodes_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`episodes_tags_order_idx\` ON \`episodes_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`episodes_tags_parent_id_idx\` ON \`episodes_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`episodes_key_takeaways\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`takeaway\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`episodes_key_takeaways_order_idx\` ON \`episodes_key_takeaways\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`episodes_key_takeaways_parent_id_idx\` ON \`episodes_key_takeaways\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`episodes_quotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`quote\` text NOT NULL,
  	\`speaker\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`episodes_quotes_order_idx\` ON \`episodes_quotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`episodes_quotes_parent_id_idx\` ON \`episodes_quotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`episodes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`episode_number\` numeric,
  	\`season\` numeric,
  	\`short_summary\` text NOT NULL,
  	\`youtube_url\` text,
  	\`youtube_video_id\` text,
  	\`fallback_watch_url\` text,
  	\`thumbnail_id\` integer,
  	\`description\` text NOT NULL,
  	\`transcript\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`featured\` integer DEFAULT false,
  	\`published_at\` text NOT NULL,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`canonical_override\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`thumbnail_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`episodes_title_idx\` ON \`episodes\` (\`title\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`episodes_slug_idx\` ON \`episodes\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`episodes_thumbnail_idx\` ON \`episodes\` (\`thumbnail_id\`);`)
  await db.run(sql`CREATE INDEX \`episodes_status_idx\` ON \`episodes\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`episodes_featured_idx\` ON \`episodes\` (\`featured\`);`)
  await db.run(sql`CREATE INDEX \`episodes_published_at_idx\` ON \`episodes\` (\`published_at\`);`)
  await db.run(sql`CREATE INDEX \`episodes_updated_at_idx\` ON \`episodes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`episodes_created_at_idx\` ON \`episodes\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`episodes_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`guests_id\` integer,
  	\`topics_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`guests_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`topics_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`episodes_rels_order_idx\` ON \`episodes_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`episodes_rels_parent_idx\` ON \`episodes_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`episodes_rels_path_idx\` ON \`episodes_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`episodes_rels_guests_id_idx\` ON \`episodes_rels\` (\`guests_id\`);`)
  await db.run(sql`CREATE INDEX \`episodes_rels_topics_id_idx\` ON \`episodes_rels\` (\`topics_id\`);`)
  await db.run(sql`CREATE TABLE \`topics\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`topics_name_idx\` ON \`topics\` (\`name\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`topics_slug_idx\` ON \`topics\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`topics_updated_at_idx\` ON \`topics\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`topics_created_at_idx\` ON \`topics\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from\` text NOT NULL,
  	\`to\` text NOT NULL,
  	\`type\` text DEFAULT '301' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`nominations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`guest_name\` text NOT NULL,
  	\`guest_role_company\` text,
  	\`profile_link\` text,
  	\`reason\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`internal_notes\` text,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`consent\` integer DEFAULT false NOT NULL,
  	\`consent_timestamp\` text,
  	\`email_delivery_failed\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`nominations_updated_at_idx\` ON \`nominations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`nominations_created_at_idx\` ON \`nominations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`contact_messages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`message\` text NOT NULL,
  	\`consent\` integer DEFAULT true,
  	\`consent_timestamp\` text,
  	\`email_delivery_failed\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_messages_updated_at_idx\` ON \`contact_messages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contact_messages_created_at_idx\` ON \`contact_messages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`caption\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_portrait_url\` text,
  	\`sizes_portrait_width\` numeric,
  	\`sizes_portrait_height\` numeric,
  	\`sizes_portrait_mime_type\` text,
  	\`sizes_portrait_filesize\` numeric,
  	\`sizes_portrait_filename\` text,
  	\`sizes_og_url\` text,
  	\`sizes_og_width\` numeric,
  	\`sizes_og_height\` numeric,
  	\`sizes_og_mime_type\` text,
  	\`sizes_og_filesize\` numeric,
  	\`sizes_og_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_portrait_sizes_portrait_filename_idx\` ON \`media\` (\`sizes_portrait_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_og_sizes_og_filename_idx\` ON \`media\` (\`sizes_og_filename\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`guests_id\` integer,
  	\`episodes_id\` integer,
  	\`topics_id\` integer,
  	\`redirects_id\` integer,
  	\`nominations_id\` integer,
  	\`contact_messages_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`guests_id\`) REFERENCES \`guests\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`episodes_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`topics_id\`) REFERENCES \`topics\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`nominations_id\`) REFERENCES \`nominations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`contact_messages_id\`) REFERENCES \`contact_messages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_guests_id_idx\` ON \`payload_locked_documents_rels\` (\`guests_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_episodes_id_idx\` ON \`payload_locked_documents_rels\` (\`episodes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_topics_id_idx\` ON \`payload_locked_documents_rels\` (\`topics_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_nominations_id_idx\` ON \`payload_locked_documents_rels\` (\`nominations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contact_messages_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_messages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`brand_name\` text,
  	\`tagline\` text,
  	\`publisher_name\` text,
  	\`publisher_url\` text,
  	\`attribution\` text,
  	\`logo_id\` integer,
  	\`default_og_image_id\` integer,
  	\`hero_headline\` text,
  	\`hero_mission\` text,
  	\`featured_episode_override_id\` integer,
  	\`about_mission\` text,
  	\`about_audience\` text,
  	\`about_editorial\` text,
  	\`has_host_section\` integer DEFAULT false,
  	\`host_name\` text,
  	\`host_role\` text,
  	\`host_bio\` text,
  	\`host_portrait_id\` integer,
  	\`youtube_channel_url\` text,
  	\`linkedin_url\` text,
  	\`twitter_url\` text,
  	\`spotify_url\` text,
  	\`apple_podcasts_url\` text,
  	\`contact_email\` text,
  	\`contact_phone\` text,
  	\`contact_address\` text,
  	\`nomination_recipient_email\` text,
  	\`nomination_webhook_url\` text,
  	\`analytics_id\` text,
  	\`privacy_policy_content\` text,
  	\`terms_content\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`default_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_episode_override_id\`) REFERENCES \`episodes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`host_portrait_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_default_og_image_idx\` ON \`site_settings\` (\`default_og_image_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_featured_episode_override_idx\` ON \`site_settings\` (\`featured_episode_override_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_host_portrait_idx\` ON \`site_settings\` (\`host_portrait_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`guests_alternate_names\`;`)
  await db.run(sql`DROP TABLE \`guests_key_insights\`;`)
  await db.run(sql`DROP TABLE \`guests\`;`)
  await db.run(sql`DROP TABLE \`guests_rels\`;`)
  await db.run(sql`DROP TABLE \`episodes_tags\`;`)
  await db.run(sql`DROP TABLE \`episodes_key_takeaways\`;`)
  await db.run(sql`DROP TABLE \`episodes_quotes\`;`)
  await db.run(sql`DROP TABLE \`episodes\`;`)
  await db.run(sql`DROP TABLE \`episodes_rels\`;`)
  await db.run(sql`DROP TABLE \`topics\`;`)
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`DROP TABLE \`nominations\`;`)
  await db.run(sql`DROP TABLE \`contact_messages\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
}
