import { test, expect, type Page } from '@playwright/test';

/**
 * Admin dashboard E2E suite for the current Next.js admin (/admin/*).
 *
 * Runs only against a disposable local test database:
 * - Credentials come from the CI-only seed admin that scripts/migrate-postgres.mjs
 *   creates on a fresh database (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in ci.yml),
 *   or from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD when set explicitly.
 * - A guard refuses to run against any host other than localhost, so these tests
 *   can never log in to or write to a production site.
 *
 * Tests that create data use unique names and delete what they create.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || '';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

// 1x1 transparent PNG used for the media upload test (no fixture file needed)
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const unique = (prefix: string) => `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

test.beforeAll(() => {
  const baseURL = test.info().project.use.baseURL || '';
  const host = baseURL ? new URL(baseURL).hostname : '';
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Admin E2E tests only run against a local test server, got baseURL "${baseURL}".`);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (or E2E_ADMIN_*) for the test database admin.');
  }
});

async function login(page: Page) {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/admin'),
    page.locator('button[type="submit"]').click(),
  ]);
}

async function expectHeading(page: Page, text: string) {
  await expect(page.locator('main h1')).toHaveText(text);
}

test.describe('Admin authentication', () => {
  test('redirects unauthenticated visitors to the login page', async ({ page }) => {
    await page.goto('/admin/episodes');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toHaveText('Editorial Command Center');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('rejects an invalid password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill('Wrong-password-123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText('Authentication Error')).toBeVisible();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('logs in, lands on the dashboard, and logs out', async ({ page }) => {
    await login(page);
    await expectHeading(page, 'Unchartered — Legends & Legacies');

    await page.locator('aside [title="Logout of Editorial Portal"]').click();
    await expect(page).toHaveURL(/\/admin\/login/);

    // Session is gone: protected pages redirect to login again
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Admin dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard shows the overview panels and quick links', async ({ page }) => {
    await expectHeading(page, 'Unchartered — Legends & Legacies');
    await expect(page.getByRole('heading', { name: 'Recent Broadcast Episodes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Leader Nominations' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Recent Inquiries & Contact Submissions' })
    ).toBeVisible();
    await expect(page.locator('main a[href="/admin/episodes/new"]').first()).toBeVisible();
  });

  test('sidebar navigates to episodes, guests, media, and settings', async ({ page }) => {
    const sections: Array<[string, string]> = [
      ['/admin/episodes', 'Podcast Episodes Catalog'],
      ['/admin/guests', 'Leaders & Visionaries Directory'],
      ['/admin/media', 'Media & Asset Library'],
      ['/admin/settings', 'SEO & Website Global Settings'],
    ];

    for (const [href, heading] of sections) {
      await page.locator(`aside a[href="${href}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expectHeading(page, heading);
    }

    await page.locator('aside a[href="/admin"]').first().click();
    await expect(page).toHaveURL(/\/admin$/);
    await expectHeading(page, 'Unchartered — Legends & Legacies');
  });

  test('episodes: lists seeded episodes and filters by search', async ({ page }) => {
    await page.goto('/admin/episodes');
    await expectHeading(page, 'Podcast Episodes Catalog');

    const rows = page.locator('main tbody tr');
    // Seeded baseline episodes (scripts/init-data.json) are listed
    await expect(rows.filter({ hasText: 'The Quantum Horizon' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Capital Allocation' })).toHaveCount(1);

    await page.getByPlaceholder('Search by title, topic, or slug...').fill('Quantum Horizon');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('The Quantum Horizon');
  });

  test('episodes: creates a draft episode and deletes it', async ({ page }) => {
    const title = unique('E2E Draft Episode');

    await page.goto('/admin/episodes/new');
    await expectHeading(page, 'Create New Episode');
    await page.getByPlaceholder('e.g. Episode 5: The Architect of Modern Compute').fill(title);
    await page.getByRole('button', { name: 'Save Draft' }).click();

    await expect(page.getByText('Episode Created')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/episodes\/\d+$/);

    await page.goto('/admin/episodes');
    await page.getByPlaceholder('Search by title, topic, or slug...').fill(title);
    const row = page.locator('main tbody tr', { hasText: title });
    await expect(row).toHaveCount(1);

    await row.locator('[title="Delete Episode"]').click();
    await page.getByRole('button', { name: 'Delete Episode', exact: true }).last().click();
    await expect(page.getByText('Episode Deleted')).toBeVisible();
    await expect(page.locator('main tbody tr', { hasText: title })).toHaveCount(0);
  });

  test('guests: lists seeded leaders and filters by search', async ({ page }) => {
    await page.goto('/admin/guests');
    await expectHeading(page, 'Leaders & Visionaries Directory');
    await expect(page.getByText('Elena Rostova')).toBeVisible();

    await page.getByPlaceholder('Search by name, company, or role...').fill('Marcus');
    await expect(page.getByText('Marcus Vance')).toBeVisible();
    await expect(page.getByText('Elena Rostova')).toHaveCount(0);
  });

  test('guests: adds a leader and deletes it', async ({ page }) => {
    const name = unique('E2E Test Leader');

    await page.goto('/admin/guests');
    await page.getByRole('button', { name: 'Add New Leader' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Add New Leader')).toBeVisible();

    await dialog.getByPlaceholder('e.g. Elena Rostova').fill(name);
    await dialog.getByPlaceholder('e.g. Co-Founder & CEO').fill('QA Engineer');
    await dialog.getByPlaceholder('e.g. Quantum Dynamics').fill('Test Org');
    await dialog.getByRole('button', { name: 'Create Leader' }).click();
    await expect(page.getByText('Leader Added')).toBeVisible();

    await page.getByPlaceholder('Search by name, company, or role...').fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    // Wait until the search has narrowed the directory to this one leader
    const deleteButtons = page.locator('main [title="Delete Leader"]');
    await expect(deleteButtons).toHaveCount(1);
    await deleteButtons.click();
    await page.getByRole('button', { name: 'Delete Profile', exact: true }).click();
    await expect(page.getByText('Leader Removed')).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('media: uploads an image and deletes it', async ({ page }) => {
    const baseName = `e2e-upload-${Date.now()}`;

    await page.goto('/admin/media');
    await expectHeading(page, 'Media & Asset Library');
    await page.locator('main input[type="file"]').setInputFiles({
      name: `${baseName}.png`,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.getByText('File Uploaded')).toBeVisible();

    // Stored filenames get a timestamp suffix, so search by the base name
    await page.getByPlaceholder('Search by filename, alt text, or caption...').fill(baseName);
    await expect(page.locator('main').getByText(baseName).first()).toBeVisible();

    // Delete controls live in the list view (the grid view is the default)
    await page.locator('main button:has(svg.lucide-list)').click();
    const row = page.locator('main tbody tr', { hasText: baseName });
    await expect(row).toHaveCount(1);
    await row.locator('[title="Delete Asset"]').click();
    await page.getByRole('button', { name: 'Delete Asset', exact: true }).last().click();
    await expect(page.getByText('Asset Deleted')).toBeVisible();
    await expect(page.locator('main tbody tr', { hasText: baseName })).toHaveCount(0);
  });

  test('settings: loads saved values, switches tabs, and saves', async ({ page }) => {
    await page.goto('/admin/settings');
    await expectHeading(page, 'SEO & Website Global Settings');

    const brandName = page.getByPlaceholder('Unchartered: Legends & Legacies');
    await expect(brandName).not.toHaveValue('');

    for (const tab of ['Hero & Mission', 'Host Profile', 'Social & Platforms', 'Branding & Publisher']) {
      await page.getByRole('button', { name: tab }).click();
    }
    await page.getByRole('button', { name: 'Host Profile' }).click();
    await expect(page.getByPlaceholder('Managing Editor & Executive Producer')).toBeVisible();

    // Saving unchanged values round-trips through the settings API without altering data
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Settings Updated')).toBeVisible();
  });
});

test.describe('Admin on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('dashboard fits the screen and the navigation drawer works', async ({ page }) => {
    await login(page);
    await expectHeading(page, 'Unchartered — Legends & Legacies');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflows).toBe(false);

    await page.getByRole('button', { name: 'Toggle navigation drawer' }).click();
    await page.locator('aside a[href="/admin/episodes"]').click();
    await expect(page).toHaveURL(/\/admin\/episodes$/);
    await expectHeading(page, 'Podcast Episodes Catalog');
  });
});
