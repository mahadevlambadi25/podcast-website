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
| `CONTACT_RECIPIENT_EMAIL` | Optional | Recipient email for contact form submissions. |
| `RESEND_API_KEY` | Optional | API key for transactional emails via Resend. |

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

## 4. Media Library & Persistent Disk Storage

Render containers have an ephemeral filesystem by default. To preserve uploaded media across redeploys:

1. In Render, go to your Web Service -> **Disks** -> **Add Disk**:
   - **Name**: `unchartered-media-uploads`
   - **Mount Path**: `/app/media`
   - **Size**: 10 GB (or as required)
2. The platform automatically serves files from `/app/media` via the route handler:
   - Route: `/media/[...filename]`
   - Cache-Control: `public, max-age=31536000, immutable`
   - Supported Formats: JPEG, PNG, WebP, SVG, AVIF, MP3, WAV, M4A, MP4, WebM

---

## 5. Verification Checklist

Before publishing:
1. `npm run test`: All test suites passing.
2. `npx tsc --noEmit`: Zero TypeScript compilation errors.
3. `npm run build`: Production bundle builds successfully.
4. Log into Admin Portal at `/admin/login`.
5. Open `/admin/guests`: Confirm guest edit/create works without `biography` column errors.
6. Open `/admin/media`: Confirm media assets list, image previews load, and uploads succeed.
