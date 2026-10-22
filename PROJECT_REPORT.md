# Production Architecture & AWS Migration Inventory Report

**Project**: Unchartered — Legends & Legacies (Podcast Platform)  
**Repository**: `mahadevlambadi25/podcast-website`  
**Analysis Mode**: Read-Only Architecture Audit  
**Date**: October 2026  

---

## Executive Summary

This report provides a comprehensive, production-grade technical inventory of the **Unchartered: Legends & Legacies** podcast platform to prepare for an enterprise deployment on **Amazon Web Services (AWS)**.

The application is a modern, high-performance **Next.js 15 (App Router)** platform with an integrated custom Content Management System (CMS), pure **PostgreSQL** persistence via the native `pg` pool driver, server-side streaming media handlers, and responsive editorial UI components.

---

## 1. Tech Stack

### 1.1 Frontend Framework & Libraries
- **Framework**: Next.js `15.3.9` (`App Router`, Server Actions, Dynamic API Route Handlers)
  - *Location*: [`package.json`](package.json#L23)
- **Core Runtime**: React `19.0.1` and React DOM `19.0.1`
  - *Location*: [`package.json`](package.json#L25-L26)
- **Styling**: Tailwind CSS `^3.4.17` with PostCSS `^8.4.49` and Autoprefixer `^10.4.20`
  - *Locations*: [`tailwind.config.ts`](tailwind.config.ts), [`postcss.config.mjs`](postcss.config.mjs), [`src/app/globals.css`](src/app/globals.css)
- **Design System**: Editorial Neumorphic and Glassmorphic custom CSS tokens, utilizing Google Fonts (`Fraunces` editorial serif and `Inter` sans-serif via `next/font/google` with `display: swap`).
  - *Location*: [`src/app/(frontend)/layout.tsx`](src/app/(frontend)/layout.tsx#L12-L23)
- **Iconography**: Lucide React `^0.475.0`
  - *Location*: [`package.json`](package.json#L22)
- **Image Processing**: Sharp `^0.33.5`
  - *Location*: [`package.json`](package.json#L28)
- **Language**: TypeScript `^5.7.3`
  - *Locations*: [`tsconfig.json`](tsconfig.json), [`package.json`](package.json#L44)

### 1.2 Backend Framework & Node.js Version
- **Backend Architecture**: Embedded Next.js Route Handlers (`src/app/api/*`) executing in Node.js server runtime.
- **Node.js Target Version**:
  - **Docker Engine**: Node.js `22-alpine` (`node:22-alpine AS base` in [`Dockerfile`](Dockerfile#L2)).
  - **Type Definitions**: `@types/node` `^22.13.4` in [`package.json`](package.json#L33).
  - Compatible with Node.js `20.x LTS` and `22.x LTS`.
  - *Recommendation*: Add an explicit `"engines": { "node": ">=20.0.0 <23.0.0" }` block in `package.json` for AWS Elastic Beanstalk and App Runner runtime validation.

### 1.3 Commands & Ports
- **Build Command**: `npm run build` (executes `next build`)
  - *Location*: [`package.json`](package.json#L8)
- **Start Command**: `npm run start` (executes `next start`)
  - *Location*: [`package.json`](package.json#L9)
- **Container Production Command**: `node ./scripts/migrate-postgres.mjs && npm run start`
  - Automatically runs idempotent versioned migrations before starting the web server.
  - *Locations*: [`Dockerfile`](Dockerfile#L44), [`render.yaml`](render.yaml#L14)
- **Application Port**:
  - **Default Local Port**: `3000` (e.g. `http://localhost:3000`).
  - **Docker Container**: Exposes port `3000` (`EXPOSE 3000`, `ENV PORT=3000` in [`Dockerfile`](Dockerfile#L25,L42)).
  - **Configurable Port**: Driven by `process.env.PORT` (defaults to `3000` in [`src/env.ts`](src/env.ts#L5)).

---

## 2. Database

### 2.1 Database Engine & Connection Library
- **Database Engine**: PostgreSQL 14+ (compatible with PostgreSQL 14, 15, 16, AWS RDS PostgreSQL, AWS Aurora Serverless v2, Supabase, and Render PostgreSQL).
- **Client Driver**: Native Node-Postgres `pg` `^8.23.1` with `pg-connection-string`.
  - *Location*: [`package.json`](package.json#L24)
- **ORM / Query Builder**: None (pure SQL client abstraction).
  - Located in [`src/lib/db/client.ts`](src/lib/db/client.ts).
  - Provides parameterized query execution, SQLite dialect adaptation (`?` -> `$1, $2`), automatic `RETURNING id` append for inserts, and atomic transaction support (`db.transaction()`).

### 2.2 Connection Management, Pooling & SSL
- **Environment Variable**: `DATABASE_URL` (with fallback to `DATABASE_URI`).
  - *Location*: [`src/lib/db/client.ts`](src/lib/db/client.ts#L61-L72)
- **Connection Pooling**:
  - Global singleton connection pool (`globalThis.dbPool`) to prevent connection leakage across Next.js API route invocations.
  - Pool size: Default `5` connections, configurable via `DB_POOL_MAX` between `1` and `7`.
  - Timeouts: `idleTimeoutMillis: 10000`, `connectionTimeoutMillis: 10000`, `allowExitOnIdle: true`.
  - *Location*: [`src/lib/db/client.ts`](src/lib/db/client.ts#L115-L156)
- **SSL Configuration**:
  - Function `getSslConfig()` in [`src/lib/db/client.ts`](src/lib/db/client.ts#L74-L113).
  - Automatically activates TLS if `sslmode=require` is present in the connection string or when running in production/cloud environments (excluding `localhost` / `127.0.0.1`).
  - Supports custom CA certificates via `DATABASE_CA_CERT`, `SUPABASE_CA_CERT`, `PGSSLROOTCERT`, or `./certs/supabase-ca.crt`.
  - Defaults to encrypted TLS transit (`{ rejectUnauthorized: false }`) when custom CA certificates are omitted.

### 2.3 Schema Definition & Complete Table Inventory
- **Schema DDL**: [`scripts/schema-postgres.sql`](scripts/schema-postgres.sql) (337 lines).
- **Migration Runner**: [`scripts/migrate-postgres.mjs`](scripts/migrate-postgres.mjs) (versioned idempotent runner tracking migrations in `schema_migrations`).

#### Table Catalog (19 Tables)
| # | Table Name | Key Columns | Purpose |
|---|---|---|---|
| 1 | `schema_migrations` | `id`, `version`, `name`, `applied_at` | Tracks versioned schema migrations |
| 2 | `users` | `id`, `email`, `role`, `salt`, `hash`, `login_attempts`, `lock_until`, `reset_password_token`, `reset_password_expiration`, `created_at`, `updated_at` | Admin and editor user accounts with PBKDF2 credentials |
| 3 | `users_sessions` | `id`, `user_id`, `token`, `expires_at`, `created_at` | Database-backed session store |
| 4 | `media` | `id`, `filename`, `url`, `thumbnail_url`, `thumbnail_u_r_l`, `mime_type`, `filesize`, `width`, `height`, `focal_x`, `focal_y`, `alt`, `caption`, `sizes_thumbnail_url`, `sizes_portrait_url`, `sizes_og_url`, `data_base64`, `created_at`, `updated_at` | Media upload metadata, responsive dimensions, and durable base64 asset fallback |
| 5 | `topics` | `id`, `name`, `slug`, `description`, `created_at`, `updated_at` | Taxonomy themes and episode categories |
| 6 | `guests` | `id`, `full_name`, `slug`, `role`, `company`, `short_overview`, `biography`, `bio`, `portrait_id`, `portrait_alt`, `portrait_credit`, `links_linkedin`, `links_website`, `linkedin_url`, `twitter_url`, `website_url`, `social_image_id`, `featured`, `status`, `seo_title`, `seo_description`, `canonical_override`, `created_at`, `updated_at` | Executive guest leader profiles |
| 7 | `guests_alternate_names` | `id`, `_order`, `_parent_id`, `name` | Alternate spellings/search aliases for guests |
| 8 | `guests_key_insights` | `id`, `_order`, `_parent_id`, `quote`, `context` | Curated editorial executive quotes per guest |
| 9 | `guests_rels` | `id`, `order`, `parent_id`, `path`, `topics_id` | Join table connecting guests to topics |
| 10 | `episodes` | `id`, `title`, `slug`, `youtube_url`, `youtube_video_id`, `fallback_watch_url`, `short_summary`, `description`, `thumbnail_id`, `episode_number`, `season`, `published_at`, `transcript`, `featured`, `status`, `seo_title`, `seo_description`, `canonical_override`, `created_at`, `updated_at` | Core podcast episode records and publishing status |
| 11 | `episodes_key_takeaways` | `id`, `_order`, `_parent_id`, `takeaway` | Executive takeaways list for episode detail pages |
| 12 | `episodes_quotes` | `id`, `_order`, `_parent_id`, `quote`, `speaker` | Highlight quotes extracted from conversations |
| 13 | `episodes_tags` | `id`, `_order`, `_parent_id`, `tag` | Episode searchable tag labels |
| 14 | `episodes_rels` | `id`, `order`, `parent_id`, `path`, `guests_id`, `topics_id` | Join table connecting episodes to guests and topics |
| 15 | `site_settings` | `id`, `brand_name`, `tagline`, `publisher_name`, `publisher_url`, `attribution`, `logo_id`, `default_og_image_id`, `hero_headline`, `hero_mission`, `featured_episode_override_id`, `about_mission`, `about_audience`, `about_editorial`, `has_host_section`, `host_name`, `host_role`, `host_bio`, `host_portrait_id`, `youtube_channel_url`, `linkedin_url`, `twitter_url`, `spotify_url`, `apple_podcasts_url`, `contact_email`, `contact_phone`, `contact_address`, `nomination_recipient_email`, `nomination_webhook_url`, `analytics_id`, `privacy_policy_content`, `terms_content`, `created_at`, `updated_at` | Global singleton portal branding and metadata |
| 16 | `redirects` | `id`, `from`, `to`, `type`, `created_at`, `updated_at` | Custom 301/308 URL redirect rules |
| 17 | `nominations` | `id`, `guest_name`, `guest_role_company`, `profile_link`, `reason`, `status`, `internal_notes`, `name`, `email`, `consent`, `consent_timestamp`, `email_delivery_failed`, `created_at`, `updated_at` | Leader nomination submissions from audience |
| 18 | `contact_messages` | `id`, `name`, `email`, `message`, `subject`, `status`, `consent`, `consent_timestamp`, `email_delivery_failed`, `created_at`, `updated_at` | Audience contact inquiries |
| 19 | `audit_logs` | `id`, `user_id`, `user_email`, `action`, `entity`, `entity_id`, `details`, `created_at` | Admin action audit trail |

### 2.4 Supabase vs. Plain AWS RDS PostgreSQL Evaluation
- **Supabase-Specific Features**: **NONE**.
  - No `@supabase/supabase-js` SDK is used in the app.
  - No Supabase Auth (the app uses its own PBKDF2 + HMAC session cookies).
  - No Supabase Storage SDK (uses local disk and DB base64 fallback).
  - No Supabase Realtime or WebSockets.
  - No Row Level Security (RLS) policies.
  - No proprietary PostgreSQL extensions required.
- **AWS RDS Compatibility**: **100% Out of the Box**. The schema and queries use standard ANSI PostgreSQL features fully supported by standard AWS RDS PostgreSQL and AWS Aurora PostgreSQL.

### 2.5 Seed & Migration Scripts
- **`npm run seed`**: Executes [`scripts/seed.ts`](scripts/seed.ts) -> runs `runPostgresMigrations()` in [`scripts/migrate-postgres.mjs`](scripts/migrate-postgres.mjs). If the database has 0 site settings, it loads baseline data from [`scripts/init-data.json`](scripts/init-data.json).
- **`npm run seed:clean`**: Executes [`scripts/seed-clean.ts`](scripts/seed-clean.ts) to purge sample demo episodes and guests from the database.
- **`npm run admin:setup`**: Executes [`scripts/setup-admin.ts`](scripts/setup-admin.ts) to list, create, unlock, or update administrator passwords.

---

## 3. File and Media Handling

### 3.1 Media Uploads & Formats
- **Upload Route**: `POST /api/admin/media` in [`src/app/api/admin/media/route.ts`](src/app/api/admin/media/route.ts).
- **Allowed MIME Types**:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `image/avif`.
  - Audio: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-m4a`.
  - Video: `video/mp4`, `video/webm`.
  - Document: `application/pdf` (supported in streaming route).
- **File Size Limit**: `50 MB` (`MAX_FILE_SIZE = 50 * 1024 * 1024` in [`src/app/api/admin/media/route.ts`](src/app/api/admin/media/route.ts#L29)).

### 3.2 Current Storage Mechanism
Media storage currently operates on a **hybrid dual-layer strategy**:
1. **Local Persistent Filesystem**:
   - Implemented in [`src/lib/storage.ts`](src/lib/storage.ts).
   - Priority sequence: `process.env.MEDIA_STORAGE_DIR` -> `/var/data/media` -> `/app/media` -> `./media` -> `./public/media`.
2. **PostgreSQL Base64 Durable Fallback**:
   - When a file is uploaded, the buffer is stored in `media.data_base64` in PostgreSQL.
3. **Media Streaming Handler**:
   - `GET /media/[...filename]` in [`src/app/media/[...filename]/route.ts`](src/app/media/[...filename]/route.ts).
   - Checks local disk first; if missing (e.g. fresh ephemeral container), reads from `media.data_base64`, streams with `Cache-Control: public, max-age=31536000, immutable`, and asynchronously writes to disk cache.

### 3.3 Podcast Audio & Video Delivery
- Podcast episodes primarily use **YouTube Privacy-Enhanced embeds** (`www.youtube-nocookie.com`) via [`src/components/YouTubeFacade.tsx`](src/components/YouTubeFacade.tsx) using the `youtube_video_id` column.
- Audio and cover images are referenced via `thumbnail_id` foreign key pointing to `media.id`.

### 3.4 S3 Readiness
- Variables for S3 exist in [`src/env.ts`](src/env.ts#L46-L50) (`S3_ENABLED`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`).
- S3 upload logic is **not yet wired into** [`src/lib/storage.ts`](src/lib/storage.ts).
- *Recommendation for AWS*: Implement `@aws-sdk/client-s3` in `src/lib/storage.ts` so uploads stream directly to an AWS S3 bucket backed by CloudFront.

---

## 4. Environment Variables and Secrets

### 4.1 Complete Environment Variable Catalog

| Variable Name | Required | Default / Fallback | Purpose |
|---|---|---|---|
| `NODE_ENV` | Optional | `development` | Node runtime environment (`development`, `production`, `test`) |
| `PORT` | Optional | `3000` | Port for the HTTP server to listen on |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` | Canonical production site URL (e.g. `https://uncharteredpodcast.com`) |
| `DATABASE_URL` | Yes | None | Full PostgreSQL connection string |
| `DATABASE_URI` | Optional | None | Alternative alias for `DATABASE_URL` |
| `DB_POOL_MAX` | Optional | `5` | Maximum active PostgreSQL pool connections (capped at 7) |
| `SESSION_SECRET` | Yes | None | 64-char hex key for signing HMAC-SHA256 session cookies |
| `PAYLOAD_SECRET` | Optional | None | Legacy fallback key for session token signing |
| `CRON_SECRET` | Yes | None | Secret Bearer token protecting `POST /api/cron/publish` |
| `ADMIN_EMAIL` | Optional | None | Initial admin email address for automatic bootstrapping |
| `ADMIN_PASSWORD` | Optional | None | Initial admin password (min 8 chars, 1 letter, 1 number, 1 symbol) |
| `SEED_ADMIN_EMAIL` | Optional | None | Alias for initial admin email |
| `SEED_ADMIN_PASSWORD` | Optional | None | Alias for initial admin password |
| `SEED_DEMO` | Optional | `false` | Flag to trigger demo content seeding |
| `MEDIA_STORAGE_DIR` | Optional | `/var/data/media` | Filesystem directory path for uploaded media storage |
| `RESEND_API_KEY` | Optional | None | API key for transactional emails via Resend |
| `SMTP_FROM` | Optional | `notifications@uncharteredpodcast.com` | "From" address for notification emails |
| `NOMINATION_RECIPIENT_EMAIL` | Optional | None | Recipient email for guest nomination alerts |
| `CONTACT_RECIPIENT_EMAIL` | Optional | None | Recipient email for contact form alerts |
| `NOMINATION_WEBHOOK_URL` | Optional | None | Webhook endpoint (Slack/Zapier/HubSpot) for new nominations |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`| Optional | None | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`) |
| `UPSTASH_REDIS_REST_URL` | Optional | None | Upstash Redis REST endpoint for distributed rate-limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | None | Upstash Redis REST authentication token |
| `S3_ENABLED` | Optional | `false` | Flag to enable AWS S3 object storage |
| `S3_BUCKET` | Optional | None | AWS S3 bucket name |
| `S3_REGION` | Optional | `us-east-1` | AWS S3 region |
| `S3_ACCESS_KEY_ID` | Optional | None | AWS IAM Access Key ID for S3 |
| `S3_SECRET_ACCESS_KEY` | Optional | None | AWS IAM Secret Access Key for S3 |
| `DATABASE_CA_CERT` / `PGSSLROOTCERT` | Optional | None | Path to custom PostgreSQL Root CA certificate file |

### 4.2 Security Audit & Hardcoded Values Found
1. **Hardcoded Fallback Secret in Development**:
   - In [`src/lib/auth/session.ts`](src/lib/auth/session.ts#L12), if neither `SESSION_SECRET` nor `PAYLOAD_SECRET` is set, it falls back to `'unchartered-portal-dev-secret-key-at-least-32-characters-long'`.
   - *Fix for AWS*: Ensure `SESSION_SECRET` is strictly enforced in AWS Secrets Manager or Parameter Store.
2. **Build-Time Placeholder Cron Secret**:
   - In [`src/env.ts`](src/env.ts#L21), `CRON_SECRET` has a default placeholder `'build-placeholder-cron-secret-1234'` to allow `next build` to complete.
3. **Hardcoded Test Script Password**:
   - In [`scripts/test-admin-suite.ts`](scripts/test-admin-suite.ts#L35), `const adminPassword = process.env.ADMIN_PASSWORD || 'mahadev@123';` exists for local test automation. This is in a test script only, not in application runtime code.
4. **Hardcoded Localhost in Content Security Policy (CSP)**:
   - In [`next.config.mjs`](next.config.mjs#L76,L79), CSP includes `connect-src 'self' http://localhost:3000 http://127.0.0.1:3000` and `form-action 'self' http://localhost:3000 http://127.0.0.1:3000`.
   - *Fix for AWS*: Update CSP in `next.config.mjs` to dynamically include the production domain or allow `form-action 'self'`.
5. **.env Status in Version Control**:
   - `.gitignore` properly ignores `.env`, `.env*.local`, `.env.production`.
   - `.env.example` exists and contains sanitized documentation without active credentials.

---

## 5. Third-Party Services and APIs

1. **Authentication**:
   - Custom in-house authentication.
   - Password hashing: PBKDF2 with SHA-256 (600,000 iterations, 32-byte salt).
   - Session storage: Cryptographically signed HMAC-SHA256 session token stored in an HTTP-only, SameSite=Lax cookie (`unchartered_session`).
   - No external identity provider (Auth0/Clerk/Firebase) required.
2. **Transactional Email**:
   - **Resend** via `resend` SDK (`RESEND_API_KEY`).
   - Handled in [`src/utils/email.ts`](src/utils/email.ts) with exponential backoff retry.
   - If `RESEND_API_KEY` is omitted, it gracefully logs notifications to stdout without throwing errors.
3. **CRM / Webhook Dispatch**:
   - Webhook integration on nomination submission in [`src/app/api/nominations/route.ts`](src/app/api/nominations/route.ts#L97).
   - Dispatches JSON payloads to `NOMINATION_WEBHOOK_URL` (Slack, Zapier, Make, HubSpot).
4. **Analytics**:
   - **Google Analytics 4** (`gtag.js` script injection in [`src/components/Analytics.tsx`](src/components/Analytics.tsx)).
   - Fully gated by GDPR/ePrivacy compliant cookie banner ([`src/components/CookieBanner.tsx`](src/components/CookieBanner.tsx)). Scripts only load upon explicit consent.
5. **Video & Audio Delivery**:
   - **YouTube nocookie embeds** (`https://www.youtube-nocookie.com/embed/...`).
   - Platform links: External links to Spotify, Apple Podcasts, YouTube, LinkedIn, X/Twitter stored in `site_settings`.
6. **Rate Limiting**:
   - Optional **Upstash Redis REST API** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) in [`src/utils/rate-limit.ts`](src/utils/rate-limit.ts).
   - In-memory sliding window fallback when Redis credentials are not provided.
7. **Scheduled Publishing Cron**:
   - HTTP endpoint: `POST /api/cron/publish` in [`src/app/api/cron/publish/route.ts`](src/app/api/cron/publish/route.ts).
   - Protected by `Authorization: Bearer <CRON_SECRET>` with constant-time token comparison.

---

## 6. Deployment Readiness for AWS

### 6.1 Database Migration to AWS RDS
- The database requires **zero code or query changes**.
- Simply provision an **AWS RDS PostgreSQL 16** instance (or Aurora Serverless v2 PostgreSQL), create a database (e.g. `unchartered`), and set:
  ```env
  DATABASE_URL=postgresql://db_user:db_password@your-rds-endpoint.rds.amazonaws.com:5432/unchartered?sslmode=require
  ```
- The startup migration script (`scripts/migrate-postgres.mjs`) will automatically initialize all 19 tables, indexes, and constraints.

### 6.2 AWS Compute & Hosting Options
The application already has a production-ready, multi-stage [`Dockerfile`](Dockerfile) (`node:22-alpine`):

| AWS Service | Suitability | Notes |
|---|---|---|
| **AWS App Runner** | ⭐⭐⭐ **Recommended** | Fully managed container service. Connect directly to AWS ECR or GitHub repo. Auto-scales, manages SSL certificates, handles zero-downtime deployments. Set port to `3000`. |
| **AWS ECS (Fargate)** | ⭐⭐⭐ **Enterprise** | Serverless containers. Pair with Application Load Balancer (ALB). Health check path: `/api/health`. |
| **AWS Elastic Beanstalk** | ⭐⭐ **Alternative** | Select Docker platform or Node.js 20/22 platform. |
| **AWS Amplify Hosting** | ⭐⭐ **Alternative** | Next.js SSR hosting via AWS Amplify Gen 2. |

### 6.3 Media Storage: Moving to AWS S3 & CloudFront
- **Current Behavior**: Files are written to container disk (`/var/data/media`) and database base64 fallback.
- **AWS Best Practice**: Containers in AWS App Runner and ECS Fargate have ephemeral filesystems.
  - Create an S3 Bucket: `unchartered-podcast-media`.
  - Add AWS S3 client integration to [`src/lib/storage.ts`](src/lib/storage.ts) using `@aws-sdk/client-s3`.
  - Attach an Amazon CloudFront distribution in front of S3 for edge caching and fast global media playback.

### 6.4 Background Cron Job on AWS
- On Render, the cron job was executed via `render.yaml`.
- On AWS, configure:
  - **Amazon EventBridge (CloudWatch Events)** scheduled rule: trigger every 10 minutes (`rate(10 minutes)`).
  - Target: **API Destination** sending `POST https://yourdomain.com/api/cron/publish` with header `Authorization: Bearer <CRON_SECRET>`.

### 6.5 Health Check & Observability
- **Health Check Endpoint**: `GET /api/health` already exists in [`src/app/api/health/route.ts`](src/app/api/health/route.ts).
  - Returns `200` with `{ status: "ok", healthy: true, database: "connected" }`.
  - Configure your AWS ALB or App Runner health check path to `/api/health`.
- **Error Handling**: Custom `global-error.tsx`, `error.tsx`, and `not-found.tsx` are fully implemented.

---

## 7. Pre-Deployment AWS Checklist

- [ ] **1. Provision RDS PostgreSQL**:
  - Create RDS PostgreSQL 14, 15, or 16 instance.
  - Enable SSL (`sslmode=require`).
  - Configure Security Group inbound rule: Allow TCP port `5432` from the App Runner / ECS security group.
- [ ] **2. Configure AWS Secrets Manager or Parameter Store**:
  - `DATABASE_URL`: `postgresql://<user>:<password>@<rds-host>:5432/<dbname>?sslmode=require`
  - `SESSION_SECRET`: Generate a secure 64-char key (`openssl rand -hex 32`).
  - `CRON_SECRET`: Generate a secure 32-char key (`openssl rand -hex 16`).
  - `ADMIN_EMAIL` & `ADMIN_PASSWORD`: For initial admin user creation on fresh database.
  - `RESEND_API_KEY`: API key for notification emails.
  - `NEXT_PUBLIC_SITE_URL`: Production domain URL (e.g. `https://uncharteredpodcast.com`).
- [ ] **3. Update Content Security Policy (CSP)**:
  - In [`next.config.mjs`](next.config.mjs#L76,L79), replace hardcoded `localhost:3000` with dynamic host or your AWS production domain.
- [ ] **4. Build & Push Docker Image to Amazon ECR**:
  ```bash
  aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account_id>.dkr.ecr.<region>.amazonaws.com
  docker build -t unchartered-web .
  docker tag unchartered-web:latest <account_id>.dkr.ecr.<region>.amazonaws.com/unchartered-web:latest
  docker push <account_id>.dkr.ecr.<region>.amazonaws.com/unchartered-web:latest
  ```
- [ ] **5. Deploy to AWS App Runner or ECS**:
  - Point to the ECR image.
  - Port: `3000`.
  - Health check endpoint: `/api/health`.
- [ ] **6. Set Up Amazon EventBridge Cron**:
  - Target: `POST https://yourdomain.com/api/cron/publish` every 10 minutes with Bearer `CRON_SECRET`.
- [ ] **7. (Recommended) Configure S3 Bucket for Media**:
  - S3 bucket for uploads backed by CloudFront distribution for optimal video and image delivery.
