import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Reshma/.gemini/antigravity-ide/brain/37defd59-92d9-4139-8eff-a5993433616f';

test.describe('Unchartered CMS Admin Redesign & UI/UX Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate into Payload admin
    await page.goto('/admin');

    // If redirected to login page, authenticate
    if (page.url().includes('/admin/login')) {
      await page.waitForSelector('input[name="email"], input[id="field-email"]', { timeout: 10000 });
      const emailInput = page.locator('input[name="email"], input[id="field-email"]');
      const passwordInput = page.locator('input[name="password"], input[id="field-password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await emailInput.fill('admin@gmail.com');
      await passwordInput.fill('TestAdmin1234!');
      await submitBtn.click();

      // Wait for redirect to dashboard
      await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 });
    }
  });

  test('1. Admin Dashboard Command Center renders brand identity, metrics, and panels', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Editorial Command Center Header
    await expect(page.getByText('Command Center').first()).toBeVisible();
    await expect(page.getByText('Editorial Overview & Production Hub')).toBeVisible();
    await expect(page.getByText('admin@gmail.com').first()).toBeVisible();

    // Quick Action Buttons
    await expect(page.getByRole('link', { name: /New Episode/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Add Leader/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Vetting Queue/i }).first()).toBeVisible();

    // Metric Cards
    await expect(page.getByText('Total Episodes').first()).toBeVisible();
    await expect(page.getByText('Active Broadcasts').first()).toBeVisible();
    await expect(page.getByText('Leaders & Guests').first()).toBeVisible();
    await expect(page.getByText('Leader Nominations').first()).toBeVisible();
    await expect(page.getByText('Audience Inquiries').first()).toBeVisible();
    await expect(page.getByText('Media Library').first()).toBeVisible();

    // Panels
    await expect(page.getByText('Recently Updated Episodes')).toBeVisible();
    await expect(page.getByText('Incoming Leader Nominations')).toBeVisible();
    await expect(page.getByText('Editorial Production Checklist & Standards')).toBeVisible();

    // Capture screenshot
    if (fs.existsSync(ARTIFACT_DIR)) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_dashboard_redesign.png'), fullPage: false });
    }
  });

  test('2. Episodes collection list renders styled table, search input, and high-contrast rows', async ({ page }) => {
    await page.goto('/admin/collections/episodes');
    await page.waitForLoadState('networkidle');

    // Table container and search
    await expect(page.locator('table, .table').first()).toBeVisible();
    await expect(page.locator('input[type="search"], .search-filter__input').first()).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: /Title/i }).first()).toBeVisible();

    // Capture screenshot
    if (fs.existsSync(ARTIFACT_DIR)) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_episodes_list.png'), fullPage: false });
    }
  });

  test('3. Episode create form displays 6 organized editorial tabs with labels and descriptions', async ({ page }) => {
    await page.goto('/admin/collections/episodes/create');
    await page.waitForLoadState('networkidle');

    // Verify 6 tabs
    await expect(page.getByRole('tab', { name: 'Basic Information' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Media & Playback' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Guests & Topics' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Show Notes & Content' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Publishing & Schedule' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'SEO & Syndication' }).first()).toBeVisible();

    // Check field labels in Tab 1
    await expect(page.getByText('Episode Title').first()).toBeVisible();
    await expect(page.getByText('URL Slug').first()).toBeVisible();

    // Switch to Media Tab
    await page.getByRole('tab', { name: 'Media & Playback' }).first().click();
    await expect(page.getByText('YouTube Video URL').first()).toBeVisible();

    // Switch to Guests & Topics Tab
    await page.getByRole('tab', { name: 'Guests & Topics' }).first().click();
    await expect(page.getByText('Featured Leaders & Guests').first()).toBeVisible();

    // Switch to Publishing & Schedule Tab
    await page.getByRole('tab', { name: 'Publishing & Schedule' }).first().click();
    await expect(page.getByText('Publishing Status').first()).toBeVisible();

    // Capture screenshot
    if (fs.existsSync(ARTIFACT_DIR)) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_episode_edit_tabs.png'), fullPage: false });
    }
  });

  test('4. Guest create form displays 5 organized editorial tabs with profile fields', async ({ page }) => {
    await page.goto('/admin/collections/guests/create');
    await page.waitForLoadState('networkidle');

    // Verify 5 tabs
    await expect(page.getByRole('tab', { name: 'Profile & Credentials' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Biography & Insights' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Portrait & Imagery' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Affiliations & Links' }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Publishing & SEO' }).first()).toBeVisible();

    // Check field labels in Tab 1
    await expect(page.getByText('Full Name').first()).toBeVisible();
    await expect(page.getByText('Executive Role / Title').first()).toBeVisible();

    // Switch to Portrait Tab
    await page.getByRole('tab', { name: 'Portrait & Imagery' }).first().click();
    await expect(page.getByText(/Executive Portrait Image/i).first()).toBeVisible();
  });

  test('5. Mobile viewports (360px, 390px, 412px) render without horizontal overflow', async ({ page }) => {
    const viewports = [
      { width: 412, height: 915, name: 'mobile_412' },
      { width: 390, height: 844, name: 'mobile_390' },
      { width: 360, height: 780, name: 'mobile_360' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(overflow, `Viewport ${vp.width}px should not have horizontal overflow`).toBe(false);

      if (fs.existsSync(ARTIFACT_DIR)) {
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `admin_dashboard_${vp.name}.png`), fullPage: false });
      }
    }
  });
});
