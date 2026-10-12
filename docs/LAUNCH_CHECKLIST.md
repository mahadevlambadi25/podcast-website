# Production Launch Checklist — "Unchartered: Legends & Legacies"

This checklist verifies that all technical, architectural, security, accessibility, and operational criteria are satisfied prior to production deployment.

---

## 1. Environment & Infrastructure Readiness

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Centralized Env Validation** | `src/env.ts` validates all configuration at boot with Zod | `npm run build` halts if critical vars missing | ✅ **Verified** |
| **No Default / Hard-coded Secrets** | `PAYLOAD_SECRET`, `CRON_SECRET`, `SEED_ADMIN_PASSWORD` must be generated randomly (≥ 32 chars in production) | Checked `.env.example`, `.env.local`, `src/env.ts` | ✅ **Verified** |
| **PostgreSQL Mandatory** | In production (`NODE_ENV=production`), SQLite fallback is strictly blocked; valid `postgres://` or `postgresql://` URI required | `src/payload.config.ts` fails fast if URI is SQLite | ✅ **Verified** |
| **Production Site URL** | `NEXT_PUBLIC_SITE_URL` set to actual production domain (e.g. `https://uncharteredpodcast.com`) | Validated absolute URLs in metadata & sitemaps | ✅ **Ready for Deploy** |
| **Pluggable Rate Limiting** | Set `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (or `REDIS_URL`) for distributed rate limiting across instances | Tested sliding window & fallback in `src/utils/rate-limit.ts` | ✅ **Verified** |
| **S3 Cloud Storage (Optional)** | Configure `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` for persistent multi-instance media | Handled via `@payloadcms/storage-s3` in `payload.config.ts` | ✅ **Verified** |

---

## 2. Security & Compliance

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Content Security Policy (CSP)** | No `'unsafe-eval'`; restricted to `youtube-nocookie.com`, GA4; frame ancestors set to `'self'` | Tested headers in `next.config.mjs` | ✅ **Verified** |
| **HSTS & Security Headers** | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff` | Configured in `next.config.mjs` | ✅ **Verified** |
| **Secure Cron Endpoint** | `/api/cron/publish` accepts only `POST` with `Bearer <CRON_SECRET>` using `crypto.timingSafeEqual` | Tested in `src/app/api/cron/publish/route.ts` | ✅ **Verified** |
| **Upload File Security** | Images restricted to JPEG/PNG/WebP/AVIF/SVG, max 5MB; Sharp strips EXIF/GPS metadata | Configured in `src/collections/Media.ts` | ✅ **Verified** |
| **Rich Text Sanitization** | HTML output sanitized; external links enforce `rel="noopener noreferrer"`; protocol restricted to `http:`, `https:`, `mailto:` | Tested in `src/components/RichText.tsx` | ✅ **Verified** |
| **Strong Password Policy** | Admin and editor accounts require min 12 characters, uppercase, lowercase, number, and special character | Enforced in `src/collections/Users.ts` | ✅ **Verified** |
| **Cookie & Privacy Compliance** | No tracking cookies loaded before consent; visitor can change consent anytime via footer link | Implemented in `CookieBanner.tsx` & `PrivacySettingsButton.tsx` | ✅ **Verified** |

---

## 3. Database & System Performance

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Database Indexes** | Indexes on `slug`, `status`, `publishedAt`, and `featured` for rapid filtering and lookup | Added `index: true` in `Guests.ts` and `Episodes.ts` | ✅ **Verified** |
| **Scalable Database Search** | Global search uses database queries (`where: { or: [...] }`) with limits, avoiding full table in-memory scans | Tested in `src/lib/payload.ts` | ✅ **Verified** |
| **Redirect Collapsing** | Slug changes automatically create 301 redirects, collapse intermediate chains (A→B→C to A→C), and prevent cycles | Tested in `src/utils/redirects.ts` and `tests/redirects.test.ts` | ✅ **Verified** |
| **Cache Invalidation & ISR** | Publishing, archiving, or editing revalidates affected paths and tags (episodes, guests, topics, sitemap) | Tested `revalidatePath` and `revalidateTag` hooks | ✅ **Verified** |
| **Idempotent Scheduled Publishing** | Cron can run repeatedly without duplicate side-effects; unreleased episodes are not publicly viewable | Tested in cron endpoint & queries | ✅ **Verified** |

