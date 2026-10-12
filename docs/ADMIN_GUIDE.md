# Administrator Guide — "Unchartered: Legends & Legacies"

Welcome to the editorial management guide for **Unchartered: Legends & Legacies** (produced by **AI Automation Labs**). This document outlines operational workflows for editors, administrators, and producers using the embedded Payload CMS.

---

## 1. Accessing the Admin Panel

- **URL:** Navigate to `https://your-domain.com/admin` (or `http://localhost:3000/admin` in development).
- **Credentials:** Administrator credentials are set via environment variables (`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`).
- **User Roles:**
  - **Admin:** Complete access to users, site settings, global redirects, canonical overrides, and all content.
  - **Editor:** Full editorial capability to create, edit, schedule, and publish guests, episodes, and topics. Restricted from modifying system users or deleting core redirects.

---

## 2. Managing Guests

### 2.1 Creating a New Leader Profile
1. In the left navigation, click **Guests** &rarr; **Create New**.
2. **Full Name** *(Required)*: Enter the executive's formal name (e.g. *Dr. Elena Rostova*).
3. **Alternate Names** *(Optional)*: Add formal titles, maiden names, or colloquial names to enhance full-text and diacritic search indexing.
4. **URL Slug** *(Auto-generated)*: Automatically computed from the name. Editable before publishing.
5. **Role & Company**: Specify executive title (e.g. *Founder & CEO*) and company name.
6. **Short Overview** *(Required)*: Write a concise 40–100 word summary highlighting career scale and milestones. This appears in directory cards and search snippets.
7. **Full Biography** *(Required)*: Use the rich text editor to document their career trajectory, major decisions, and leadership history.
8. **Portrait Image** *(Required to publish)*: Upload a high-resolution portrait cropped to **4:5 aspect ratio** (e.g. 800×1000px).
9. **Industries & Topics**: Associate the guest with one or more taxonomy topics (e.g. *Technology*, *Infrastructure*).
10. **External Links**: Add verified LinkedIn and website URLs.
11. **Key Insights & Quotes**: Add memorable direct quotes or contrarian philosophy from the leader.
12. **Status**: Set to **Published** and click **Save**.

---

## 3. Creating & Publishing Episodes

### 3.1 Publishing a New Episode
1. Navigate to **Episodes** &rarr; **Create New**.
2. **Episode Title** *(Required)*: Enter the full editorial title (e.g. *Episode 1: The Quantum Horizon*).
3. **Featured Guests** *(Required)*: Link one or more existing guest profiles. (You can also click **Create New Guest** directly from the relationship selector without leaving the form).
4. **YouTube URL** *(Required)*: Paste a standard YouTube video link. Supported formats:
   - `https://www.youtube.com/watch?v=XXXXXXXXXXX`
   - `https://youtu.be/XXXXXXXXXXX`
   - `https://www.youtube.com/embed/XXXXXXXXXXX`
   *The system automatically validates and extracts the 11-character video ID on save.*
5. **Fallback Watch URL**: Provide an external watch URL in case the embedded player experiences platform limitations.
6. **Executive Summary** *(Required)*: Enter a 40–100 word synopsis.
7. **Show Notes & Description**: Enter the complete interview breakdown and timestamps in rich text.
8. **Key Takeaways**: Add 3–5 bullet points summarizing decisive strategic lessons.
9. **Episode Art / Thumbnail**: Upload a 16:9 custom thumbnail (1280×720px). If omitted, the high-res YouTube thumbnail is used as fallback automatically.
10. **Publication Date & Scheduling**:
    - **Immediate release:** Set date to current time and status to **Published**.
    - **Scheduled release:** Set future date and status to **Scheduled**. The background cron job will automatically publish the episode at that time.
11. Click **Save**. The episode will immediately appear on the homepage, `/episodes/`, linked guest profile(s), and the dynamic XML sitemap.

### 3.2 Handling Unavailable or Restricted YouTube Videos
If YouTube restricts third-party embedding for a video:
- The website renders a **graceful fallback box** stating *"Video Currently Unavailable"*.
- The fallback button links directly to the `Fallback Watch URL` so visitors can view the interview on YouTube without error.

---

## 4. Managing Slugs & URL Redirects

- **Automated 301 Redirects:** When an administrator updates the slug of an already-published guest or episode, the system automatically writes a **301 Permanent Redirect** entry in the `Redirects` collection.
- **Manual Redirects:**
  1. Navigate to **Redirects** &rarr; **Create New**.
  2. Enter **From** (e.g. `/be-a-guest`) and **To** (e.g. `/nominate-a-leader`).
  3. Select Type: `301 (Permanent)`.

---

## 5. Reviewing Nominations

- Public leader nominations submitted at `/nominate-a-leader` are saved directly to the **Nominations** collection.
- These submissions are strictly private and cannot be viewed by public visitors.
- Editorial staff can view nominee background notes, review status (`new`, `reviewed`, `contacted`, `declined`), and contact information.

---

## 6. Site Settings & Brand Customization

- Navigate to **Globals** &rarr; **Site Settings**.
- **Brand Spelling & Name:** If the owner transitions from *"Unchartered"* to *"Uncharted"*, the brand override field instantly updates the entire website without developer involvement.
- **Social Channels:** Add or remove YouTube, LinkedIn, and Twitter links. Unset links will automatically hide from the header and footer.
- **Hero Copy:** Modify homepage headline and mission text live.
- **Analytics:** Update the Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`).
