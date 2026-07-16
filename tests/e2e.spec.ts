import { test, expect, type Page } from '@playwright/test'

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
  'section-lab',
  'section-intro',
  'section-about',
  'section-works',
  'section-contact',
  'section-menu',
] as const

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
]

function isFatalError(msg: string): boolean {
  if (!msg) return false
  return !KNOWN_HARMLESS_PATTERNS.some((p) => p.test(msg))
}

function attachErrorCapture(page: Page, errors: string[]): void {
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
}

test.describe('JustLoveJazz — page boot smoke', () => {
  test('splash HTML does not preload the 3D dependency graph', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    expect(html).not.toMatch(/modulepreload[^>]+(?:vendor-three|vendor-ui|chunk-core-world)/)
  })

  test('splash container + populated <main> render within timeout', async ({ page }) => {
    await page.goto('/')

    // Splash overlay is inline in index.html — #jlz-app-loader with curtain panels.
    await expect(page.locator('#jlz-app-loader')).toHaveCount(1)

    // The router creates <main id="spa-content" role="main"> after JS boots.
    // #app stays empty by design — content lives in #spa-content.
    const main = page.locator('main#spa-content')
    await expect(main).toBeAttached({ timeout: 20000 })
    await expect(main).not.toBeEmpty({ timeout: 20000 })
  })

  test('skip link targets first section (#section-intro)', async ({ page }) => {
    await page.goto('/')

    const skip = page.locator('a.skip-link')
    await expect(skip).toHaveCount(1)
    await expect(skip).toHaveAttribute('href', '#section-intro')
  })

  test('all 6 sections render with correct IDs and data-section', async ({ page }) => {
    // Sections are prerendered into index.html by vite build (prerender-index
    // plugin) — they're in the DOM at domcontentloaded. BUT Experience.init()
    // blocks the main thread during WebGL/WebGPU setup (15-40s in headless),
    // which delays Playwright's toBeAttached polling for the last 2 sections.
    // 90s test timeout + 60s per-section timeout covers the worst case.
    test.setTimeout(90000)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    for (const id of SECTION_IDS) {
      const loc = page.locator(`#${id}`)
      await expect(loc).toBeAttached({ timeout: 60000 })
      const ds = await loc.getAttribute('data-section')
      expect(ds, `#${id} should have data-section`).toBeTruthy()
    }
  })
})

test.describe('JustLoveJazz — accessibility & DOM UI', () => {
  test('top-bar controls and menu section links render with aria-labels', async ({ page }) => {
    await page.goto('/')

    // UIMenu injects top-bar controls. The menu is rendered as secret section 5
    // and uses .jlz-menu-nav__sub-link anchors. UIMenu is only constructed after
    // the Experience finishes init() — which requires WebGPU or WebGL2. In
    // headless CI without a real GPU this may never happen, so skip gracefully.
    const soundToggle = page.locator('#jlz-sound-toggle')
    const attached = await soundToggle
      .waitFor({ state: 'attached', timeout: 25000 })
      .then(() => true)
      .catch(() => false)

    test.skip(!attached, 'Top bar did not render — GPU/WebGL init likely failed in headless')

    // The sound control has an accessible label.
    const label = await soundToggle.getAttribute('aria-label')
    expect(label).toBeTruthy()
    expect(label!.toLowerCase()).toContain('sound')

    // The navigation template is rendered with one sub-link per visible section.
    const links = page.locator('.jlz-menu-nav__sub-link')
    await expect(links.first()).toBeAttached({ timeout: 5000 })
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(20)

    const firstLinkHref = await links.first().getAttribute('data-nav-href')
    expect(firstLinkHref).toMatch(/^\//)
  })

  test('keyboard: Tab from top of page reaches the skip link first', async ({ page }) => {
    await page.goto('/')
    // Wait for the SPA content to mount (skip-link is in static HTML, but the
    // app may add other focusable elements after boot — they are appended AFTER
    // the skip-link in DOM order, so it stays the first focusable element).
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })

    // Make sure focus is at the very top of the document.
    await page.evaluate(() => {
      ;(document.activeElement as HTMLElement | null)?.blur?.()
      document.body.focus()
    })

    await page.keyboard.press('Tab')

    const activeClass = await page.evaluate(() =>
      document.activeElement ? document.activeElement.className : '',
    )
    expect(activeClass, 'First Tab should focus the skip link').toContain('skip-link')
  })

  test('secret sections use one UIkit accordion composition', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    try {
      await page.goto('/')
      await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })

      // The two secret sections are normally reached through the joystick.
      // Activate them directly here so the responsive composition can be
      // checked without depending on GPU initialisation in headless Chromium.
      await page.evaluate(() => {
        document
          .querySelectorAll('.section-active')
          .forEach((section) => section.classList.remove('section-active'))
        document.getElementById('section-lab')?.classList.add('section-active')
      })

      const labAccordion = page.locator('#section-lab .jlz-lab-accordion')
      await expect(labAccordion).toBeVisible()
      await expect(page.locator('#section-lab .jlz-lab-grid')).toHaveCount(0)

      const labToggle = labAccordion.locator('.uk-accordion-title').first()
      await labToggle.click()
      await expect(labToggle).toHaveAttribute('aria-expanded', 'true')
      await expect(labAccordion.locator('.jlz-lab-accordion__preview').first()).toBeVisible()

      await page.evaluate(() => {
        document
          .querySelectorAll('.section-active')
          .forEach((section) => section.classList.remove('section-active'))
        document.getElementById('section-menu')?.classList.add('section-active')
      })

      const menuToggle = page.locator('#section-menu .jlz-menu-nav__toggle').first()
      await expect(menuToggle).toHaveAttribute('role', 'button')
      await menuToggle.click()
      await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('#section-menu .jlz-menu-nav__subs').first()).toBeVisible()
    } finally {
      await context.close()
    }
  })
})

test.describe('JustLoveJazz — runtime health', () => {
  test('no fatal JS errors on home load', async ({ page }) => {
    const errors: string[] = []
    attachErrorCapture(page, errors)

    await page.goto('/')
    // Wait for the router to mount <main> (synchronous part of boot).
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
    // Give the async Experience bootstrap a moment to settle or fail loudly.
    await page.waitForTimeout(3000)

    const fatal = errors.filter(isFatalError)
    expect(fatal, `Fatal errors:\n${fatal.join('\n')}`).toEqual([])
  })

  test('reduced-motion context loads without fatal errors', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    const errors: string[] = []
    attachErrorCapture(page, errors)

    try {
      await page.goto('/')
      await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
      await page.waitForTimeout(3000)

      const fatal = errors.filter(isFatalError)
      expect(fatal, `Fatal errors (reduced motion):\n${fatal.join('\n')}`).toEqual([])

      // Sanity check: motionPolicy should have synced the dataset.
      const flag = await page.evaluate(() => document.documentElement.dataset.reducedMotion)
      expect(flag).toBe('1')
    } finally {
      await ctx.close()
    }
  })
})
