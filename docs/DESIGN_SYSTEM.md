# Design System Specification — "Unchartered: Legends & Legacies"

**Publisher:** AI Automation Labs ([automationlabs.online](https://automationlabs.online/))  
**Aesthetic Vision:** Cinematic, editorial, timeless, and authoritative. Avoid generic tech-bro aesthetics and off-the-shelf templates.

---

## 1. Color Palette & Semantic Tokens

Our color strategy centers on deep oceanic navy surfaces, rich warm gold accents denoting leadership and craftsmanship, and crisp off-white typography for effortless legibility.

| Token | Hex / HSL | Usage & Context |
|---|---|---|
| `--bg-dark` | `#080D16` | Viewport backdrop, outer margins, deep vignette shadows |
| `--bg-navy` | `#0B1220` | Primary application body background |
| `--bg-surface` | `#121C2F` | Card backgrounds, inputs, secondary panels |
| `--bg-surface-hover` | `#18253D` | Interactive card hover state |
| `--border-subtle` | `#1F2E47` | Subtle dividers, card borders, form outlines |
| `--accent-gold` | `#C9A961` | Primary editorial badge, focus rings, play button, highlights |
| `--accent-gold-hover` | `#D9BE7B` | Interactive gold hover state |
| `--accent-blue` | `#2563EB` | Sparing publisher accent (AI Automation Labs badge, external links) |
| `--text-primary` | `#F8FAFC` | Main headings, titles, active navigation |
| `--text-secondary` | `#94A3B8` | Body copy, meta descriptions, secondary attributes |
| `--text-muted` | `#64748B` | Footnotes, timestamps, breadcrumbs, placeholder text |

---

## 2. Typography Scale

We pair a high-contrast editorial display serif for headlines with a clean, highly legible grotesque sans-serif for structured UI and long-form reading.

### Font Families
- **Display Serif:** `Fraunces` (Google Fonts) / fallback Georgia / serif
  - Applied to `h1`, `h2`, `h3`, `h4`, quotes, and brand wordmark.
  - Letter-spacing: `-0.02em` for tight, commanding editorial presence.
- **Body & UI Sans:** `Inter` (Google Fonts) / system UI fallback
  - Applied to body text, metadata, navigation, inputs, and tables.
  - Line-height: `1.65`–`1.75` for comfortable reading measure (60–75 characters per line).

### Scale & Rhythm
- **Display 1 (Hero):** `text-4xl sm:text-5xl lg:text-6xl`, tracking `-0.025em`, leading tight.
- **Section Heading (H2):** `text-2xl sm:text-3xl`, tracking `-0.02em`.
- **Card Title (H3):** `text-lg sm:text-xl font-bold text-white`.
- **Pull Quote:** `text-xl sm:text-2xl italic font-serif leading-snug`.
- **Body Regular:** `text-sm sm:text-base leading-relaxed text-slate-300`.
- **Caption / Meta:** `text-xs uppercase tracking-widest font-semibold`.

---

## 3. Spatial System, Radii, & Elevation

### Spacing Scale
- `px-4 sm:px-6 lg:px-8`: Consistent page margin padding across viewports.
- `py-10 sm:py-16 lg:py-20`: Section vertical rhythm.
- `gap-6 sm:gap-8`: Card grid spacing.

### Border Radii
- **Cards & Facades:** `rounded-2xl` (`16px`)
- **Inputs & Dropdowns:** `rounded-xl` (`12px`)
- **Badges & Pills:** `rounded-full` (`9999px`)
- **Buttons:** `rounded-xl` (`12px`)

### Elevation & Glows
- `shadow-glow-gold`: `0 0 25px rgba(201, 169, 97, 0.25)` — Used on the YouTube play circle and hero highlights.
- `glass-panel`: `background: rgba(18, 28, 47, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(201, 169, 97, 0.15)`

---

## 4. Accessibility & Motion Tokens

### Accessible Contrast
- All gold text on navy backgrounds maintains WCAG 2.2 AA contrast ratios (> 4.5:1).
- Interactive focus state: `outline: 2px solid #C9A961; outline-offset: 3px;` for all keyboard navigation.
- Minimum touch target size: `44px x 44px` across all buttons, dropdown triggers, and links.

### Motion & Transitions
- Micro-interactions: `transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)`.
- Reduced Motion: Full `@media (prefers-reduced-motion: reduce)` override disables transitions and transforms for vestibular safety.
