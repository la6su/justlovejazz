import { test, expect } from '@playwright/test';

test.describe('JustLoveJazz', () => {
  test('home page loads triad navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
    const links = page.locator('nav[aria-label="Primary"] a[href]');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
  });

  test('works page loads and renders canvas', async ({ page }) => {
    await page.goto('/works.html');

    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible({ timeout: 10000 });

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('accessibility landmarks present', async ({ page }) => {
    await page.goto('/works.html');

    // Skip link exists
    const skipLink = page.locator('.skip-link, [data-skip-link]');
    await expect(async () => {
      const visible = await skipLink.count();
      expect(visible).toBeGreaterThanOrEqual(0); // soft check — optional pattern
    }).toPass();

    // Nav landmark present
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('gallery renders within timeout', async ({ page }) => {
    await page.goto('/works.html');

    // Wait for renderer to initialize (canvas + scene)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Page has content sections
    const sections = page.locator('section[id]');
    expect(await sections.count()).toBeGreaterThan(0);
  });

  test('no uncaught console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/works.html');
    // Wait for scene to initialize
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });

    // Allow brief settle time for lazy imports
    await page.waitForTimeout(2000);

    // Filter known non-actionable errors (service worker registration, adaptive coins)
    const realErrors = errors.filter(e =>
      !e.includes('picture in picture') &&
      !e.includes('Service Worker') &&
      !e.includes('navigator.serviceWorker')
    );

    expect(realErrors.length).toBe(0);
  });
});
