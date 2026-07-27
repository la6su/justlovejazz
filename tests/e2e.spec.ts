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
 *              -> Experience bootstrap (WebGL/WebGPU runtime)
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
  // entry-app.ts logs this prefix when Experience.init() throws — expected
  // in headless CI where WebGPU/WebGL2 may be unavailable.
  /\[entry-app\] bootstrap failed/i,
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

async function waitForRouter(page: Page): Promise<void> {
  // index.html is prerendered, so mounted DOM alone is not proof that the
  // lazy shell has called initRouter(). startApp() injects main.less directly
  // before that synchronous call; waiting for its distinctive rule avoids
  // dispatching a navigation request into the startup gap.
  await page.waitForFunction(() =>
    [...document.head.querySelectorAll('style')].some((style) =>
      style.textContent?.includes('.jlz-storyline'),
    ),
  )
}

test.describe('JustLoveJazz — page boot smoke', () => {
  test('splash HTML does not preload the 3D dependency graph', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    expect(html).not.toMatch(/modulepreload[^>]+(?:vendor-three|vendor-ui|chunk-core-world)/)
    expect(html).toContain('Zarazeni Inclusion')
    expect(html).toContain('ВКЛЮЧЕНИЕ')
  })

  test('variable typography is self-hosted with Cyrillic coverage', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const blogHtml = await (await request.get('/blog')).text()
    const fontCss = await (await request.get('/fonts/onest.css')).text()

    expect(html).toContain('/fonts/onest-latin-variable.woff2')
    expect(html).not.toContain('/fonts/inter.css')
    expect(blogHtml).toContain('/fonts/onest-latin-variable.woff2')
    expect(blogHtml).not.toContain('/fonts/inter.css')
    expect(fontCss).toContain('font-weight: 100 900')
    expect(fontCss).toContain('/fonts/onest-cyrillic-variable.woff2')
    expect(fontCss).toMatch(/U\+0400-045F/i)
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
  test('Works keeps semantic cards inside the editorial composition', async ({ page }) => {
    await page.goto('/works')

    await expect(page.locator('.jlz-works-section')).toHaveCount(4)
    // .jlz-works-statement moved to 3D (WorksTextScreen) — no longer in DOM
    await expect(page.locator('.jlz-work-card')).toHaveCount(8)

    const firstCard = page.locator('.jlz-work-card').first()
    await expect(firstCard).toHaveAttribute('data-project-id', /.+/)
    await expect(firstCard).toHaveAttribute('aria-label', /Open project:/)
  })

  test('direct content-section link keeps its route', async ({ page }) => {
    await page.goto('/works#section-works-03')
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
    await expect(page).toHaveURL(/\/works#section-works-03$/)
  })

  test('repeated in-app routes retain their target section and do not duplicate Works cards', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
    await expect(page.locator('#section-intro')).toBeAttached()
    await waitForRouter(page)

    const navigate = (path: string) =>
      page.evaluate((nextPath) => {
        window.dispatchEvent(new CustomEvent('jlz:navigate', { detail: { path: nextPath } }))
      }, path)

    await navigate('/lab#section-lab-02')
    await expect(page).toHaveURL(/\/lab#section-lab-02$/)
    await expect(page.locator('#section-lab-02')).toBeAttached()

    await navigate('/works#section-works-03')
    await expect(page).toHaveURL(/\/works#section-works-03$/)
    await expect(page.locator('#section-works-03')).toBeAttached()
    await expect(page.locator('.jlz-work-card')).toHaveCount(8)

    await navigate('/lab#section-lab-04')
    await expect(page).toHaveURL(/\/lab#section-lab-04$/)
    await expect(page.locator('#section-lab-04')).toBeAttached()

    await navigate('/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('#section-intro')).toHaveClass(/section-active/)
  })

  test('top-bar controls and menu section links render with aria-labels', async ({ page }) => {
    await page.goto('/')

    // UIMenu injects top-bar controls. The menu is rendered in runtime section 5
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

    // The navigation template exposes section links plus a direct Blog route.
    const links = page.locator('.jlz-menu-nav__sub-link')
    await expect(links.first()).toBeAttached({ timeout: 5000 })
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(24)

    await expect(
      page.locator('.jlz-menu-nav__sub-link[data-nav-href="/lab#section-lab-01"]'),
    ).toHaveCount(1)
    await expect(
      page.locator('.jlz-menu-nav__direct-link[href="/blog"][data-page-transition]'),
    ).toHaveCount(1)

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

  test('mobile uses a vertical story, compact Menu and Contact footer', async ({ browser }) => {
    // Parallel headless workers can spend most of the default budget in the
    // optional GPU bootstrap even though this test only inspects DOM/CSS.
    test.setTimeout(60000)
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    try {
      await page.goto('/')
      await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
      await waitForRouter(page)

      // Splash preferences remain usable before the 3D runtime is ready.
      await expect(page.locator('#cfg-sound')).toHaveCSS('height', '44px')
      await expect(page.locator('#cfg-lang')).toHaveCSS('min-width', '44px')

      const track = page.locator('#spa-content')
      await expect(track).toHaveCSS('scroll-snap-type', /y mandatory/)
      await expect(page.locator('[data-section="intro"]')).toHaveCSS('width', '390px')

      // Activate the public sheet state directly so responsive composition can
      // be checked without depending on GPU initialisation in headless Chromium.
      await page.evaluate(() => {
        document.body.dataset.cinematicSheet = 'footer'
      })

      const footer = page.locator('[data-contact-footer]')
      await expect(footer).toBeVisible()
      await expect(footer.locator('.jlz-telegram-cta')).toHaveAttribute(
        'href',
        'https://t.me/justlovejazz',
      )
      await expect(page.locator('#section-lab .jlz-lab-accordion')).toHaveCount(0)

      await page.evaluate(() => {
        document.body.dataset.cinematicSheet = 'menu'
      })

      await expect(page.locator('#section-menu')).toBeVisible()
      const menuToggle = page.locator('#section-menu .jlz-menu-nav__toggle').first()
      await expect(menuToggle).toHaveAttribute('role', 'button')
      await menuToggle.dispatchEvent('click')
      await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('#section-menu .jlz-menu-nav__subs').first()).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('mobile runtime controls use 44px touch targets when available', async ({ browser }) => {
    test.setTimeout(60000)
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    try {
      await page.goto('/')
      const languageToggle = page.locator('#jlz-lang-toggle')
      const attached = await languageToggle
        .waitFor({ state: 'attached', timeout: 25000 })
        .then(() => true)
        .catch(() => false)

      test.skip(!attached, 'Persistent controls require a successful GPU/WebGL runtime')

      await expect(languageToggle).toHaveCSS('width', '44px')
      await expect(languageToggle).toHaveCSS('height', '44px')
      await expect(page.locator('.jlz-storyline__item').first()).toHaveCSS('width', '44px')
      await expect(page.locator('.jlz-storyline__item').first()).toHaveCSS('min-height', '44px')
    } finally {
      await context.close()
    }
  })

  test('mobile Works stacks its two semantic case controls', async ({ browser }) => {
    test.setTimeout(60000)
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    try {
      await page.goto('/works')
      await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })

      const stage = page.locator('.jlz-works-stage').first()
      const cards = stage.locator('.jlz-work-card')
      await expect(cards).toHaveCount(2)

      const [stageBox, firstCardBox, secondCardBox] = await Promise.all([
        stage.boundingBox(),
        cards.nth(0).boundingBox(),
        cards.nth(1).boundingBox(),
      ])
      expect(stageBox).not.toBeNull()
      expect(firstCardBox).not.toBeNull()
      expect(secondCardBox).not.toBeNull()
      expect(stageBox!.height).toBeCloseTo(844, 0)
      // The DOM captions intentionally mirror the narrower frustum planes,
      // leaving the same outer gutter as the 3D media on portrait screens.
      expect(firstCardBox!.width).toBeGreaterThan(250)
      expect(firstCardBox!.width).toBeLessThan(280)
      expect(secondCardBox!.width).toBeGreaterThan(220)
      expect(secondCardBox!.width).toBeLessThan(250)
      expect(firstCardBox!.x).toBeGreaterThan(40)
      expect(secondCardBox!.x).toBeGreaterThan(80)
      expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y)
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
