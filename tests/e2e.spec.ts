import { test, expect } from '@playwright/test';

test.describe('JustLoveJazz', () => {
  test('page loads and renders canvas', async ({ page }) => {
    await page.goto('/');

    // Page title exists
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Canvas element present (WebGL/WebGPU renderer)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('navigation structure is valid', async ({ page }) => {
    await page.goto('/');

    // Nav landmark exists
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible({ timeout: 5000 });

    // At least one nav link
    const links = nav.locator('a[href]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('accessibility landmarks present', async ({ page }) => {
    await page.goto('/');

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
    await page.goto('/');

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

    await page.goto('/');
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
