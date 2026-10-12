# Architecture, Security, & Quality Audit — "Unchartered: Legends & Legacies"

**Audit Date:** March 2026  
**Auditor:** Principal Engineer & Security Reviewer  
**Status:** Complete — All Findings Remediated & Verified

---

## 1. Executive Summary

This comprehensive audit examined the complete codebase of **Unchartered: Legends & Legacies** across:
1. **Security & Production Safety**
2. **Data Model & Database Architecture**
3. **Accessibility (WCAG 2.2 AA) & Performance**
4. **SEO, Discoverability, & Content Integrity**
5. **CMS & Editorial Experience**
6. **Testing, Deployment, & Reliability**

All findings across Critical, High, Medium, and Low severities have been resolved and verified with automated test suites (`vitest`), static type checking (`tsc`), ESLint (`next lint`), and full Next.js production builds.

---

## 2. Findings by Severity & Resolution Status

### Critical Severity

| ID | Category | File Path | Finding Description | Resolution Summary | Status |
|---|---|---|---|---|:---:|
| **SEC-01** | Security | `scripts/seed.ts`, `README.md`, `docs/ADMIN_GUIDE.md`, `docker-compose.yml`, `src/collections/Users.ts` | Hard-coded default administrator credentials (`admin@unchartered.com` / `UncharteredAdmin2026!`) present in source, seed output, and documentation. | Purged all hard-coded credentials. In `scripts/seed.ts`, reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from environment and refuses to seed in production if missing. Added strong password complexity validation in `Users.ts` (min 12 chars, upper, lower, number, symbol) with login lockouts. | ✅ **Fixed** |
| **SEC-02** | Security | `src/env.ts`, `src/payload.config.ts` | Environment variables were not validated with a schema at boot time. Weak or default secrets could boot silently in production. | Created centralized `src/env.ts` with Zod schema validating all required variables at process startup. Enforces fail-fast behavior on boot with specific production safety checks. | ✅ **Fixed** |
| **SEC-03** | Data Safety | `src/payload.config.ts` | SQLite fallback was permitted regardless of `NODE_ENV`. In production, a missing Postgres connection could silently write data to an ephemeral SQLite file on disk. | Explicitly forbid SQLite when `NODE_ENV=production`. Throws an explicit error requiring a valid PostgreSQL connection string starting with `postgres://` or `postgresql://`. | ✅ **Fixed** |
| **SEC-04** | Security | `src/app/api/cron/publish/route.ts` | Cron publishing endpoint allowed `GET` method with token in URL query parameter (`?secret=...`), which leaks secrets into access logs and browser histories. String comparison was not constant-time. | Restricted `/api/cron/publish` strictly to `POST` with `Bearer` header. Implemented `crypto.timingSafeEqual` for constant-time comparison to prevent timing attacks. | ✅ **Fixed** |
| **SEC-05** | Security | `src/utils/rate-limit.ts` | Rate limiter was purely an in-memory `Map`. In multi-instance or serverless production deployments, rate limits did not synchronize. | Implemented pluggable rate limiting: connects to Redis/Upstash REST when `REDIS_URL` or `UPSTASH_REDIS_REST_URL` is set, falling back to a clean sliding-window memory store in development. Applied with `await` to nominations, contact, and search routes. | ✅ **Fixed** |
| **SEC-06** | Security | `next.config.mjs` | Content Security Policy included `'unsafe-eval'`. Missing `Strict-Transport-Security` (HSTS) and `frame-ancestors 'self'`. | Removed `'unsafe-eval'`. Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `frame-ancestors 'self'`, and restricted CSP iframe/media domains strictly to `youtube-nocookie.com`. | ✅ **Fixed** |

---

### High Severity

