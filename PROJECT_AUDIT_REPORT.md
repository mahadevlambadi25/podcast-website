# Master Requirements Compliance Audit Report — "Unchartered: Legends & Legacies"

**Project:** Unchartered: Legends & Legacies — Podcast Platform  
**Auditor:** Senior Full-Stack Engineer, QA Lead, CMS Architect, SEO Specialist & Production Readiness Auditor  
**Audit Date:** 11 October 2026  
**Source of Truth:** *Unchartered: Legends & Legacies — Developer Requirements & Website Specification, Version 1.0, 10 October 2026*  
**Preserved Baseline Backups:**
- [`PROJECT_AUDIT_REPORT_BACKUP_20261011_1823.md`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/PROJECT_AUDIT_REPORT_BACKUP_20261011_1823.md) (Timestamped pre-audit snapshot)
- [`PROJECT_AUDIT_REPORT_PREVIOUS_BACKUP.md`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/PROJECT_AUDIT_REPORT_PREVIOUS_BACKUP.md) (Historical baseline)  
**Launch Readiness Verdict:** **CONDITIONAL — 100% OF LOCAL FEATURES VERIFIED; LAUNCH BLOCKED ON PRODUCTION CLOUD CREDENTIALS & INFRASTRUCTURE PROVISIONING**

---

## 1. Executive Summary

This audit evaluates the codebase of **Unchartered: Legends & Legacies** strictly against the complete 19-section specification supplied by the project owner. Every requirement was audited for actual behavior, route availability, database models, security constraints, and automated test coverage. No feature has been assumed complete simply because a file or schema exists.

### Compliance Summary
- **Total Requirements Audited:** 127
- **Complete (Locally Verified):** 120 (94.5%)
- **Production Verification Pending:** 7 (5.5%)
- **Partial:** 0 (0.0%)
- **Missing:** 0 (0.0%)
- **Broken:** 0 (0.0%)

### Local vs. Production Boundary
The application is fully functional in the local development and staging environments using a validated local SQLite fallback (`payload.db`), with all 27 Next.js App Router routes compiling cleanly, zero TypeScript errors, zero linter warnings, 38 passing Vitest unit tests, 10 passing E2E HTTP smoke assertions, and 4 passing Playwright browser tests.

However, in accordance with the audit mandate, features that depend on live external third-party services or cloud-hosted infrastructure (e.g., PostgreSQL `pg_trgm`/`unaccent` on AWS RDS, AWS S3 bucket uploads, Resend live email delivery to real recipient inboxes, Google Analytics 4 live measurement, and Render cloud cron jobs) are strictly classified as **Production verification pending**. The site **cannot** be declared production-ready until these 7 items are provisioned and verified in a live deployment.

---

## 2. Test Execution & Verification Evidence

All six validation suites were executed independently and sequentially on Windows (PowerShell) against the actual codebase. Every command exited with code 0:

| Suite / Command | Tool / Framework | Actual Exit Code | Result / Output Summary | Verification Status |
|---|---|:---:|---|:---:|
| `npx tsc --noEmit` | TypeScript 5.7+ Compiler | **0** | Clean pass; 0 diagnostic errors across entire codebase | ✅ PASSED |
| `npm run lint` | ESLint 8.57 / Next.js Lint | **0** | `✔ No ESLint warnings or errors` | ✅ PASSED |
| `npm run test` | Vitest 3.0+ | **0** | **38 / 38** unit tests passed across 5 test suites:<br>• `tests/redirects.test.ts` (5 passed)<br>• `tests/slug.test.ts` (8 passed)<br>• `tests/search.test.ts` (6 passed)<br>• `tests/youtube.test.ts` (10 passed)<br>• `tests/security.test.ts` (9 passed) | ✅ PASSED |
| `npm run build` | Next.js 15.3.9 App Router | **0** | **27 / 27** routes compiled successfully.<br>• First Load JS shared by all: 103 kB<br>• Dynamic routes: `/admin`, `/search`, `/api/*`<br>• SSG / ISR routes: `/`, `/episodes/*`, `/guests/*` | ✅ PASSED |
| `npx tsx scripts/test-e2e.ts` | E2E HTTP Smoke Suite | **0** | **10 / 10** assertions passed (0 failed):<br>1. Health check (`/api/health` 200 OK)<br>2. Homepage SSR & brand markup<br>3. Search API database ranking<br>4. Episode detail & YouTube facade<br>5. Guest profile & biography<br>6. Nomination form validation<br>7. Nomination database persistence<br>8. Contact form database persistence<br>9. Robots.txt & sitemap.xml validation<br>10. 301 legacy redirect (`/be-a-guest` &rarr; `/nominate-a-leader`) | ✅ PASSED |
| `npm run test:e2e` | Playwright 1.50+ (Chromium) | **0** | **4 / 4** browser integration tests passed (5.0s):<br>1. Homepage brand, latest episode, CTA (615ms)<br>2. Guest search returns published profile first (543ms)<br>3. Episode page renders responsive facade (391ms)<br>4. Nomination form hydrates and validates (415ms) | ✅ PASSED |

---

## 3. Master Requirements Compliance Matrix (Sections 1–19)

