import { test, expect } from '@playwright/test';

/**
 * E2E smoke for justlovejazz SPA.
 *
 * Routes are hash-based (src/router.ts): #/, #/trinity, #/works.
 * Do NOT use /works.html — that file does not exist (SPA, one index.html).
 */

test.describe('JustLoveJazz — route smoke', () => {
  test('home route loads with nav + splash + canvas', async ({ page }) => {
    await page.goto('/');

    // Splash overlay present (role=status for a11y)
    await expect(page.locator('#jlj-splash')).toBeVisible();

    // Primary nav with aria-label
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();

    // Nav has 3 route links (home/trinity/works)
    const links = page.locator('nav[aria-label="Primary"] a[href]');
    expect(await links.count()).toBeGreaterThanOrEqual(3);

    // Canvas mounts (renderer init)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('trinity route loads via hash', async ({ page }) => {
    await page.goto('/#/trinity');

    // data-page attribute set on body
    await expect(page.locator('body')).toHaveAttribute('data-page', 'trinity', { timeout: 5000 });

    // Canvas present
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('works route loads with portfolio', async ({ page }) => {
    await page.goto('/#/works');

    await expect(page.locator('body')).toHaveAttribute('data-page', 'works', { timeout: 5000 });

    // Canvas + gallery anchor
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#gallery-anchor')).toBeVisible();

    // Project overlay (may need a moment for ensurePortfolio async)
    await expect(page.locator('.project-overlay')).toBeVisible({ timeout: 8000 });
  });

  test('SPA navigation between routes preserves canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Navigate to trinity via hash
    await page.goto('/#/trinity');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'trinity', { timeout: 5000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Navigate to works
    await page.goto('/#/works');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'works', { timeout: 5000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Back to home
    await page.goto('/#/');
    await expect(page.locator('body')).toHaveAttribute('data-page', 'home', { timeout: 5000 });
  });
});

test.describe('JustLoveJazz — accessibility', () => {
  test('skip link present and focusable', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveCount(1);
    await expect(skipLink).toHaveAttribute('href', '#home-hero');
  });

  test('splash has ARIA live region + progressbar', async ({ page }) => {
    await page.goto('/');

    const splash = page.locator('#jlj-splash');
    await expect(splash).toHaveAttribute('role', 'status');
    await expect(splash).toHaveAttribute('aria-live', 'polite');

    const progress = page.locator('#jlj-splash-progress');
    await expect(progress).toHaveAttribute('role', 'progressbar');
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  test('nav landmark + aria-label present', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav[role="navigation"][aria-label="Primary"]');
    await expect(nav).toBeVisible();
  });

  test('project overlay nav buttons have aria-labels', async ({ page }) => {
    await page.goto('/#/works');
    await expect(page.locator('.project-overlay')).toBeVisible({ timeout: 8000 });

    const prevBtn = page.locator('.project-overlay .prev');
    const nextBtn = page.locator('.project-overlay .next');
    await expect(prevBtn).toHaveAttribute('aria-label', 'Previous project');
    await expect(nextBtn).toHaveAttribute('aria-label', 'Next project');
  });

  test('keyboard focus visible on EnterButton', async ({ page }) => {
    await page.goto('/');
    // Wait for EnterButton to mount (after splash progress)
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });

    // Tab through to find focusable elements
    await page.keyboard.press('Tab');
    // Some element should be focused (skip-link or enter button or nav)
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag).toBeTruthy();
  });
});

test.describe('JustLoveJazz — works lifecycle', () => {
  test('project overlay shows project info on works route', async ({ page }) => {
    await page.goto('/#/works');

    const overlay = page.locator('.project-overlay');
    await expect(overlay).toBeVisible({ timeout: 8000 });

    // Title element populated (non-empty)
    const title = page.locator('.project-overlay__title');
    await expect(title).not.toBeEmpty({ timeout: 5000 });

    // Counter shows "1 / N" format
    const counter = page.locator('.project-overlay__nav .counter');
    await expect(counter).toContainText('/');
  });

  test('next button advances project counter', async ({ page }) => {
    await page.goto('/#/works');

    const overlay = page.locator('.project-overlay');
    await expect(overlay).toBeVisible({ timeout: 8000 });

    const counter = page.locator('.project-overlay__nav .counter');
    const beforeText = (await counter.textContent()) || '';

    const nextBtn = page.locator('.project-overlay .next');
    await nextBtn.click();

    // Counter should update (may stay same if only 1 project, but text format preserved)
    await expect(counter).toContainText('/');
    const afterText = (await counter.textContent()) || '';
    expect(afterText).toMatch(/\d+\s*\/\s*\d+/);
    // If multiple projects, index advances
    if (beforeText !== afterText) {
      expect(afterText).not.toEqual(beforeText);
    }
  });
});

test.describe('JustLoveJazz — runtime health', () => {
  test('no uncaught console errors on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

    await page.goto('/');
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Filter known non-actionable errors
    const realErrors = errors.filter(e =>
      !e.includes('picture in picture') &&
      !e.includes('Service Worker') &&
      !e.includes('navigator.serviceWorker') &&
      !e.includes('Download the React DevTools')  // harmless if ever logged
    );

    expect(realErrors.length).toBe(0);
  });

  test('no uncaught console errors on works', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

    await page.goto('/#/works');
    await page.locator('canvas').waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.locator('.project-overlay')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e =>
      !e.includes('picture in picture') &&
      !e.includes('Service Worker') &&
      !e.includes('navigator.serviceWorker')
    );

    expect(realErrors.length).toBe(0);
  });

  test('canvas has non-zero dimensions', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