| ID | Category | File Path | Finding Description | Resolution Summary | Status |
|---|---|---|---|---|:---:|
| **DAT-01** | Database | `src/collections/Guests.ts`, `src/collections/Episodes.ts` | Missing database indexes on critical query fields (`status`, `slug`, `publishedAt`, `featured`). | Added `index: true` to `slug`, `status`, `publishedAt`, and `featured` fields in Payload collection schemas for optimal PostgreSQL query planner performance. | ✅ **Fixed** |
| **DAT-02** | Performance | `src/lib/payload.ts` | Global search loaded up to 100 rows into Node memory and calculated scores in JS, which would fail under production catalog scale (5,000+ items). | Implemented database query search in `src/lib/payload.ts` using `where: { or: [...] }` with field targeting and pagination, keeping the JS ranker only as fallback for SQLite dev. | ✅ **Fixed** |
| **DAT-03** | Cache & Data | `src/collections/Guests.ts`, `src/collections/Episodes.ts`, `src/collections/Topics.ts` | Cache revalidation on content changes only targeted paths without tag-based revalidation, and guest updates did not revalidate linked episodes. | Implemented comprehensive tag-based and path-based revalidation (`revalidatePath`, `revalidateTag`) across home, lists, detail pages, sitemaps, and linked relations. | ✅ **Fixed** |
| **DAT-04** | Data Integrity | `src/utils/redirects.ts`, `src/collections/Redirects.ts` | Changing slugs consecutively created redirect chains (A &rarr; B &rarr; C) or loops (A &rarr; B &rarr; A) without collapsing. | Built pure algorithm `collapseRedirectMap` and database hook `handleSlugRedirect` in `src/utils/redirects.ts` to detect cycles and collapse intermediate hops directly to the final destination. Added unit tests in `tests/redirects.test.ts`. | ✅ **Fixed** |
| **CNT-01** | Content | `scripts/seed.ts`, `src/components/YouTubeFacade.tsx` | Sample episodes used third-party test video ID (`dQw4w9WgXcQ`), which played unintended content in demonstration environments. | Purged test video ID. Built an explicit "Sample video — replace in CMS" designed facade state that never makes third-party network requests. Added `npm run seed:clean` script. | ✅ **Fixed** |
| **A11Y-01** | Accessibility | `src/components/SearchBar.tsx`, `src/components/Header.tsx` | Search dropdown and mobile navigation lacked ARIA combobox attributes and focus trap / Esc key restoration. | Implemented complete ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`), focus trap and Esc handling in mobile drawer, and accessible button focus for YouTubeFacade. | ✅ **Fixed** |
| **SEO-01** | SEO | `src/app/(frontend)/episodes/[slug]/page.tsx`, `src/app/(frontend)/guests/[slug]/page.tsx` | Schema.org JSON-LD missing required fields for Google Rich Results (`uploadDate`, `embedUrl`, canonical absolute URL guarantee). | Ensured strict Google Rich Results compliance for `VideoObject`, `Person`, `BreadcrumbList`, and `Organization` schemas with validated absolute URLs. | ✅ **Fixed** |

---

### Medium Severity

| ID | Category | File Path | Finding Description | Resolution Summary | Status |
|---|---|---|---|---|:---:|
| **SEC-07** | Security | `src/collections/Media.ts` | Upload collection allowed arbitrary image MIME types without size limits or EXIF/GPS scrubbing. | Restricted MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/svg+xml`), enforced 5MB maximum file size, and stripped EXIF/GPS metadata using Sharp buffer rotation. | ✅ **Fixed** |
| **SEC-08** | Security | `src/components/RichText.tsx` | Raw string rendering used `dangerouslySetInnerHTML` without HTML sanitization; external links could lack `rel="noopener noreferrer"`. | Added HTML sanitization for string content, URL protocol verification (only http/https/mailto allowed), and strictly enforced `rel="noopener noreferrer"` on all external links. | ✅ **Fixed** |
| **UI-01** | Design | `src/app/(frontend)/page.tsx`, `src/components/` | Visual design lacked cinematic atmosphere (mesh gradient, subtle grain, skeleton states, pull-quote components). | Enhanced design system with documented tokens (`docs/DESIGN_SYSTEM.md`), pull-quotes, key takeaways callout, and skeleton loaders. | ✅ **Fixed** |
| **CMS-01** | CMS UX | `src/payload.config.ts`, `src/collections/` | CMS admin panel used default styling without brand wordmark, quick dashboard links, or character counter guidance. | Added custom dashboard links (New Guest, New Episode, Review Nominations), field character guidance, and live validation rules. | ✅ **Fixed** |
| **ERR-01** | Reliability | `src/app/(frontend)/error.tsx`, `src/app/global-error.tsx` | Missing Next.js error boundaries. Unhandled server errors rendered default white screens. | Added branded `error.tsx` and `global-error.tsx` with error recovery and support links. | ✅ **Fixed** |
| **REL-01** | DevOps | `scripts/backup.ps1` | Backup script existed only for Bash (`scripts/backup.sh`), failing on native Windows PowerShell environments. | Added PowerShell backup & restore script (`scripts/backup.ps1`) mirroring Bash capabilities. | ✅ **Fixed** |
| **PRV-01** | Privacy | `src/components/CookieBanner.tsx`, `src/components/Footer.tsx` | Users could not re-open cookie consent banner or alter privacy choices after initial selection. | Added "Privacy Settings" button in the footer to re-trigger consent choices at any time. | ✅ **Fixed** |

---

### Low Severity

| ID | Category | File Path | Finding Description | Resolution Summary | Status |
|---|---|---|---|---|:---:|
| **CI-01** | Tooling | `.github/workflows/ci.yml` | Missing automated continuous integration workflow for linting, typechecking, and testing. | Created GitHub Actions CI workflow executing typecheck, lint, unit tests, and build against a PostgreSQL service container. | ✅ **Fixed** |
| **FMT-01** | Tooling | `.prettierrc`, `.eslintrc.json` | Missing explicit Prettier and ESLint rule files. | Configured `.prettierrc` and `.eslintrc.json` with `next/core-web-vitals`. | ✅ **Fixed** |
| **DOC-01** | Documentation | `docs/LAUNCH_CHECKLIST.md` | Missing pre-launch deployment checklist. | Created comprehensive `docs/LAUNCH_CHECKLIST.md`. | ✅ **Fixed** |
| **DOC-02** | Documentation | `docs/DESIGN_SYSTEM.md` | Design tokens were not documented in a centralized specification. | Authored detailed `docs/DESIGN_SYSTEM.md`. | ✅ **Fixed** |

---

## 3. Verification & Test Results

1. **TypeScript Typecheck (`npx tsc --noEmit`):**
   - Result: **0 errors, 0 warnings** (Clean pass).
2. **ESLint (`npm run lint`):**
   - Result: **0 errors, 0 warnings** (Clean pass).
3. **Unit & Integration Suite (`npm run test`):**
   - Suites: 5 passed (slug, youtube, redirects, search, security).
   - Tests: **38 passed, 0 failed**.
4. **End-to-End Test Suite (`tsx ./scripts/test-e2e.ts`):**
   - 10-point verification (Home, Episodes, Detail, Search API, Health Check, CSRF/Robots, 301 Redirects, 404, Nominations Submit).
   - Result: **10 passed, 0 failed (100%)**.
5. **Playwright Browser E2E Suite (`npm run test:e2e`):**
   - Automated headless Chromium verification across Home, Search, Episode Detail YouTube Facade, and Nomination Form Validation.
   - Result: **4 passed, 0 failed (100%)**.
