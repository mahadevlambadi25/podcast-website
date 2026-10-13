# Unchartered — Legends & Legacies — Podcast Platform & Custom CMS

> A premium editorial podcast website produced by **AI Automation Labs** ([automationlabs.online](https://automationlabs.online/)). Featuring long-form dialogues with founders, CEOs, chairpersons, and pioneers shaping the global frontier.

---

## 1. Architecture Overview

- **Public Website (`src/app/(frontend)/`):** Next.js 15 App Router with high-performance SSR/ISR, Fraunces & Inter typography, responsive YouTube facade, dynamic search, leader profiles, and audience submissions.
- **Custom Editorial CMS (`src/app/admin/`):** Independently owned editorial control center with role-based access control, PBKDF2 authentication, and dedicated management interfaces for episodes, guests, topics, media, nominations, and site settings.
- **Database Access Layer (`src/services/`):** Parameterized direct SQL service queries powered by PostgreSQL (`pg` driver with connection pooling and SSL for Render PostgreSQL).
- **REST APIs (`src/app/api/`):** Unified REST API endpoints for administration, auth, search, nominations, contact submissions, and scheduled publishing.

---

## 2. Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env.local
cp .env.example .env.local

# 3. Start development server
npm run dev
```

- Public Website: [http://localhost:3000](http://localhost:3000)
- Custom Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)
- Health Check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 3. Production Build & Startup

```bash
# Build the production application
npm run build

# Start the production server
npm run start
```

---

## 4. Testing & Validation

```bash
# Run TypeScript type check
npx tsc --noEmit

# Run Vitest unit & integration tests (38 tests)
npm run test

# Run full content CRUD validation suite
npx tsx scripts/test-full-crud.ts

# Run Playwright E2E browser smoke tests
npx tsx scripts/test-e2e-suite.ts
```

---

## 5. Technology Stack

- **Framework:** Next.js 15.3.9 (App Router, React 19, TypeScript 5.7)
- **Database Driver:** PostgreSQL (`pg` driver with connection pooling)
- **Styling:** Tailwind CSS 3.4 + Custom Editorial Tokens (`#0F1B2D`, `#C9A24B`, `#F7F3EB`)
- **Typography:** `next/font` with *Fraunces* (editorial serif) and *Inter* (body)
- **Validation:** Zod 3.23
- **Image Processing:** Sharp 0.33
- **Testing:** Vitest 3.0 + Playwright 1.50
- **Email:** Resend 4.1

---

## 6. Key Application Routes

| Route | Type | Description |
|---|---|---|
| `/` | Public (ISR) | Homepage with hero, latest episode, featured leaders, and nomination CTA |
| `/episodes` | Public (Dynamic) | Full episode catalog with multi-filter search, topics, and year |
| `/episodes/[slug]` | Public (SSG/ISR) | Episode page with privacy YouTube facade, show notes, and transcript |
| `/guests` | Public (Dynamic) | Leader directory and executive profiles |
| `/guests/[slug]` | Public (SSG/ISR) | Permanent leader profile linking appearances, biography, and insights |
| `/nominate-a-leader` | Public | Candidate nomination form with honeypot & rate-limiting |
| `/contact` | Public | Audience contact inquiry form |
| `/search` | Public | Instant phonetic, token, and keyword multi-collection search |
| `/admin` | Protected | Editorial command center with live counts and publishing timeline |
| `/admin/login` | Public | PBKDF2 authenticated login with rate-limited brute-force protection |
| `/admin/episodes` | Protected | Multi-tab Episode Editor, scheduling, and relations manager |
| `/admin/guests` | Protected | Leader profile manager with relational safe-delete protection |
| `/admin/topics` | Protected | Thematic taxonomy pillars manager |
| `/admin/media` | Protected | Media library with drag-and-drop upload and asset tracking |
| `/admin/nominations`| Protected | Review queue for guest nominations |
| `/admin/settings` | Protected | Global brand, host, social links, and legal settings |
| `/api/health` | Public | System uptime and live database connection health check |

---

## 7. Deployment & Backups

Refer to [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for complete instructions on deploying to **Turso + Vercel**, **Render**, or **Docker Containers**.

### Create a Database & Media Backup
```powershell
.\scripts\backup.ps1 -Action backup
```
