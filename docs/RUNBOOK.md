# Engineering Runbook — "Unchartered: Legends & Legacies"

Technical operations, infrastructure deployment, backups, cron jobs, and environment configuration for the production platform.

---

## 1. Environment Variables Reference

| Variable | Description | Required | Example |
|---|---|---|---|
| `PORT` | Web server port | Yes | `3000` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL | Yes | `https://uncharteredpodcast.com` |
| `DATABASE_URI` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/unchartered_db` |
| `USE_SQLITE` | Set `true` to use local SQLite | No | `false` |
| `PAYLOAD_SECRET` | Cryptographic session salt (32+ chars) | Yes | `openssl rand -base64 32` |
| `SEED_ADMIN_EMAIL` | Administrator email for initial seed | Yes (in prod) | `admin@yourdomain.com` (user supplied) |
| `SEED_ADMIN_PASSWORD` | Administrator password (min 12 chars, complex) | Yes (in prod) | Generated strong secret (never committed) |
| `SEED_DEMO` | Seed sample episodes & guests on init | No | `false` |
| `CRON_SECRET` | Secret token securing `/api/cron/publish` | Yes | `super-secret-cron-token` |
| `RESEND_API_KEY` | Resend transactional email API key | No | `re_123456789` |
| `NOMINATION_RECIPIENT_EMAIL` | Recipient for nomination notifications | No | `nominations@uncharteredpodcast.com` |
| `CONTACT_RECIPIENT_EMAIL` | Recipient for general contact messages | No | `contact@uncharteredpodcast.com` |
| `NOMINATION_WEBHOOK_URL` | External CRM webhook endpoint | No | `https://api.hubspot.com/...` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 Measurement ID | No | `G-XXXXXXXXXX` |
| `S3_ENABLED` | Enable S3 media storage | No | `true` |
| `S3_BUCKET` | AWS S3 Bucket Name | If S3 | `unchartered-media-bucket` |
| `S3_REGION` | AWS Region | If S3 | `us-east-1` |
| `S3_ACCESS_KEY_ID` | AWS IAM Access Key | If S3 | `AKIAIOSFODNN7EXAMPLE` |
| `S3_SECRET_ACCESS_KEY` | AWS IAM Secret Key | If S3 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

---

## 2. Deployment Architecture

### 2.1 Render.com (Recommended Blueprint)
The repository includes an infrastructure-as-code `render.yaml` blueprint:
1. Connect your GitHub/GitLab repository to **Render**.
2. Select **New Blueprint Instance** and pick `render.yaml`.
3. Render automatically provisions:
   - **Web Service (`unchartered-podcast-web`):** Next.js App Router running Node 22.
   - **PostgreSQL Database (`unchartered-postgres`):** Managed PostgreSQL 16 database.
   - **Persistent Disk:** Mounted at `/app/media` for local image uploads.
   - **Cron Job (`unchartered-publish-cron`):** Runs every 10 minutes to trigger `/api/cron/publish` with bearer authorization.

### 2.2 AWS Production Architecture (Alternative)
For high-scale enterprise hosting on Amazon Web Services:
- **Compute:** **AWS App Runner** or **Amazon ECS (Fargate)** with the multi-stage `Dockerfile`.
  - Min instances: 2; Max instances: 10.
  - Health check path: `/api/health`.
- **Database:** **Amazon RDS for PostgreSQL 16** (Multi-AZ).
  - Enable extensions in RDS parameter group or via SQL:
    ```sql
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS unaccent;
    ```
- **Media Asset Storage:** **Amazon S3** bucket with Amazon CloudFront CDN.
  - Set `S3_ENABLED=true`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
- **Scheduled Publishing Cron:** **Amazon EventBridge Rule** invoking AWS Lambda or HTTP target every 10 minutes:
  - Target: `POST https://uncharteredpodcast.com/api/cron/publish`
  - Header: `Authorization: Bearer <CRON_SECRET>`

---

## 3. Database & Media Backup / Restore Procedure

The repository provides an automated backup script at `scripts/backup.sh`.

### 3.1 Creating a Daily Backup
```bash
# Run backup
./scripts/backup.sh backup ./backups
```
This produces a compressed timestamped archive:
`./backups/unchartered_full_backup_YYYYMMDD_HHMMSS.tar.gz` containing:
1. PostgreSQL binary dump (`database_*.dump`)
2. Uploaded media assets (`media_*.tar.gz`)

### 3.2 Restoring from Backup
```bash
./scripts/backup.sh restore ./backups/unchartered_full_backup_20260315_120000.tar.gz
```

---

## 4. Local Development

### 4.1 Running with Docker Compose (App + PostgreSQL)
```bash
docker compose up --build
```
Access app at `http://localhost:3000` and CMS at `http://localhost:3000/admin`.

### 4.2 Running Standalone Node.js
```bash
npm install
npm run seed
npm run dev
```

---

## 5. Security & Maintenance

1. **Security Headers:** Strict Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are enforced via `next.config.mjs`.
2. **Access Control:** Public visitors cannot modify content. Only users with the `admin` role can manage system users, modify redirects, or change canonical overrides.
3. **Log Monitoring:** Health endpoint is available at `/api/health`.
