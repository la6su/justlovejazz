import { test, expect, type Page } from '@playwright/test';

/**
 * E2E smoke for the JUSTLOVEJAZZ SPA.
 *
 * The app is a single-route SPA (src/router.ts — no hash routes, just anchor
 * links). It boots asynchronously:
 *   index.html
 *     -> /src/entry-shell.ts           (tiny shell, double-rAF + requestIdleCallback)
 *        -> /src/entry-app.ts          (lazy-loads main.less + UIkit, runs initRouter)
 *           -> /src/router.ts          (creates <main id="spa-content"> and renders homePage)
 *              -> /src/main-app.ts     (WebGL/WebGPU Experience bootstrap)
 *
 * Headless Chromium cannot always initialize WebGPU, and the WebGL2 fallback
 * path may also fail in pure-software rendering environments. Therefore these
 * tests deliberately avoid asserting on canvas pixels or any UI that depends
 * on a successful Experience.init(). They focus on:
 *   - DOM structure that is rendered synchronously by the router
 *   - Accessibility attributes baked into the static HTML / templates
 *   - Absence of *fatal* (uncaught) JS errors, with known WebGPU/WebGL noise filtered out
 */

const SECTION_IDS = [
  'section-intro',
  'section-about',
  'section-flexible',
  'section-challenge',
  'section-innovative',
  'section-contact',
] as const;

/**
 * Console / pageerror strings we tolerate in headless Chromium. WebGPU adapter
 * negotiation, SwiftShader fallback warnings, and PWA manifest fetch failures
 * are all expected on a CI runner with no real GPU and no deployed origin.
 */
const KNOWN_HARMLESS_PATTERNS: RegExp[] = [
  /picture in picture/i,
  /service worker/i,
  /navigator\.serviceWorker/i,
  /Download the React DevTools/i,
  /WebGPU/i,
  /GPUBridge/i,
  /WebGPURenderer/i,
  /requestAdapter/i,
  /requestDevice/i,
  /GPUAdapter/i,
  /adapter.*unavailable/i,
  /fallback to webgl/i,
  /swiftshader/i,
  /llvmpipe/i,
  /software rendering/i,
  /Failed to load resource.*manifest/i,
  /manifest/i,
  /Cannot read properties of null.*getContext/i,
  /NO_GPU_ADAPTER/i,
  /WebGL2 is not supported/i,
  /Neither WebGPU nor WebGL2/i,
  // main-app.ts logs this prefix when Experience.init() throws — expected
  // in headless CI where WebGPU/WebGL2 may be unavailable.
  /\[main-app\] bootstrap failed/i,
  /\[Renderer\] Failed to install WebGLNodesHandler/i,
  /\[Experience\] DevPanel init failed/i,
];

function isFatalError(msg: string): boolean {
  if (!msg) return false;
  return !KNOWN_HARMLESS_PATTERNS.some((p) => p.test(msg));
}

function attachErrorCapture(page: Page, errors: string[]): void {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
}

test.describe('JustLoveJazz — page boot smoke', () => {
  test('splash container + populated <main> render within timeout', async ({ page }) => {
    await page.goto('/');

    // Splash overlay is present in the initial HTML (curtain panels).
    await expect(page.locator('#jlj-splash')).toHaveCount(1);

    // The router creates <main id="spa-content" role="main"> after JS boots.
    // #app stays empty by design — content lives in #spa-content.
    const main = page.locator('main#spa-content');
    await expect(main).toBeAttached({ timeout: 20000 });
    await expect(main).not.toBeEmpty({ timeout: 20000 });
  });

  test('skip link targets first section (#section-intro)', async ({ page }) => {
    await page.goto('/');

    const skip = page.locator('a.skip-link');
    await expect(skip).toHaveCount(1);
    await expect(skip).toHaveAttribute('href', '#section-intro');
  });

  test('all 6 anchor sections render with correct IDs and data-section', async ({ page }) => {
    await page.goto('/');

    for (const id of SECTION_IDS) {
      const loc = page.locator(`#${id}`);
      await expect(loc).toBeAttached({ timeout: 20000 });
      const ds = await loc.getAttribute('data-section');
      expect(ds, `#${id} should have data-section`).toBeTruthy();
    }
  });
});

test.describe('JustLoveJazz — accessibility & DOM UI', () => {
  test('SectionProgress timeline dots render (one per section) with aria-labels', async ({ page }) => {
    await page.goto('/');

    // SectionProgress injects button.jlz-section-progress__dot per section
    // (src/UI/SectionProgress.ts). It is only constructed after the Experience
    // finishes init() — which requires WebGPU or WebGL2. In headless CI without
    // a real GPU this may never happen, so skip gracefully instead of failing.
    const dots = page.locator('button.jlz-section-progress__dot');
    const firstAttached = await dots
      .first()
      .waitFor({ state: 'attached', timeout: 25000 })
      .then(() => true)
      .catch(() => false);

    test.skip(!firstAttached, 'SectionProgress did not render — GPU/WebGL init likely failed in headless');

    const count = await dots.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Each dot has an accessible label containing "section".
    const firstLabel = await dots.first().getAttribute('aria-label');
    expect(firstLabel).toBeTruthy();
    expect(firstLabel!.toLowerCase()).toContain('section');
  });

  test('keyboard: Tab from top of page reaches the skip link first', async ({ page }) => {
    await page.goto('/');
    // Wait for the SPA content to mount (skip-link is in static HTML, but the
    // app may add other focusable elements after boot — they are appended AFTER
    // the skip-link in DOM order, so it stays the first focusable element).
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 });

    // Make sure focus is at the very top of the document.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      document.body.focus();
    });

    await page.keyboard.press('Tab');

    const activeClass = await page.evaluate(() =>
      document.activeElement ? document.activeElement.className : '',
    );
    expect(activeClass, 'First Tab should focus the skip link').toContain('skip-link');
  });
});

test.describe('JustLoveJazz — runtime health', () => {
  test('no fatal JS errors on home load', async ({ page }) => {
    const errors: string[] = [];
    attachErrorCapture(page, errors);

    await page.goto('/');
    // Wait for the router to mount <main> (synchronous part of boot).
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 });
    // Give the async Experience bootstrap a moment to settle or fail loudly.
    await page.waitForTimeout(3000);

    const fatal = errors.filter(isFatalError);
    expect(fatal, `Fatal errors:\n${fatal.join('\n')}`).toEqual([]);
  });

  test('reduced-motion context loads without fatal errors', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors: string[] = [];
    attachErrorCapture(page, errors);

    try {
      await page.goto('/');
      await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 });
      await page.waitForTimeout(3000);

      const fatal = errors.filter(isFatalError);
      expect(fatal, `Fatal errors (reduced motion):\n${fatal.join('\n')}`).toEqual([]);

      // Sanity check: motionPolicy should have synced the dataset.
      const flag = await page.evaluate(() =>
        document.documentElement.dataset.reducedMotion,
      );
      expect(flag).toBe('1');
    } finally {
      await ctx.close();
    }
  });
});
