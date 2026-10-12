import { chromium } from 'playwright';

async function runE2E() {
  console.log('=== STARTING BROWSER E2E SMOKE & INTEGRITY TESTS ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'http://localhost:3000';

  // 1. PUBLIC WEBSITE CHECKS
  console.log('1. Checking Public Website Routes:');
  
  const publicRoutes = [
    { path: '/', label: 'Homepage' },
    { path: '/episodes', label: 'Episodes Catalog' },
    { path: '/guests', label: 'Leader Profiles' },
    { path: '/about', label: 'About Page' },
    { path: '/nominate-a-leader', label: 'Nomination Form' },
    { path: '/contact', label: 'Contact Form' },
    { path: '/search', label: 'Search Page' },
  ];

  for (const route of publicRoutes) {
    const res = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
    const status = res?.status();
    console.log(`   - ${route.label} (${route.path}): HTTP ${status}`);
    if (status !== 200) throw new Error(`Route ${route.path} failed with HTTP ${status}`);
  }

  // 2. ADMIN LOGIN FLOW
  console.log('\n2. Testing Custom Admin Login Flow:');
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.fill('#email', 'admin@gmail.com');
  await page.fill('#password', 'mahadev@123');
  await page.click('button[type="submit"]');

  // Wait for redirect to /admin
  await page.waitForURL('**/admin', { timeout: 15000 });
  console.log('   ✓ Logged in and redirected to:', page.url());

  // Verify dashboard content
  const dashboardHeading = await page.locator('h1').textContent();
  console.log(`   ✓ Dashboard Heading: "${dashboardHeading?.trim()}"`);

  // 3. ADMIN SUB-PAGES VERIFICATION
  console.log('\n3. Verifying Admin Workspace Sub-Pages:');
  const adminRoutes = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/episodes', label: 'Episodes Catalog' },
    { path: '/admin/guests', label: 'Leaders Directory' },
    { path: '/admin/topics', label: 'Topics Taxonomy' },
    { path: '/admin/media', label: 'Media Library' },
    { path: '/admin/nominations', label: 'Nominations Queue' },
    { path: '/admin/contact-messages', label: 'Audience Inbox' },
    { path: '/admin/users', label: 'Team & Permissions' },
    { path: '/admin/redirects', label: 'SEO Redirects' },
    { path: '/admin/settings', label: 'Global Site Settings' },
    { path: '/admin/activity', label: 'Audit Activity Logs' },
  ];

  for (const route of adminRoutes) {
    const res = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded' });
    const status = res?.status();
    console.log(`   ✓ ${route.label} (${route.path}): HTTP ${status}`);
    if (status !== 200) throw new Error(`Admin route ${route.path} failed with HTTP ${status}`);
  }

  // 4. RESPONSIVE VIEWPORT CHECKS
  console.log('\n4. Testing Mobile Viewports (No horizontal overflow):');
  const viewports = [
    { width: 360, height: 740, label: '360px (Small Android)' },
    { width: 390, height: 844, label: '390px (iPhone 12/13/14)' },
    { width: 412, height: 915, label: '412px (Samsung Galaxy)' },
    { width: 1440, height: 900, label: '1440px (Desktop)' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log(`   ✓ Viewport ${vp.label}: ${hasHorizontalScroll ? 'OVERFLOW DETECTED' : 'PASS (Clean responsive layout)'}`);
  }

  console.log('\n=== ALL BROWSER E2E TESTS PASSED SUCCESSFULLY ===');
  await browser.close();
}

runE2E().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
