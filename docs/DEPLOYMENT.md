# Production Deployment & Hosting Guide — "Unchartered: Legends & Legacies"

**Project:** Unchartered: Legends & Legacies — Podcast Platform & Custom CMS  
**Stack:** Next.js 15.3.9 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, `@libsql/client` (SQLite/LibSQL)  
**Architecture:** Unified Full-Stack Application (Public Website + Custom Editorial CMS + Direct Database API)

---

## 1. Architecture Overview

Unchartered is built as a cohesive, full-stack Next.js 15 application. It combines:
- **Public Website (`src/app/(frontend)/`):** SEO-optimized, accessible, fast SSR/ISR pages for episodes, leader profiles, topics, nominations, and search.
- **Editorial CMS (`src/app/admin/`):** Custom high-contrast Editorial dashboard with role-based access control, PBKDF2 authentication, and full CRUD for episodes, guests, topics, media, nominations, and site settings.
- **Backend Services Layer (`src/services/`):** Parameterized, direct SQL access via `@libsql/client`, eliminating CMS overhead and external latency.
- **REST APIs (`src/app/api/`):** Modular endpoints for authentication, admin operations, audience submissions, search, OG image generation, health checks, and scheduled publishing.

---

## 2. Database & Storage Architecture

### 2.1 Database Engine (`@libsql/client`)
The application uses the LibSQL database driver, compatible with both local SQLite files (`file:./payload.db`) and remote distributed LibSQL instances (such as [Turso](https://turso.tech)).

> [!WARNING]
> **Serverless Filesystem Ephemerality**  
> Serverless platforms (e.g., standard Vercel or Netlify serverless functions) spin down and recreate execution sandboxes. Local file writes to `payload.db` will **not persist** across cold starts and redeployments on serverless hosts.

### 2.2 Recommended Database Strategies

| Strategy | Hosting Platform | How It Works | Persistence Guarantee |
| :--- | :--- | :--- | :---: |
| **Managed LibSQL (Turso)** *(Recommended)* | Vercel, Netlify, Render, or Fly.io | Point `DATABASE_URI=libsql://[your-db].turso.io` with `DATABASE_AUTH_TOKEN`. Uses exact same code. | **100% Persistent** (Edge-distributed, automated backups) |
| **Persistent Container Volume** | Render, Fly.io, Railway, or Docker | Mount a disk volume to `/app/data` and configure `DATABASE_URI=file:/app/data/payload.db`. | **100% Persistent** across redeployments |
| **Local SQLite File** | Dedicated VPS / Single Linux Server | Runs directly against local `payload.db` on disk. | **Persistent** on dedicated hardware |

### 2.3 Media Storage
- **Development / Local Container:** Uploads write to `media/` on disk and are served directly.
- **Cloud Production:** Configure AWS S3 or Cloudflare R2 by setting `S3_ENABLED=true` and supplying standard S3 bucket credentials.

---

## 3. Environment Variables Reference

Configure these in your production host's Environment Variables dashboard. Never commit actual secrets to source control.

| Variable Name | Required | Purpose | Production Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Controls optimizations and cookie security flags | `production` |
| `PORT` | Yes | Port for the HTTP server to bind to | `3000` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL for SEO, sitemaps, and OG tags | `https://uncharteredpodcast.com` |
| `SESSION_SECRET` | Yes | 64-character secret for signing HMAC session cookies | `generate with: openssl rand -hex 32` |
| `DATABASE_URI` | Yes | Database connection string | `libsql://unchartered-prod.turso.io` or `file:/app/data/payload.db` |
| `DATABASE_AUTH_TOKEN` | Cond. | Auth token for remote Turso database | `your-turso-jwt-auth-token` |
| `CRON_SECRET` | Yes | Bearer token protecting `/api/cron/publish` | `generate with: openssl rand -hex 16` |
| `RESEND_API_KEY` | Optional | API key for transactional emails (nominations & contact) | `re_live_xxxxxxxxxxxxxxxx` |
| `NOMINATION_RECIPIENT_EMAIL` | Optional | Destination email for leader nominations | `nominations@uncharteredpodcast.com` |
| `CONTACT_RECIPIENT_EMAIL` | Optional | Destination email for public inquiries | `contact@uncharteredpodcast.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 Measurement ID | `G-XXXXXXXXXX` |
| `S3_ENABLED` | Optional | Enables object storage for media uploads | `false` or `true` |
| `S3_BUCKET` | Optional | S3 / R2 bucket name | `unchartered-media` |
| `S3_REGION` | Optional | S3 / R2 bucket region | `us-east-1` or `auto` |
| `S3_ACCESS_KEY_ID` | Optional | S3 / R2 Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_ACCESS_KEY` | Optional | S3 / R2 Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

---

## 4. Deployment Options & Step-by-Step Instructions

### Option A: Vercel / Netlify + Turso (Recommended for Serverless)

1. **Create Turso Database:**
   ```bash
   turso db create unchartered-prod
   turso db tokens create unchartered-prod
   ```
2. **Export Local SQLite Data to Turso:**
   ```bash
   sqlite3 payload.db .dump > dump.sql
   turso db shell unchartered-prod < dump.sql
   ```
3. **Connect Repository to Vercel:**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)
   - Install Command: `npm ci`
4. **Add Environment Variables:**
   - `NEXT_PUBLIC_SITE_URL` = `https://your-domain.com`
   - `DATABASE_URI` = `libsql://unchartered-prod.turso.io`
   - `DATABASE_AUTH_TOKEN` = `[token from step 1]`
   - `SESSION_SECRET` = `[generated 64-char hex]`
   - `CRON_SECRET` = `[generated 32-char hex]`
5. **Configure Cron Job:**
   In `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/publish",
         "schedule": "*/10 * * * *"
       }
     ]
   }
   ```

---

### Option B: Render Web Service (Persistent Container)

1. **Create a New Web Service on Render:**
   - Connect Git repository.
   - Environment: **Docker** or **Node**.
   - If Node:
     - Build Command: `npm ci && npm run build`
     - Start Command: `npm run start`
2. **Attach Persistent Disk:**
   - Mount Path: `/app/data` (size: 5GB)
   - Mount Path: `/app/media` (size: 10GB)
3. **Configure Environment Variables:**
   - `DATABASE_URI` = `file:/app/data/payload.db`
   - `SESSION_SECRET` = `[generated 64-char hex]`
   - `CRON_SECRET` = `[generated 32-char hex]`
   - `PORT` = `10000`
4. **Health Check Path:**
   - `/api/health`

---

### Option C: Docker / Fly.io / Railway / VPS

Build and run using the included multi-stage [`Dockerfile`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/Dockerfile):

```bash
# 1. Build the Docker container
docker build -t unchartered-podcast:latest .

# 2. Run with mounted persistent volumes
docker run -d \
  --name unchartered_web \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SITE_URL=https://uncharteredpodcast.com \
  -e SESSION_SECRET=your-64-character-production-session-secret \
  -e DATABASE_URI=file:/app/data/payload.db \
  -e CRON_SECRET=your-production-cron-secret-token \
  -v unchartered_db_data:/app/data \
  -v unchartered_media_data:/app/media \
  unchartered-podcast:latest
```

---

## 5. Production Health Checks & Verification

After deploying, verify the following endpoints on your live production URL:

1. **System Health Check:**
   ```bash
   curl -i https://your-domain.com/api/health
   # Expected: HTTP 200, status: "ok", database: "connected"
   ```

2. **Public Website Smoke Tests:**
   - Homepage: `https://your-domain.com/` (HTTP 200)
   - Episodes: `https://your-domain.com/episodes` (HTTP 200)
   - Guest Directory: `https://your-domain.com/guests` (HTTP 200)
   - Sitemap: `https://your-domain.com/sitemap.xml` (HTTP 200)
   - Robots: `https://your-domain.com/robots.txt` (HTTP 200)

3. **Admin Portal Login:**
   - Navigate to `https://your-domain.com/admin/login`
   - Sign in with administrator credentials.
   - Verify redirect to `https://your-domain.com/admin`.
   - Verify all 11 modules load data from the database.

4. **Scheduled Publishing Cron:**
   ```bash
   curl -i -X POST https://your-domain.com/api/cron/publish \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   # Expected: HTTP 200, success: true
   ```

---

## 6. Backup & Recovery Procedure

### Create an Automated Backup
Run the included cross-platform backup utility:
- **Windows PowerShell:**
  ```powershell
  .\scripts\backup.ps1 -Action backup
  ```
- **Linux / macOS Bash:**
  ```bash
  ./scripts/backup.sh
  ```

### Restore from Backup
- **Windows PowerShell:**
  ```powershell
  .\scripts\backup.ps1 -Action restore -ArchivePath .\backups\unchartered_full_backup_YYYYMMDD_HHMMSS.zip
  ```
- **Linux / macOS Bash:**
  ```bash
  unzip ./backups/unchartered_full_backup_YYYYMMDD_HHMMSS.zip -d /tmp/restore
  cp /tmp/restore/payload_*.db ./payload.db
  cp -r /tmp/restore/media/* ./media/
  ```