### Section 1: Tech Stack & Core Architecture

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-01.1** | Next.js App Router (15.3.9), React 19, TypeScript strict mode | Complete | [`package.json`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/package.json), [`tsconfig.json`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/tsconfig.json) | Compiled 27 routes in production build; `tsc --noEmit` exit 0 | None | P0 |
| **REQ-01.2** | Embedded Payload CMS 3 at `/admin` | Complete | [`src/payload.config.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/payload.config.ts), [`src/app/(payload)/admin/[[...segments]]/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(payload)/admin/[[...segments]]/page.tsx) | Verified build output compiles `/admin/[[...segments]]` (780 kB) | None | P0 |
| **REQ-01.3** | PostgreSQL adapter with `pg_trgm` + `unaccent` (prod) & SQLite fallback (dev) | Production verification pending | [`src/payload.config.ts#L25-L51`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/payload.config.ts#L25-L51), [`scripts/init-db.sql`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/init-db.sql) | Tested dual adapter switching logic. SQLite verified locally. Postgres connection requires live cloud instance | Connect live PostgreSQL DB with extensions | P0 |
| **REQ-01.4** | Tailwind CSS with CSS variables for design tokens | Complete | [`tailwind.config.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/tailwind.config.ts), [`src/app/globals.css`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/globals.css) | Verified compiled CSS bundles and design tokens | None | P1 |
| **REQ-01.5** | `next/font` with Fraunces (display serif) and Inter (body sans) | Complete | [`src/app/(frontend)/layout.tsx#L12-L30`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/layout.tsx#L12-L30) | Verified `next/font/google` CSS variable injections in layout | None | P1 |
| **REQ-01.6** | Zod validation client & server | Complete | [`src/utils/validators.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/validators.ts), [`src/env.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/env.ts) | 9 tests in `tests/security.test.ts` passed | None | P0 |
| **REQ-01.7** | Sharp image processing and metadata scrubbing | Complete | [`src/collections/Media.ts#L60-L70`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Media.ts#L60-L70) | Inspected EXIF scrubbing hook using `sharp(data).rotate().toBuffer()` | None | P1 |
| **REQ-01.8** | Deployment configs: Dockerfile, docker-compose.yml, render.yaml | Complete | [`Dockerfile`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/Dockerfile), [`docker-compose.yml`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/docker-compose.yml), [`render.yaml`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/render.yaml) | Validated syntax, ports, persistent disk mounts, and cron job specs | None | P1 |
| **REQ-01.9** | Media storage: local disk in dev, S3 adapter configurable for prod | Production verification pending | [`src/payload.config.ts#L55-L73`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/payload.config.ts#L55-L73) | Verified `@payloadcms/storage-s3` plugin configuration. S3 bucket access requires live AWS credentials | Verify bucket upload/download with AWS credentials | P1 |
| **REQ-01.10** | Zero secrets in source; comprehensive `.env.example` | Complete | [`.env.example`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/.env.example), [`.gitignore`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/.gitignore) | Verified no secrets in git; `tests/security.test.ts` checks pass | None | P0 |

---

### Section 2: Brand Identity & Design Direction

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-02.1** | Brand name in single config (`src/config/site.ts`) as `"Unchartered"` | Complete | [`src/config/site.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/config/site.ts) | Centralized in `siteConfig.brandName`, `shortName`, `tagline` | None | P0 |
| **REQ-02.2** | Premium editorial palette: dark navy, off-white, muted gold, sparing blue | Complete | [`src/app/globals.css`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/globals.css), [`tailwind.config.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/tailwind.config.ts) | Verified token definitions `--bg-navy`, `--accent-gold`, `--brand-card` | None | P1 |
| **REQ-02.3** | Typographic hierarchy (display serif headings, clean sans body, 60–75ch measure) | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx) | Inspected `font-editorial`, `font-sans`, and `max-w-[72ch]` prose | None | P2 |
| **REQ-02.4** | Aspect ratios: 4:5 portraits, 16:9 thumbnails, 1200x630 OG, SVG placeholders | Complete | [`src/components/GuestCard.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/GuestCard.tsx), [`src/components/EpisodeCard.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/EpisodeCard.tsx), `public/placeholders/` | Verified `aspect-[4/5]`, `aspect-video`, and SVGs in `public/placeholders/` | None | P1 |
| **REQ-02.5** | Motion respects `prefers-reduced-motion`; zero autoplay | Complete | [`src/components/YouTubeFacade.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx) | Verified zero `autoPlay` on initial load; standard CSS transitions | None | P1 |
| **REQ-02.6** | Attribution guardrail: "A podcast by AI Automation Labs" in Header, Footer, About only | Complete | [`src/components/Header.tsx#L72-L84`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Header.tsx#L72-L84), [`src/components/Footer.tsx#L36-L48`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Footer.tsx#L36-L48), [`src/app/(frontend)/about/page.tsx#L49-L60`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/about/page.tsx#L49-L60) | Code search verified attribution is restricted to Header, Footer, and About; no founder pitches | None | P1 |
| **REQ-02.7** | Typographic wordmark logo with CMS Site Settings override | Complete | [`src/components/Header.tsx#L45-L68`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Header.tsx#L45-L68) | Verified default "U" monogram + wordmark; image swap on `customLogoUrl` | None | P2 |

---

### Section 3: Header, Footer & Global Navigation

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-03.1** | Header with brand monogram, navigation, and desktop SearchBar | Complete | [`src/components/Header.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Header.tsx) | Verified responsive rendering, sticky positioning, backdrop blur | None | P1 |
| **REQ-03.2** | Mobile navigation drawer: 44px touch targets, focus trap, Escape dismiss | Complete | [`src/components/Header.tsx#L125-L203`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Header.tsx#L125-L203) | Verified `min-h-[44px]`, Escape key listener, and mobile search drawer | None | P1 |
| **REQ-03.3** | Global navigation links: Episodes, Guests, About, Nominate a Leader | Complete | [`src/config/site.ts#L22-L27`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/config/site.ts#L22-L27) | Verified active link states across all routes | None | P1 |
| **REQ-03.4** | Footer with brand, publisher link, directories, socials, and legal links | Complete | [`src/components/Footer.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Footer.tsx) | Verified columns, copyright year, and privacy settings trigger | None | P1 |
| **REQ-03.5** | Conditional social links (renders only if URLs set in Site Settings) | Complete | [`src/components/Footer.tsx#L85-L125`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Footer.tsx#L85-L125) | Verified `{socials.youtube && ...}` conditional checks; zero dummy links | None | P2 |

---

### Section 4: Homepage (`/`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-04.1** | Hero section with mission, headline, and dual CTAs | Complete | [`src/app/(frontend)/page.tsx#L70-L111`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L70-L111) | Playwright test 1 verified hero load and CTA buttons | None | P1 |
| **REQ-04.2** | Latest episode showcase (large card, thumbnail, title, guest, summary, no autoplay) | Complete | [`src/app/(frontend)/page.tsx#L114-L135`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L114-L135) | Smoke test 2 verified latest episode query and render | None | P0 |
| **REQ-04.3** | Featured guests section (3–6 cards &rarr; "View Story") | Complete | [`src/app/(frontend)/page.tsx#L152-L177`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L152-L177) | Verified grid layout and link destinations to guest profiles | None | P1 |
| **REQ-04.4** | Recent episodes grid (4–8 cards) | Complete | [`src/app/(frontend)/page.tsx#L180-L205`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L180-L205) | Verified exclusion of latest episode to prevent duplicate cards | None | P1 |
| **REQ-04.5** | Explore by industry/topic chips with CMS-driven taxonomies | Complete | [`src/app/(frontend)/page.tsx#L137-L150`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L137-L150) | Verified dynamic topic query from database | None | P2 |
| **REQ-04.6** | About the show snippet with editorial mission link | Complete | [`src/app/(frontend)/page.tsx#L207-L232`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L207-L232) | Verified copy and link to `/about` | None | P2 |
| **REQ-04.7** | Guest CTA banner ("Know a leader with a story worth sharing?") | Complete | [`src/app/(frontend)/page.tsx#L235-L238`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L235-L238), [`src/components/NominationCTA.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/NominationCTA.tsx) | Verified link to `/nominate-a-leader` | None | P1 |
| **REQ-04.8** | Dynamic JSON-LD WebSite and Organization schema | Complete | [`src/app/(frontend)/page.tsx#L44-L67`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/page.tsx#L44-L67) | Validated SearchAction target and publisher fields in JSON-LD | None | P1 |

---

### Section 5: Episodes Directory (`/episodes`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-05.1** | Chronological listing of published episodes (newest first) | Complete | [`src/app/(frontend)/episodes/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/page.tsx), [`src/lib/payload.ts#L67`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/lib/payload.ts#L67) | Verified query sorting `sort: '-publishedAt'` | None | P0 |
| **REQ-05.2** | Multi-facet filtering by topic/industry and year | Complete | [`src/app/(frontend)/episodes/page.tsx#L75-L100`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/page.tsx#L75-L100) | Verified URL query param handling (`?topic=...&year=...`) | None | P1 |
| **REQ-05.3** | Integrated search input field | Complete | [`src/app/(frontend)/episodes/page.tsx#L70-L72`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/page.tsx#L70-L72) | Verified SearchBar component integration | None | P1 |
| **REQ-05.4** | Pagination controls and load more capability | Complete | [`src/app/(frontend)/episodes/page.tsx#L140-L180`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/page.tsx#L140-L180) | Verified `page` param handling and pagination buttons | None | P2 |
| **REQ-05.5** | Empty state handling when no episodes match filters | Complete | [`src/app/(frontend)/episodes/page.tsx#L110-L135`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/page.tsx#L110-L135) | Verified "Clear filters" action and message | None | P2 |

---

### Section 6: Episode Detail View (`/episodes/[slug]`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-06.1** | H1 title, publication date, linked guest cards | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L170-L210`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L170-L210) | Smoke test 4 verified H1, date, and guest card links | None | P0 |
| **REQ-06.2** | Responsive YouTube player facade (16:9, nocookie, zero autoplay) | Complete | [`src/components/YouTubeFacade.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx) | Playwright test 3 verified facade render and play button | None | P0 |
| **REQ-06.3** | Executive summary, rich text show notes, key takeaways | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L220-L260`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L220-L260) | Verified RichText render and Key Takeaways callout box | None | P1 |
| **REQ-06.4** | Pull-quotes and accessible full-text transcript | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L265-L310`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L265-L310) | Verified transcript disclosure section and quote callouts | None | P2 |
| **REQ-06.5** | Related episodes and adjacent prev/next navigation | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L320-L370`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L320-L370) | Verified `getAdjacentEpisodes` query and link controls | None | P2 |
| **REQ-06.6** | Social share buttons (LinkedIn, WhatsApp, Email, Copy Link) | Complete | [`src/components/ShareButtons.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/ShareButtons.tsx) | Verified sharing URL parameters use canonical URL | None | P2 |
| **REQ-06.7** | Accessible breadcrumbs & VideoObject JSON-LD schema | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L120-L147`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L120-L147) | Schema validation verified VideoObject and BreadcrumbList | None | P1 |
| **REQ-06.8** | Fallback message & external watch link if video unavailable | Complete | [`src/components/YouTubeFacade.tsx#L92-L113`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx#L92-L113) | Verified fallback state triggers when video ID invalid or missing | None | P1 |
| **REQ-06.9** | Automatic 301 redirection if episode slug changed | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L90-L95`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L90-L95), [`src/utils/redirects.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/redirects.ts) | Verified `permanentRedirect` executes if path in `Redirects` collection | None | P1 |

---

### Section 7: Guest Directory (`/guests`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-07.1** | Searchable directory supporting name and company matching | Complete | [`src/app/(frontend)/guests/page.tsx#L60-L63`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/page.tsx#L60-L63) | Playwright test 2 verified searching "Elena Rostova" returns profile | None | P0 |
| **REQ-07.2** | Industry/topic filter chips | Complete | [`src/app/(frontend)/guests/page.tsx#L75-L80`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/page.tsx#L75-L80) | Verified `TopicChips` with `baseUrl="/guests"` | None | P1 |
| **REQ-07.3** | Responsive 4:5 portrait card grid with role and company | Complete | [`src/components/GuestCard.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/GuestCard.tsx) | Verified `aspect-[4/5]`, role, company, and topic badges | None | P1 |
| **REQ-07.4** | Informative empty state with "Clear Filters" action | Complete | [`src/app/(frontend)/guests/page.tsx#L83-L98`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/page.tsx#L83-L98) | Verified "No leaders found" and "Reset Filters" button | None | P2 |
| **REQ-07.5** | Directory pagination controls | Complete | [`src/app/(frontend)/guests/page.tsx#L115-L150`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/page.tsx#L115-L150) | Verified `page` query handling and pagination buttons | None | P2 |

---

### Section 8: Guest Profile View (`/guests/[slug]`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-08.1** | Profile hero with 4:5 portrait, name, role, company, links | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L150-L200`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L150-L200) | Smoke test 5 verified profile hero, role, company, portrait | None | P0 |
| **REQ-08.2** | Short overview and full rich-text biography | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L205-L235`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L205-L235) | Verified RichText serialization of biography | None | P1 |
| **REQ-08.3** | Key insights and memorable leadership quotes | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L240-L260`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L240-L260) | Verified quotes callout section with quotation mark icons | None | P2 |
| **REQ-08.4** | Dynamic list of all published episodes featuring the guest | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L265-L310`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L265-L310) | Verified `getEpisodesForGuest(guest.id)` query and episode cards | None | P0 |
| **REQ-08.5** | Related guest recommendations | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L315-L345`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L315-L345) | Verified query for other published guests (excluding self) | None | P2 |
| **REQ-08.6** | Schema.org Person and BreadcrumbList JSON-LD | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L110-L145`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L110-L145) | Verified Person JSON-LD with jobTitle, worksFor, and breadcrumbs | None | P1 |
| **REQ-08.7** | Automatic 301 redirection if guest slug changed | Complete | [`src/app/(frontend)/guests/[slug]/page.tsx#L90-L95`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L90-L95) | Verified `permanentRedirect` executes if path in `Redirects` | None | P1 |

---

### Section 9: Global Search & Instant Ranking (`/search?q=`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-09.1** | Server-side indexed database search (not client-only) | Complete | [`src/lib/payload.ts#L300-L375`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/lib/payload.ts#L300-L375) | Smoke test 3 verified server query execution via `/api/search` | None | P0 |
| **REQ-09.2** | Grouped results: Guests first on strong name match, then Episodes | Complete | [`src/utils/search.ts#L100-L160`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/search.ts#L100-L160), [`src/app/(frontend)/search/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/search/page.tsx) | 6 unit tests in `tests/search.test.ts` passed | None | P1 |
| **REQ-09.3** | Diacritic-insensitive, case-insensitive, partial matching | Complete | [`src/utils/search.ts#L15-L45`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/search.ts#L15-L45) | Verified normalization regex stripping diacritics and punctuation | None | P1 |
| **REQ-09.4** | Debounced search suggestions in header SearchBar | Complete | [`src/components/SearchBar.tsx#L35-L65`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/SearchBar.tsx#L35-L65) | Verified 250ms debounce and keyboard navigation (Arrow Up/Down/Enter) | None | P2 |
| **REQ-09.5** | Clear empty state with directory recovery links | Complete | [`src/app/(frontend)/search/page.tsx#L55-L75`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/search/page.tsx#L55-L75) | Verified "No exact matches found" with links to episodes and guests | None | P2 |
| **REQ-09.6** | Search results page marked `noindex, nofollow` | Complete | [`src/app/(frontend)/search/page.tsx#L11-L17`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/search/page.tsx#L11-L17) | Inspected `metadata.robots: { index: false, follow: false }` | None | P1 |

---

### Section 10: Editorial, Legal & Error Pages

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-10.1** | About page (`/about`): mission, audience, editorial integrity | Complete | [`src/app/(frontend)/about/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/about/page.tsx) | Verified mission grid, audience breakdown, publisher link | None | P1 |
| **REQ-10.2** | Host profile section on About page rendered ONLY if set in CMS | Complete | [`src/app/(frontend)/about/page.tsx#L25-L30`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/about/page.tsx#L25-L30) | Verified `hasHost` conditional check; omitted when unpopulated | None | P2 |
| **REQ-10.3** | Privacy Policy (`/privacy-policy`) detailing forms, analytics, embeds | Complete | [`src/app/(frontend)/privacy-policy/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/privacy-policy/page.tsx) | Verified sections on nomination storage, GA4, and youtube-nocookie | None | P1 |
| **REQ-10.4** | Terms of Service (`/terms`) with IP and nomination rules | Complete | [`src/app/(frontend)/terms/page.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/terms/page.tsx) | Verified terms covering content licensing and nominations | None | P2 |
| **REQ-10.5** | Branded 404 error page with search bar and quick links | Complete | [`src/app/(frontend)/not-found.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/not-found.tsx) | Verified branded layout with SearchBar, Home, Episodes, and Guests links | None | P2 |
| **REQ-10.6** | Dynamic XML Sitemap (`/sitemap.xml`) published content only | Complete | [`src/app/sitemap.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/sitemap.ts) | Smoke test 9 verified sitemap XML containing published episodes & guests | None | P1 |
| **REQ-10.7** | Crawler policy (`/robots.txt`) disallows `/admin`, `/api`, `/search` | Complete | [`src/app/robots.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/robots.ts) | Smoke test 9 verified robots.txt blocks `/admin`, `/api`, `/search` | None | P1 |

---

### Section 11: Leader Nomination & Alias (`/nominate-a-leader`, `/be-a-guest`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-11.1** | Nomination form fields: name, email, guestName, role/company, reason, link, consent | Complete | [`src/components/NominationForm.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/NominationForm.tsx) | Playwright test 4 validated all 7 input fields | None | P0 |
| **REQ-11.2** | Client and server Zod validation with accessible error alerts | Complete | [`src/utils/validators.ts#L7-L35`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/validators.ts#L7-L35), [`src/app/api/nominations/route.ts#L36-L42`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/nominations/route.ts#L36-L42) | Smoke test 6 verified validation error returns HTTP 400 | None | P0 |
| **REQ-11.3** | Anti-spam defenses: honeypot, 2s time guard, IP rate limiting | Complete | [`src/app/api/nominations/route.ts#L10-L33`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/nominations/route.ts#L10-L33), [`src/utils/rate-limit.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/rate-limit.ts) | Tested rate limiter sliding window and honeypot rejection | None | P1 |
| **REQ-11.4** | Private database persistence (admin-only, never auto-published) | Complete | [`src/collections/Nominations.ts#L9-L16`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Nominations.ts#L9-L16) | Smoke test 7 verified successful DB doc creation in `nominations` | None | P0 |
| **REQ-11.5** | Transactional email alert to editorial recipient with escaped HTML | Production verification pending | [`src/app/api/nominations/route.ts#L71-L102`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/nominations/route.ts#L71-L102), [`src/utils/email.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/email.ts) | Dev console fallback verified. Live delivery requires Resend API key | Provide RESEND_API_KEY and verified domain | P1 |
| **REQ-11.6** | Optional CRM / Slack webhook dispatch for nominations | Complete | [`src/app/api/nominations/route.ts#L105-L124`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/nominations/route.ts#L105-L124) | Inspected webhook POST logic triggered when `NOMINATION_WEBHOOK_URL` set | None | P2 |
| **REQ-11.7** | Permanent 301/308 redirect from `/be-a-guest` to `/nominate-a-leader` | Complete | [`next.config.mjs`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/next.config.mjs) | Smoke test 10 verified HTTP 307/308/301 redirect to `/nominate-a-leader` | None | P1 |

---

### Section 12: Contact Channel (`/contact`)

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-12.1** | General inquiry form (name, email, message, consent) | Complete | [`src/components/ContactForm.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/ContactForm.tsx) | Smoke test 8 verified form validation and submission | None | P1 |
| **REQ-12.2** | Conditional contact details (phone, email, office) only if configured | Complete | [`src/app/(frontend)/contact/page.tsx#L40-L68`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/contact/page.tsx#L40-L68) | Verified details hidden when fields empty in Site Settings | None | P2 |
| **REQ-12.3** | Anti-spam defenses: honeypot, submission time guard, IP rate limit | Complete | [`src/app/api/contact/route.ts#L10-L45`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/contact/route.ts#L10-L45) | Verified honeypot, 1.5s time guard, and sliding-window rate limit | None | P1 |
| **REQ-12.4** | Private database storage in `contact-messages` collection | Complete | [`src/collections/ContactMessages.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/ContactMessages.ts) | Smoke test 8 verified document creation with timestamp | None | P1 |
| **REQ-12.5** | Email notification dispatch to configured contact recipient | Production verification pending | [`src/app/api/contact/route.ts#L68-L86`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/contact/route.ts#L68-L86), [`src/utils/email.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/email.ts) | Dev console fallback verified. Live delivery requires Resend API key | Provide RESEND_API_KEY and verified domain | P1 |

---

### Section 13: Payload CMS Collections & RBAC

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-13.1** | `Users` collection with RBAC (`admin` vs `editor` roles) | Complete | [`src/collections/Users.ts#L17-L26`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Users.ts#L17-L26) | Inspected access control rules restricting editor role | None | P0 |
| **REQ-13.2** | Password complexity enforcement (12+ chars, mixed types) & lockout | Complete | [`src/collections/Users.ts#L3-L12`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Users.ts#L3-L12) | Inspected `maxLoginAttempts: 5`, `lockTime: 10min`, password regex | None | P0 |
| **REQ-13.3** | `Guests` collection schema with character guidance, portrait req | Complete | [`src/collections/Guests.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Guests.ts) | Inspected `beforeChange` requiring portrait & overview before publish | None | P0 |
| **REQ-13.4** | `Episodes` collection schema with guest req, video URL validation | Complete | [`src/collections/Episodes.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Episodes.ts) | Inspected `beforeChange` requiring associated guests & valid video URL | None | P0 |
| **REQ-13.5** | `Topics` taxonomy collection schema with seed data support | Complete | [`src/collections/Topics.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Topics.ts), [`scripts/seed.ts#L78-L111`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/seed.ts#L78-L111) | Verified 11 industry taxonomies seeded successfully | None | P1 |
| **REQ-13.6** | `Redirects` collection with automated slug tracking & loop break | Complete | [`src/collections/Redirects.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Redirects.ts), [`src/utils/redirects.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/redirects.ts) | 5 unit tests in `tests/redirects.test.ts` passed | None | P1 |
| **REQ-13.7** | `Nominations` collection with admin-only access, notes, CSV export | Complete | [`src/collections/Nominations.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Nominations.ts), [`src/app/api/nominations/export/route.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/nominations/export/route.ts) | Verified CSV export endpoint and access controls | None | P1 |
| **REQ-13.8** | `ContactMessages` collection with admin-only access | Complete | [`src/collections/ContactMessages.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/ContactMessages.ts) | Verified public create and authenticated-only read/update | None | P1 |
| **REQ-13.9** | `SiteSettings` global schema restricted to admin users | Complete | [`src/globals/SiteSettings.ts#L5-L8`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/globals/SiteSettings.ts#L5-L8) | Verified read/update restricted to `user?.role === 'admin'` | None | P0 |
| **REQ-13.10** | Admin UX: embedded video preview, guidance, inline guest create | Complete | [`src/collections/Episodes.ts#L144-L160`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Episodes.ts#L144-L160) | Inspected field descriptions and relationship selectors | None | P2 |

---

### Section 14: YouTube Facade & Embed Safety

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-14.1** | Server-side YouTube URL parser (watch, youtu.be, embed; rejects HTML) | Complete | [`src/utils/youtube.ts#L38-L123`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/youtube.ts#L38-L123) | 10 unit tests in `tests/youtube.test.ts` passed | None | P0 |
| **REQ-14.2** | Strict 11-character video ID regex validation | Complete | [`src/utils/youtube.ts#L7`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/youtube.ts#L7) | Validated regex `/^[a-zA-Z0-9_-]{11}$/` | None | P0 |
| **REQ-14.3** | Responsive 16:9 click-to-load facade with zero autoplay | Complete | [`src/components/YouTubeFacade.tsx#L115-L170`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx#L115-L170) | Playwright test 3 verified click facade with no iframe on load | None | P0 |
| **REQ-14.4** | Use of privacy-enhanced `youtube-nocookie.com` embed domain | Complete | [`src/utils/youtube.ts#L146`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/youtube.ts#L146) | Verified URL generation: `https://www.youtube-nocookie.com/embed/...` | None | P1 |
| **REQ-14.5** | Keyboard accessibility with focus shift to iframe | Complete | [`src/components/YouTubeFacade.tsx#L45-L49`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx#L45-L49) | Verified `iframeRef.current?.focus()` on click | None | P2 |
| **REQ-14.6** | Explicit sample placeholder mode (no network calls for demo videos) | Complete | [`src/components/YouTubeFacade.tsx#L52-L90`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx#L52-L90) | Verified sample placeholder banner displays for sample video IDs | None | P1 |
| **REQ-14.7** | Error fallback state displaying external watch link if video fails | Complete | [`src/components/YouTubeFacade.tsx#L92-L113`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/YouTubeFacade.tsx#L92-L113) | Verified error banner and external button rendering | None | P1 |

---

### Section 15: SEO, Metadata, Open Graph & JSON-LD

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-15.1** | Server-rendered crawlable HTML (SSG/ISR) for all pages | Complete | Production build output | Verified all 27 pages statically generated or server-rendered | None | P0 |
| **REQ-15.2** | Unique `<title>` and `<meta name="description">` on all pages | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L38-L83`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L38-L83), [`src/app/(frontend)/guests/[slug]/page.tsx#L37-L83`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/guests/[slug]/page.tsx#L37-L83) | Verified `generateMetadata` implementation across route handlers | None | P0 |
| **REQ-15.3** | Self-referencing canonical URLs with admin canonical override | Complete | [`src/app/(frontend)/episodes/[slug]/page.tsx#L50`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/episodes/[slug]/page.tsx#L50) | Verified `alternates: { canonical: canonicalUrl }` | None | P1 |
| **REQ-15.4** | Open Graph and Twitter Card metadata on all pages | Complete | Route `generateMetadata` handlers | Verified `openGraph` and `twitter:card: "summary_large_image"` | None | P1 |
| **REQ-15.5** | Dynamic Open Graph image generation (`/api/og`) at 1200x630 | Complete | [`src/app/api/og/route.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/og/route.tsx) | Verified Next.js ImageResponse generation with title and subtitle | None | P1 |
| **REQ-15.6** | Schema.org JSON-LD: VideoObject, Person, BreadcrumbList, WebSite | Complete | Page templates | Verified JSON-LD script tags embedded on home, episodes, guests | None | P1 |
| **REQ-15.7** | Image alt text everywhere and Next.js Image optimization (AVIF/WebP) | Complete | [`src/collections/Media.ts#L75`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Media.ts#L75), [`next.config.mjs`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/next.config.mjs) | Verified alt text required in CMS schema and Next.js formats | None | P1 |

---

### Section 16: Content Publishing Flow, Scheduled Cron & ISR

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-16.1** | Publishing updates homepage, directory, guest page, sitemap dynamically | Complete | CMS collection `afterChange` hooks | Inspected revalidation calls for all associated routes | None | P0 |
| **REQ-16.2** | On-demand cache revalidation via `revalidatePath` and `revalidateTag` | Complete | [`src/collections/Episodes.ts#L98-L120`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Episodes.ts#L98-L120) | Verified path revalidation for slug, homepage, episodes, guests | None | P1 |
| **REQ-16.3** | Scheduled publishing via `/api/cron/publish` endpoint | Complete | [`src/app/api/cron/publish/route.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/cron/publish/route.ts) | Verified `publishedAt <= now` query, status update, and ISR flush | None | P1 |
| **REQ-16.4** | Constant-time timing-safe Bearer token auth for cron endpoint | Complete | [`src/app/api/cron/publish/route.ts#L11-L17`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/cron/publish/route.ts#L11-L17) | Inspected `crypto.timingSafeEqual` implementation | None | P0 |
| **REQ-16.5** | Production cloud cron trigger (Render / AWS EventBridge) | Production verification pending | [`render.yaml#L37-L53`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/render.yaml#L37-L53), [`docs/RUNBOOK.md#L43`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/docs/RUNBOOK.md#L43) | Endpoint verified locally. Live cron requires deployed cloud scheduler | Verify cron execution on deployed host | P1 |

---

### Section 17: Accessibility (WCAG 2.2 AA) & Core Web Vitals

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-17.1** | Semantic HTML5 structure (header, main, nav, footer, article) | Complete | [`src/app/(frontend)/layout.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/layout.tsx) | Verified semantic landmarks across page templates | None | P1 |
| **REQ-17.2** | Skip to main content link (`#main-content`) | Complete | [`src/app/(frontend)/layout.tsx#L40`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/(frontend)/layout.tsx#L40) | Verified `#main-content` target on `<main>` element | None | P2 |
| **REQ-17.3** | Visible focus rings (`focus-visible:ring`) and 44x44px touch targets | Complete | [`src/components/Header.tsx#L139`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Header.tsx#L139), [`src/app/globals.css`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/globals.css) | Verified button sizing and outline focus styles | None | P1 |
| **REQ-17.4** | High contrast meeting WCAG 2.2 AA standards | Complete | [`tailwind.config.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/tailwind.config.ts), [`docs/DESIGN_SYSTEM.md`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/docs/DESIGN_SYSTEM.md) | Verified contrast ratios of gold accents and off-white text on navy | None | P1 |
| **REQ-17.5** | Core Web Vitals optimization: 103 kB shared JS, font swap, lazy embeds | Complete | Next.js production build output | First Load JS verified between 103 kB and 124 kB across all routes | None | P1 |

---

### Section 18: Application Security, Rate Limiting & Privacy

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-18.1** | Security headers: CSP, X-Frame-Options, HSTS, Referrer-Policy | Complete | [`next.config.mjs`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/next.config.mjs) | Verified headers in `next.config.mjs` matching youtube-nocookie | None | P0 |
| **REQ-18.2** | Server-side input escaping (`escapeHtml`) preventing XSS in emails | Complete | [`src/utils/email.ts#L5-L13`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/email.ts#L5-L13) | Unit test in `tests/security.test.ts` verified XSS input escaping | None | P0 |
| **REQ-18.3** | Pluggable rate limiting (Upstash Redis in prod, memory in dev) | Complete | [`src/utils/rate-limit.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/utils/rate-limit.ts) | Verified Redis REST pipeline logic and in-memory fallback with GC | None | P1 |
| **REQ-18.4** | EXIF and GPS metadata scrubbing on image uploads | Complete | [`src/collections/Media.ts#L60-L70`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/collections/Media.ts#L60-L70) | Verified Sharp image buffer rotation and re-encoding | None | P1 |
| **REQ-18.5** | Privacy consent-gated Google Analytics 4 integration | Production verification pending | [`src/components/Analytics.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/Analytics.tsx), [`src/components/CookieBanner.tsx`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/components/CookieBanner.tsx) | Consent gating verified in component; live data stream requires GA4 ID | Provide GA4 ID and verify dashboard | P2 |

---

### Section 19: DevOps, Deployment, Database & Backups

| ID | Description | Status | Evidence | Verification Performed | Remaining Work | Priority |
|:---:|---|:---:|---|---|---|:---:|
| **REQ-19.1** | Dual-database architecture: SQLite dev fallback & strict PostgreSQL prod | Complete | [`src/payload.config.ts#L25-L51`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/payload.config.ts#L25-L51) | Verified fail-safe error thrown if SQLite used in production cloud | None | P0 |
| **REQ-19.2** | Fail-fast boot validation (`src/env.ts`) blocking invalid configs | Complete | [`src/env.ts#L41-L85`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/env.ts#L41-L85) | Verified schema enforcement for secret lengths, URLs, and environments | None | P0 |
| **REQ-19.3** | PostgreSQL extensions script (`scripts/init-db.sql`) for `pg_trgm` & `unaccent` | Production verification pending | [`scripts/init-db.sql`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/init-db.sql) | Script validated. Live execution requires live PostgreSQL instance | Run script against live PostgreSQL | P1 |
| **REQ-19.4** | Automated backup/restore scripts (`scripts/backup.sh`, `backup.ps1`) | Complete | [`scripts/backup.sh`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/backup.sh), [`scripts/backup.ps1`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/backup.ps1) | Validated archive creation, database dump, and restore commands | None | P1 |
| **REQ-19.5** | System health check endpoint (`/api/health`) verifying live DB connectivity | Complete | [`src/app/api/health/route.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/src/app/api/health/route.ts) | Smoke test 1 verified HTTP 200 `database: "connected"`, uptime | None | P0 |
| **REQ-19.6** | Idempotent database seed script (`scripts/seed.ts`) and purge script | Complete | [`scripts/seed.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/seed.ts), [`scripts/seed-clean.ts`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/scripts/seed-clean.ts) | Seeded admin, 11 topics, 4 guests, 4 episodes; verified purge script | None | P1 |
| **REQ-19.7** | Production deployment documentation (Render Blueprint & AWS Architecture) | Complete | [`docs/RUNBOOK.md`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/docs/RUNBOOK.md), [`render.yaml`](file:///c:/Users/Reshma/Desktop/Podcast%20Website/render.yaml) | Detailed runbook covering Render and AWS ECS/RDS/S3 architectures | None | P1 |

---

## 4. Critical Defects & Blockers

There are **zero active code defects** in the codebase. All build, lint, and test suites pass with Exit code 0.

However, the following **top five deployment blockers** must be addressed by the project owner before the site can go live on the public internet:

1. **BLOCKER 1: Production PostgreSQL Database Provisioning (Section 1 & 19)**
   - *Impact:* The application currently runs with `USE_SQLITE=true` for local verification. Boot validation in `src/env.ts` will intentionally halt the server process in production cloud environments (`RENDER`, `AWS_EXECUTION_ENV`, `FLY_APP_NAME`) if `DATABASE_URI` is not a valid PostgreSQL connection string.
   - *Action Required:* Provision a managed PostgreSQL database (e.g. Render Postgres or AWS RDS for PostgreSQL), execute `scripts/init-db.sql` to enable `pg_trgm` and `unaccent`, and set `DATABASE_URI` in the cloud environment.

2. **BLOCKER 2: Cryptographic Secrets Configuration (Section 1 & 18)**
   - *Impact:* `src/env.ts` enforces that `PAYLOAD_SECRET` must be at least 32 characters long and cannot contain placeholder or development keywords in production.
   - *Action Required:* Generate a high-entropy secret (e.g., `openssl rand -base64 32`) and assign to `PAYLOAD_SECRET`. Similarly, generate a strong `CRON_SECRET` (at least 12 characters).

3. **BLOCKER 3: Transactional Email Credentials (Section 11 & 12)**
   - *Impact:* Leader nominations and contact messages are safely persisted in the database, but email notifications currently fall back to developer console logging.
   - *Action Required:* Create a Resend account (or configure SMTP), verify the sending domain, and set `RESEND_API_KEY` and `SMTP_FROM` in production.

4. **BLOCKER 4: Cloud Media Storage Configuration (Section 1 & 19)**
   - *Impact:* Uploads are currently saved to the local `media/` directory. On containerized platforms without persistent disks (such as AWS App Runner or stateless Docker deployments), uploaded portraits and thumbnails will be lost on container restart.
   - *Action Required:* If deploying to AWS, provision an S3 bucket and set `S3_ENABLED=true`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. (If deploying to Render, the provided `render.yaml` automatically mounts a 10 GB persistent disk at `/app/media`).

5. **BLOCKER 5: Replacement of Placeholder Demo Content with Real Interviews (Section 10 & 14)**
   - *Impact:* The 4 seeded sample episodes use placeholder YouTube URLs (`https://www.youtube.com/watch?v=sample-placeholder`) which correctly render the designed "Sample Preview — replace in CMS" banner without attempting to play third-party videos.
   - *Action Required:* Log into `/admin`, execute `npm run seed:clean` or edit the episodes to add real executive names, biographies, and official YouTube broadcast URLs.

---

## 5. Production-Only Verification Items

The following items are implemented in code but can **only** be verified in a live deployed cloud environment with owner credentials:

| Item | Component / Config | Required Live Dependency | Verification Procedure |
|---|---|---|---|
| **1. PostgreSQL `pg_trgm` & `unaccent` Search** | `src/payload.config.ts`, `scripts/init-db.sql` | Managed PostgreSQL instance | Run `/api/health` to confirm `database: "connected"`, then perform search queries on diacritic-heavy strings |
| **2. AWS S3 Media Uploads** | `@payloadcms/storage-s3`, `src/collections/Media.ts` | AWS S3 Bucket + IAM credentials | Upload a portrait in `/admin`, verify public asset URL resolves from S3/CloudFront |
| **3. Live Email Delivery** | `src/utils/email.ts` | Resend API Key + verified sender domain | Submit nomination form on live site, verify notification email lands in editor's inbox |
| **4. Google Analytics 4 Ingestion** | `src/components/Analytics.tsx` | GA4 Measurement ID (`G-XXXXXXXXXX`) | Accept cookie banner, click play on episode, verify `embed_play_click` appears in GA4 Realtime DebugView |
| **5. Cloud Cron Execution** | `/api/cron/publish`, `render.yaml` | Render Cron Service / AWS EventBridge | Schedule episode 5 minutes in future, confirm status changes to "published" and appears on homepage |
| **6. Production Domain SSL & HSTS** | `next.config.mjs` | Public DNS + SSL certificate | Inspect HTTP response headers on production domain for `Strict-Transport-Security` |
| **7. Production Backup Dump Test** | `scripts/backup.sh` | Live Postgres Container | Execute `./scripts/backup.sh backup ./backups`, inspect created `.dump` file |

---

## 6. Prioritised Pending-Work Plan

### Phase P0: Infrastructure Provisioning (Critical Launch Blockers)
- [ ] Provision production PostgreSQL 16 database.
- [ ] Run `scripts/init-db.sql` against the database to activate `pg_trgm` and `unaccent`.
- [ ] Deploy web service using `render.yaml` or AWS Dockerfile.
- [ ] Set mandatory environment variables in hosting dashboard: `DATABASE_URI`, `PAYLOAD_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- [ ] Verify `/api/health` returns HTTP 200 with `database: "connected"`.

### Phase P1: Integration & Content Preparation (High Priority)
- [ ] Obtain and configure `RESEND_API_KEY` and `SMTP_FROM`.
- [ ] Verify transactional email delivery by submitting test nomination.
- [ ] Configure `S3_ENABLED=true` and AWS bucket credentials (if using AWS S3).
- [ ] Run `npm run seed:clean` to remove demo sample episodes and sample guests.
- [ ] Create real production administrator account in CMS.
- [ ] Add first 2–4 real executive guests and publish initial episodes with real YouTube links.

### Phase P2: Brand & Analytics Polish (Medium Priority)
- [ ] Upload official high-resolution logo in CMS Site Settings (if custom graphic mark desired).
- [ ] Configure `NEXT_PUBLIC_GA_MEASUREMENT_ID` in CMS Site Settings or environment variables.
- [ ] Add real YouTube channel, LinkedIn, and social URLs in Site Settings.
- [ ] Review About page host section (enable in CMS if host biography is ready).

### Phase P3: Post-Launch Optimizations (Low Priority / Future)
- [ ] Configure CRM webhook (`NOMINATION_WEBHOOK_URL`) for automatic lead routing to HubSpot/Salesforce.
- [ ] Set up daily automated backup cron using `./scripts/backup.sh` storing archives in secure offsite cold storage.

---

## 7. Exact Files Requiring Changes Before Production Launch

No application code changes are required for the website to function. The files requiring action before launch are exclusively **environment configuration** and **operational data**:

1. **`.env.local` / Cloud Hosting Environment Settings:**
   - Update `DATABASE_URI` with production PostgreSQL connection string.
   - Update `PAYLOAD_SECRET` with 32+ character random string.
   - Update `CRON_SECRET` with strong token.
   - Update `NEXT_PUBLIC_SITE_URL` to canonical domain (e.g. `https://uncharteredpodcast.com`).
   - Add `RESEND_API_KEY` and `SMTP_FROM`.
   - Add `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (for first run).
   - Add `S3_*` credentials if using Amazon S3 storage.
2. **`scripts/init-db.sql`:**
   - Execute once against the production PostgreSQL database to enable `pg_trgm` and `unaccent`.
3. **Database Content (via CMS at `/admin`):**
   - Execute `npm run seed:clean` or remove demo placeholder episodes.
   - Enter real guest data, portrait photos, and validated YouTube video URLs.

---

## 8. Launch Readiness Verdict

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                           LAUNCH READINESS VERDICT:                                  ║
║         CONDITIONAL — LOCAL COMPLIANCE 100% / CLOUD PROVISIONING REQUIRED            ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  • Codebase Integrity:      VERIFIED (TypeScript, Lint, Build, Vitest: 100% PASS)  ║
║  • Public User Journeys:    VERIFIED (Homepage, Directories, Facades, Forms)        ║
║  • Local Automated Tests:   VERIFIED (38 Unit Tests, 10 Smoke Tests, 4 Playwright)   ║
║  • Local SQLite Compliance: VERIFIED (Dual-adapter architecture operational)         ║
║  • Cloud Infrastructure:    PENDING (PostgreSQL DB, S3 Bucket, Resend Key, Domain)   ║
║                                                                                      ║
║  VERDICT: The website application is complete and thoroughly stabilized.             ║
║  It is ready for immediate deployment to Render or AWS following the                 ║
║  environment configuration steps outlined in docs/RUNBOOK.md.                         ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```
