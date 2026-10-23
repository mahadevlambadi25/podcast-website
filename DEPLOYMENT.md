# Production Deployment Guide: Unchartered Podcast Website

This guide documents the production deployment of the **Unchartered: Legends & Legacies** podcast platform on **Render** with **Supabase PostgreSQL** or **Render PostgreSQL**.

---

## 1. Architecture Overview

- **Frontend & Admin Platform**: Next.js 15 (App Router, Server Actions, React 19)
- **Database Engine**: PostgreSQL 14+ (hosted on Supabase or Render)
- **Database Driver**: `pg` (Node Postgres Connection Pool) with automatic SSL negotiation
- **Media Storage**: Render Persistent Disk mounted at `/app/media` (with Next.js streaming route `/media/[...filename]`)
- **Background Cron**: Scheduled publishing runner triggering `POST /api/cron/publish` every 10 minutes

---

## 2. Environment Variables

Configure these environment variables in your Render Web Service dashboard:

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production`. |
| `PORT` | Yes | Defaults to `10000` on Render. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public domain URL (e.g., `https://unchartered.onrender.com`). |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string (Supabase or Render). |
| `SESSION_SECRET` | Yes | 64-character cryptographic random hex key for HMAC-SHA256 session cookies. |
| `CRON_SECRET` | Yes | Secret token protecting the scheduled episode publishing endpoint. |
| `ADMIN_EMAIL` | Optional | Email for initial admin account bootstrapping on a fresh database. |
| `ADMIN_PASSWORD` | Optional | Strong password for initial admin (min 8 chars, 1 letter, 1 number, 1 special char). |
| `NOMINATION_RECIPIENT_EMAIL` | Optional | Recipient email for leader nomination notifications. |
| `RESEND_API_KEY` | Optional | API key for transactional emails via Resend. |
| `AWS_REGION` | Optional (Production) | AWS region for S3 media storage (e.g., `ap-south-1`). |
| `AWS_S3_BUCKET` | Optional (Production) | Private S3 bucket name (e.g., `podcast-media-mahadev-2026`). |
| `AWS_ACCESS_KEY_ID` | Optional (Production) | AWS IAM Access Key ID for S3 operations. |
| `AWS_SECRET_ACCESS_KEY` | Optional (Production) | AWS IAM Secret Access Key for S3 operations. |
| `S3_ENABLED` | Optional | Set to `true` to explicitly enforce S3 uploads (or auto-detected when credentials provided). |

---

## 3. Database Migration & Supabase Configuration

### Startup Migration Command
Render executes startup migrations automatically before launching the web server:
```bash
node ./scripts/migrate-postgres.mjs && npm run start
```

### Supabase Connection String
When using Supabase, obtain the connection string from your Supabase Project Settings (**Database -> Connection String**).
- **Direct Connection**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require`
- **Transaction Pooler (Port 6543)**: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require`

### Safe, Idempotent Migrations
The migration runner in `scripts/migrate-postgres.mjs`:
1. Creates and tracks versions in the `schema_migrations` table.
2. Uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` so existing production data is **never dropped or lost**.
3. Safely syncs `guests.biography` <-> `guests.bio` and social links.
4. Ensures all metadata columns across `guests`, `media`, `episodes`, `site_settings`, `nominations`, and `contact_messages` exist.
5. Seeds baseline podcast episodes only if the database is brand new (0 settings and 0 episodes).
6. Preserves existing admin passwords and users.

---

## 4. Media Library & Storage Architecture

The platform supports a dual-tier media storage architecture:

### 4.1 AWS S3 Media Storage (Production Default)
- **Private S3 Bucket**: Objects remain completely private (`Block Public Access` enabled).
- **Secure Streaming**: Media is served via `/media/[...filename]` route, which streams directly from S3 using server-side AWS credentials.
- **Cache-Control**: `public, max-age=31536000, immutable` with HTTP 304 ETag validation.
- **Local Cache Mirroring**: When media is uploaded or served, it can be mirrored to the local cache directory (`MEDIA_STORAGE_DIR`) for instant subsequent retrieval.

To configure on Render:
1. In the Web Service Environment Variables, add:
   - `AWS_REGION`: `ap-south-1`
   - `AWS_S3_BUCKET`: `podcast-media-mahadev-2026`
   - `AWS_ACCESS_KEY_ID`: `<YOUR_IAM_ACCESS_KEY_ID>`
   - `AWS_SECRET_ACCESS_KEY`: `<YOUR_IAM_SECRET_ACCESS_KEY>`
   - `S3_ENABLED`: `true`

### 4.2 Render Persistent Disk (Local Fallback & Dev)
Render containers have an ephemeral filesystem by default. When S3 is not configured:
1. In Render, go to your Web Service -> **Disks** -> **Add Disk**:
   - **Name**: `unchartered-media-uploads`
   - **Mount Path**: `/var/data/media`
   - **Size**: 10 GB (or as required)
2. The platform automatically serves files from `/var/data/media` or local storage directories.

---

## 5. Verification Checklist

Before publishing:
1. `npm run test`: All test suites passing.
2. `npx tsc --noEmit`: Zero TypeScript compilation errors.
3. `npm run build`: Production bundle builds successfully.
4. Log into Admin Portal at `/admin/login`.
5. Open `/admin/guests`: Confirm guest edit/create works without `biography` column errors.
6. Open `/admin/media`: Confirm media assets list, image previews load, and uploads succeed.