---

## 4. Content Integrity & Demo Sanitization

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Purge Meme Video ID** | Meme placeholder ID (`dQw4w9WgXcQ`) purged; sample episodes show branded placeholder facade without external requests | Verified in `YouTubeFacade.tsx` and seed data | ✅ **Verified** |
| **Demo Data Isolation** | Demo episodes and guests tagged as sample content; cleanable with single command | Added `npm run seed:clean` script | ✅ **Verified** |
| **Idempotent Seeder** | Running `npm run seed` repeatedly updates or skips without creating duplicate entries | Verified in `scripts/seed.ts` | ✅ **Verified** |

---

## 5. SEO, Discoverability & Rich Results

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Google Rich Results JSON-LD** | `VideoObject`, `Person`, `BreadcrumbList`, `Organization`, `WebSite` validated with absolute URLs | Schema.org JSON-LD in episode and guest detail pages | ✅ **Verified** |
| **Dynamic XML Sitemap** | Clean `/sitemap.xml` generated with `lastmod`, priority, and published-only filtering | Tested in `src/app/sitemap.ts` | ✅ **Verified** |
| **Dynamic Open Graph Images** | `/api/og` endpoint generates cinematic branded social preview cards for episodes and guests | Tested with diacritics and fallback portraits | ✅ **Verified** |
| **Robots & Canonical Links** | Absolute canonical URLs on every page; draft/preview and search pages marked `noindex` | Tested in root layouts and metadata helpers | ✅ **Verified** |

---

## 6. Accessibility & UX Quality

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **WCAG 2.2 AA Contrast & Focus** | Gold on dark navy accents, explicit `focus-visible` rings on all interactive components | Tested in `src/app/globals.css` | ✅ **Verified** |
| **Keyboard Navigation & Traps** | Mobile menu drawer traps focus, supports Esc to close; SearchBar implements full ARIA combobox pattern | Tested in `Header.tsx` and `SearchBar.tsx` | ✅ **Verified** |
| **Touch Targets & Layout** | Minimum 44×44px interactive touch targets; no horizontal overflow at 360px, 390px, 768px, 1280px | Audited and verified across all views | ✅ **Verified** |
| **YouTube Facade A11y** | Facade is a standard `<button>` with clear accessible label; shifts keyboard focus to player on click | Tested in `YouTubeFacade.tsx` | ✅ **Verified** |

---

## 7. Forms, Email & Admin Experience

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Anti-Spam & Rate Limiting** | Honeypot field (`website_hp`), minimum submission time threshold, sliding window rate limit | Tested in `tests/security.test.ts` | ✅ **Verified** |
| **Transactional Email Delivery** | Resend API integration with exponential backoff; failures logged without dropping submissions | Tested in `src/utils/email.ts` | ✅ **Verified** |
| **HTML & Header Injection Guard** | All user inputs sanitized before rendering or inclusion in emails | Tested `escapeHtml` in `tests/security.test.ts` | ✅ **Verified** |
| **Nominations CSV Export** | Admins can export nominations to CSV from `/api/nominations/export` with authorization | Tested in route handler | ✅ **Verified** |
| **CMS Editorial Branding** | Custom dashboard links, character counters, validation guidance | Tested in Payload CMS config | ✅ **Verified** |

---

## 8. DevOps & Disaster Recovery

| Item | Requirement | Verification Method | Status |
|---|---|---|:---:|
| **Health Check Endpoint** | `/api/health` validates live PostgreSQL connectivity and reports uptime/version without leaks | Tested in `src/app/api/health/route.ts` | ✅ **Verified** |
| **Multi-Platform Backups** | Bash (`scripts/backup.sh`) and PowerShell (`scripts/backup.ps1`) scripts for PostgreSQL backup and restore | Created and documented in `docs/RUNBOOK.md` | ✅ **Verified** |
| **Containerization** | Multi-stage Dockerfile and docker-compose configured with production non-root user | Verified `Dockerfile` and `docker-compose.yml` | ✅ **Verified** |
| **Automated CI Workflow** | GitHub Actions workflow (`.github/workflows/ci.yml`) executes typecheck, lint, test, and build with Postgres container | Created `.github/workflows/ci.yml` | ✅ **Verified** |
