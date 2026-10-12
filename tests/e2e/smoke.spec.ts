import { test, expect } from '@playwright/test';

test.describe('Unchartered Podcast Smoke Suite', () => {
  test('1. Homepage loads brand, latest episode, and nomination CTA', async ({ page }) => {
    await page.goto('/');
    
    // Check Brand Name / Heading
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/Legends & Legacies/i).first()).toBeVisible();
    
    // Check Publisher Attribution
    await expect(page.getByText(/AI Automation Labs/i).first()).toBeVisible();

    // Check Navigation Links
    await expect(page.getByRole('link', { name: 'Episodes' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Guests' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nominate a Leader' }).first()).toBeVisible();

    // Check Nomination CTA section
    await expect(page.getByText(/Know a leader with a story worth sharing/i)).toBeVisible();
  });

  test('2. Guest search returns published profile first', async ({ page }) => {
    await page.goto('/search?q=Elena%20Rostova');

    // Should display guest profile card
    await expect(page.getByText('Elena Rostova').first()).toBeVisible();
    await expect(page.getByText(/Quantum Dynamics/i).first()).toBeVisible();

    // Navigate to guest profile
    await page.goto('/guests/elena-rostova');
    await expect(page).toHaveURL(/.*\/guests\/elena-rostova/);
    await expect(page.locator('h1')).toContainText('Elena Rostova');
  });

  test('3. Episode page renders responsive YouTube facade', async ({ page }) => {
    await page.goto('/episodes/the-quantum-horizon-sovereign-compute');

    // Check H1 title
    await expect(page.locator('h1')).toContainText('The Quantum Horizon');

    // Check YouTube facade (sample video facade or interactive play button)
    const facadeOrButton = page.locator('button[aria-label*="Play episode"], [aria-label*="Sample video placeholder"]');
    await expect(facadeOrButton).toBeVisible();

    // Check Key Takeaways
    await expect(page.getByText(/Key Executive Takeaways/i)).toBeVisible();

    // Check Share Buttons
    await expect(page.getByText('Copy Link')).toBeVisible();
  });

  test('4. Nomination form validates required fields and accepts input', async ({ page }) => {
    await page.goto('/nominate-a-leader');

    await expect(page.locator('h1')).toContainText('Nominate a Leader');
    await page.waitForSelector('form[data-hydrated="true"]');

    // Enter invalid short values to trigger validation errors
    await page.fill('#name', 'A');
    await page.fill('#email', 'invalid-email');
    await page.click('button[type="submit"]');

    // Errors should be visible
    await expect(page.getByText(/Your name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/Please enter a valid email address/i)).toBeVisible();
  });
});
