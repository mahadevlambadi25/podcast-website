# Production Deployment & Hosting Guide — "Unchartered: Legends & Legacies"

**Project:** Unchartered: Legends & Legacies — Podcast Platform & Custom CMS  
**Stack:** Next.js 15.3.9 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4, PostgreSQL (`pg`)  
**Production Database:** Render PostgreSQL 14+  
**Architecture:** Unified Full-Stack Application (Public Website + Custom Editorial CMS + Direct PostgreSQL Data Layer)

---

## 1. Architecture Overview

Unchartered is built as a cohesive, full-stack Next.js 15 application:
- **Public Website (`src/app/(frontend)/`):** SEO-optimized, accessible, dynamic and ISR pages for episodes, leader profiles, topics, nominations, and search.
- **Editorial CMS (`src/app/admin/`):** Custom high-contrast Editorial dashboard with role-based access control, PBKDF2 authentication, and complete CRUD for episodes, guests, topics, media, nominations, and site settings.
- **Backend Services Layer (`src/services/`):** Parameterized, direct SQL queries using a PostgreSQL connection pool (`pg.Pool`), eliminating CMS overhead and external latency.
- **REST APIs (`src/app/api/`):** Modular endpoints for authentication, admin operations, audience submissions, search, OG image generation, health checks, and scheduled publishing.

---

## 2. Database & Storage Architecture

### 2.1 Database Engine (Render PostgreSQL)
The application uses the standard, maintained `pg` PostgreSQL driver. Database connections use connection pooling (`pg.Pool`) configured for SSL mode (`rejectUnauthorized: false` for managed cloud certificates like Render).

### 2.2 Migrations & Bootstrap
- **Schema Definition:** `scripts/schema-postgres.sql`
- **Migration Runner:** `scripts/migrate-postgres.mjs`
- **Behavior:**
  - Creates all tables and indexes idempotently using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.
  - Checks if `site_settings` has 0 rows; if so, populates baseline public episodes, guests, topics, media, and site settings from `scripts/init-data.json`.
  - Checks if `users` has 0 rows; if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, creates the initial admin account with PBKDF2 salt/hash.
  - Never automatically drops tables, truncates records, or overwrites existing data.

---

## 3. Environment Variables Reference

Configure these in Render's Environment Variables dashboard. Never commit actual secrets to source control.

| Variable Name | Required | Purpose | Production Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Controls optimizations and cookie security flags | `production` |
| `PORT` | Yes | Port for the HTTP server to bind to | `10000` (Render default) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL for SEO, sitemaps, and OG tags | `https://uncharteredpodcast.com` |
| `DATABASE_URL` | Yes | Render PostgreSQL connection URL (automatically set via Blueprint) | `postgresql://user:password@dpg-xxx-a:5432/unchartered` |
| `SESSION_SECRET` | Yes | 64-character secret for signing HMAC session cookies | `openssl rand -hex 32` |
| `CRON_SECRET` | Yes | Bearer token protecting `/api/cron/publish` | `openssl rand -hex 16` |
| `ADMIN_EMAIL` | Optional | Initial admin bootstrap email (if DB is fresh) | `admin@uncharteredpodcast.com` |
| `ADMIN_PASSWORD` | Optional | Initial admin bootstrap password (min 8 chars) | `SuperSecurePassword!2026` |
| `RESEND_API_KEY` | Optional | API key for transactional emails (nominations & contact) | `re_live_xxxxxxxxxxxxxxxx` |
| `NOMINATION_RECIPIENT_EMAIL` | Optional | Destination email for leader nominations | `nominations@uncharteredpodcast.com` |
| `CONTACT_RECIPIENT_EMAIL` | Optional | Destination email for public inquiries | `contact@uncharteredpodcast.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 Measurement ID | `G-XXXXXXXXXX` |
| `S3_ENABLED` | Optional | Enables object storage for media uploads (`true` or `false`) | `true` |
| `AWS_S3_BUCKET` | Optional | S3 bucket name (alias `S3_BUCKET`) | `podcast-media-mahadev-2026` |
| `AWS_REGION` | Optional | AWS region (alias `S3_REGION`) | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | Optional | IAM Access Key ID for S3 operations | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Optional | IAM Secret Access Key for S3 operations | `wJalrXUtnFEMI...` |

---

## 4. Render Deployment Instructions

### Option A: Render Blueprint (`render.yaml`) — Automated Setup
1. Push your repository to GitHub.
2. In the Render Dashboard, click **Blueprints** -> **New Blueprint Instance**.
3. Select your repository.
4. Render will read `render.yaml` and provision:
   - A **PostgreSQL Database** (`unchartered-postgres`).
   - A **Web Service** (`unchartered-podcast-web`) with build command `npm ci && npm run build` and start command `node ./scripts/migrate-postgres.mjs && npm run start`.
   - A **Cron Job** (`unchartered-publish-cron`) scheduled to trigger `/api/cron/publish` every 10 minutes.
5. In the Web Service settings, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` if you want to automatically bootstrap your first admin user.
6. Click **Apply**.

### Option B: Manual Render Setup
1. **Create PostgreSQL Database:**
   - In Render, click **New +** -> **PostgreSQL**.
   - Name: `unchartered-postgres`
   - Database: `unchartered`
   - User: `unchartered_user`
   - Click **Create Database**.
   - Copy the **Internal Database URL**.
2. **Create Web Service:**
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Runtime: **Node**
   - Build Command: `npm ci && npm run build`
   - Start Command: `node ./scripts/migrate-postgres.mjs && npm run start`
   - Plan: **Starter** or higher.
   - Add Environment Variables from the table above, setting `DATABASE_URL` to your PostgreSQL Internal URL.
   - Click **Create Web Service**.

---

## 5. Local Development with PostgreSQL

To run the application locally against a PostgreSQL instance:
1. Ensure PostgreSQL is running locally or provide a remote PostgreSQL URL:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unchartered
   SESSION_SECRET=local-development-session-secret-at-least-32-chars
   ADMIN_EMAIL=admin@uncharteredpodcast.com
   ADMIN_PASSWORD=AdminPassword123!
   ```
2. Run database migrations:
   ```bash
   node ./scripts/migrate-postgres.mjs
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the site at `http://localhost:3000` and the Admin Dashboard at `http://localhost:3000/admin`.
