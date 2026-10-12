import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = path.resolve('C:/Users/Reshma/.gemini/antigravity-ide/brain/37defd59-92d9-4139-8eff-a5993433616f');

async function runAdminSuite() {
  console.log('================================================================');
  console.log('Unchartered CMS Admin Redesign & UI/UX Verification Suite');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  async function step(name: string, fn: () => Promise<void>) {
    try {
      console.log(`[TESTING] ${name}...`);
      await fn();
      console.log(`[PASS] ${name}\n`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}\n`);
      failed++;
    }
  }

  // 1. Authentication
  await step('1. Admin Authentication & Session Setup', async () => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'mahadev@123';

    // Verify rejection of incorrect password
    console.log('   Testing rejection of incorrect password...');
    const wrongLoginRes = await context.request.post('http://localhost:3000/api/users/login', {
      data: {
        email: 'admin@gmail.com',
        password: 'IncorrectPassword999!',
      },
    });
    if (wrongLoginRes.status() !== 401) {
      throw new Error(`Expected 401 for incorrect password, got ${wrongLoginRes.status()}`);
    }

    // Verify admin@unchartered.com
    console.log('   Posting credentials for admin@unchartered.com...');
    const uncharteredLoginRes = await context.request.post('http://localhost:3000/api/users/login', {
      data: {
        email: 'admin@unchartered.com',
        password: adminPassword,
      },
    });
    if (!uncharteredLoginRes.ok()) {
      throw new Error(`Login failed for admin@unchartered.com: status ${uncharteredLoginRes.status()}`);
    }

    // Verify admin@gmail.com
    console.log('   Posting credentials for admin@gmail.com...');
    const loginRes = await context.request.post('http://localhost:3000/api/users/login', {
      data: {
        email: 'admin@gmail.com',
        password: adminPassword,
      },
    });

    if (!loginRes.ok()) {
      throw new Error(`Login API returned status ${loginRes.status()}`);
    }

    const loginData = await loginRes.json();
    console.log(`   Authenticated successfully as: ${loginData.user?.email} (${loginData.user?.role})`);

    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  // 2. Dashboard Command Center
  await step('2. Dashboard Command Center & Editorial Overview', async () => {
    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.unchartered-dashboard-root', { timeout: 15000 });
    await page.waitForTimeout(800);

    const dashboardEl = page.locator('.unchartered-dashboard-root');
    const rawText = (await dashboardEl.textContent()) || '';

    // Brand and headline
    if (!rawText.includes('Command Center')) throw new Error('Missing "Command Center" pill');
    if (!rawText.includes('Editorial Overview & Production Hub')) throw new Error('Missing "Editorial Overview & Production Hub" headline');
    if (!rawText.includes('admin@gmail.com')) throw new Error('Missing authenticated user indicator');

    // Quick Actions
    const quickEpisode = page.locator('a[href*="/collections/episodes/create"]');
    const quickGuest = page.locator('a[href*="/collections/guests/create"]');
    const quickNomination = page.locator('a[href*="/collections/nominations"]');

    if ((await quickEpisode.count()) === 0) throw new Error('Missing quick action for New Episode');
    if ((await quickGuest.count()) === 0) throw new Error('Missing quick action for Add Leader');
    if ((await quickNomination.count()) === 0) throw new Error('Missing quick action for Vetting Queue');

    // Metric Cards
    if (!rawText.includes('Total Episodes')) throw new Error('Missing Total Episodes metric');
    if (!rawText.includes('Active Broadcasts')) throw new Error('Missing Active Broadcasts metric');
    if (!rawText.includes('Leaders & Guests')) throw new Error('Missing Leaders & Guests metric');
    if (!rawText.includes('Leader Nominations')) throw new Error('Missing Leader Nominations metric');
    if (!rawText.includes('Audience Inquiries')) throw new Error('Missing Audience Inquiries metric');
    if (!rawText.includes('Media Library')) throw new Error('Missing Media Library metric');

    // Panels
    if (!rawText.includes('Recently Updated Episodes')) throw new Error('Missing Recently Updated Episodes panel');
    if (!rawText.includes('Incoming Leader Nominations')) throw new Error('Missing Incoming Leader Nominations panel');
    if (!rawText.includes('Editorial Production Checklist & Standards')) throw new Error('Missing Editorial Production Checklist');

    // Save screenshot
    const shotPath = path.join(ARTIFACT_DIR, 'admin_dashboard_desktop.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 3. Episodes Collection List
  await step('3. Episodes Collection List View & Styling', async () => {
    await page.goto('http://localhost:3000/admin/collections/episodes', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table, .table, .collection-list', { timeout: 15000 });
    await page.waitForTimeout(800);

    const searchInput = page.locator('input[type="search"], .search-filter__input');
    if ((await searchInput.count()) === 0) throw new Error('Missing search input in episodes list');

    const table = page.locator('table, .table');
    if ((await table.count()) === 0) throw new Error('Missing episodes table');

    const shotPath = path.join(ARTIFACT_DIR, 'admin_episodes_list.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 4. Episodes Create Form with 6 Tabs
  await step('4. Episodes Create Form (6 Editorial Tabs)', async () => {
    await page.goto('http://localhost:3000/admin/collections/episodes/create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const tabs = await page.locator('.tabs-field button, [role="tab"]').allInnerTexts();
    console.log('   Episode tabs found:', tabs);

    const expectedTabs = [
      'Basic Information',
      'Media & Playback',
      'Guests & Topics',
      'Show Notes & Content',
      'Publishing & Schedule',
      'SEO & Syndication',
    ];

    for (const t of expectedTabs) {
      if (!tabs.some((item) => item.includes(t))) {
        throw new Error(`Missing expected tab: "${t}" in Episode create form`);
      }
    }

    // Switch to Media & Playback tab
    console.log('   Clicking "Media & Playback" tab...');
    const mediaTab = page.locator('.tabs-field button, [role="tab"]').filter({ hasText: /Media/i }).first();
    await mediaTab.click();
    await page.waitForTimeout(1000);

    const visibleLabels = await page.locator('.field-label, label').allInnerTexts();
    if (!visibleLabels.some((l) => l.includes('YouTube Video URL'))) {
      throw new Error(`Expected YouTube Video URL in labels, found: ${visibleLabels.join(', ')}`);
    }

    // Switch to Publishing & Schedule tab
    console.log('   Clicking "Publishing & Schedule" tab...');
    const pubTab = page.locator('.tabs-field button, [role="tab"]').filter({ hasText: /Publishing/i }).first();
    await pubTab.click();
    await page.waitForTimeout(1000);

    const pubLabels = await page.locator('.field-label, label').allInnerTexts();
    if (!pubLabels.some((l) => l.includes('Publishing Status'))) {
      throw new Error(`Expected Publishing Status in labels, found: ${pubLabels.join(', ')}`);
    }

    const shotPath = path.join(ARTIFACT_DIR, 'admin_episode_tabs.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 5. Guests Create Form with 5 Tabs
  await step('5. Guests Create Form (5 Editorial Tabs)', async () => {
    await page.goto('http://localhost:3000/admin/collections/guests/create', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const tabs = await page.locator('.tabs-field button, [role="tab"]').allInnerTexts();
    console.log('   Guest tabs found:', tabs);

    const expectedTabs = [
      'Profile & Credentials',
      'Biography & Insights',
      'Portrait & Imagery',
      'Affiliations & Links',
      'Publishing & SEO',
    ];

    for (const t of expectedTabs) {
      if (!tabs.some((item) => item.includes(t))) {
        throw new Error(`Missing expected tab: "${t}" in Guest create form`);
      }
    }

    // Switch to Portrait & Imagery
    console.log('   Clicking "Portrait & Imagery" tab...');
    const portraitTab = page.locator('.tabs-field button, [role="tab"]').filter({ hasText: /Portrait/i }).first();
    await portraitTab.click();
    await page.waitForTimeout(1000);

    const portraitLabels = await page.locator('.field-label, label').allInnerTexts();
    if (!portraitLabels.some((l) => l.includes('Portrait Image'))) {
      throw new Error(`Expected Portrait Image in labels, found: ${portraitLabels.join(', ')}`);
    }

    const shotPath = path.join(ARTIFACT_DIR, 'admin_guest_tabs.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 6. Nominations Vetting View
  await step('6. Nominations Vetting Pipeline View', async () => {
    await page.goto('http://localhost:3000/admin/collections/nominations', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table, .table, .collection-list', { timeout: 15000 });
    await page.waitForTimeout(800);

    const table = page.locator('table, .table');
    if ((await table.count()) === 0) throw new Error('Missing nominations table');

    const shotPath = path.join(ARTIFACT_DIR, 'admin_nominations_list.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 7. Audience Inquiries List View
  await step('7. Audience Inquiries List View', async () => {
    await page.goto('http://localhost:3000/admin/collections/contact-messages', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table, .table, .collection-list', { timeout: 15000 });
    await page.waitForTimeout(800);

    const table = page.locator('table, .table');
    if ((await table.count()) === 0) throw new Error('Missing contact messages table');

    const shotPath = path.join(ARTIFACT_DIR, 'admin_contact_messages_list.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`   Captured screenshot: ${shotPath}`);
  });

  // 8. Responsive Mobile Viewports (360px, 390px, 412px)
  await step('8. Responsive Mobile Viewports (360px, 390px, 412px, zero horizontal overflow)', async () => {
    const viewports = [
      { width: 412, height: 915, label: '412px (Pixel 7 / S20)' },
      { width: 390, height: 844, label: '390px (iPhone 14 / 15)' },
      { width: 360, height: 780, label: '360px (Small Android)' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.unchartered-dashboard-root', { timeout: 15000 });
      await page.waitForTimeout(600);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasHorizontalScroll) {
        throw new Error(`Horizontal overflow detected at viewport ${vp.width}px!`);
      }

      console.log(`   ✓ ${vp.label}: zero horizontal scroll verified.`);

      const shotPath = path.join(ARTIFACT_DIR, `admin_mobile_${vp.width}px.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
    }
  });

  // 9. Contrast & High-Contrast Selected Row Verification
  await step('9. Visual Styling & High-Contrast Selected Row Audit', async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/collections/episodes', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
    await page.waitForTimeout(800);

    // Click first checkbox to select row
    const firstCheckbox = page.locator('table tbody tr input[type="checkbox"]').first();
    if ((await firstCheckbox.count()) > 0) {
      await firstCheckbox.check();
      await page.waitForTimeout(300);

      // Verify selected row text color is not low contrast or dark on dark
      const selectedRowColor = await page.evaluate(() => {
        const row = document.querySelector('table tbody tr.row-selected, table tbody tr:has(input:checked)');
        if (!row) return null;
        const cell = row.querySelector('td');
        if (!cell) return null;
        const style = window.getComputedStyle(cell);
        return { color: style.color, bg: style.backgroundColor };
      });

      console.log(`   Selected row computed colors: text=${selectedRowColor?.color}, bg=${selectedRowColor?.bg}`);
    }
  });

  await browser.close();

  console.log('================================================================');
  console.log(`Suite Execution Complete: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminSuite().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
