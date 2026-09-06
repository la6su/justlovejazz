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

const SPA_ROUTES = ['/', '/services', '/works', '/manifesto', '/lab', '/contact'] as const

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
  // Proof the Vue navigation owner committed the first page: its semantic
  // `data-page-view` marker is written on the mounted route root. Waiting only
  // for main.less would dispatch a navigation request into the Vue startup gap
  // where no listener exists yet — a CustomEvent is not queued, so the request
  // is simply lost.
  await page.waitForFunction(
    () =>
      [...document.head.querySelectorAll('style')].some((style) =>
        style.textContent?.includes('.jlz-storyline'),
      ) &&
      Boolean(document.querySelector('#spa-content')?.getAttribute('data-page-view')) &&
      (window as unknown as { __jlzRouterReady?: boolean }).__jlzRouterReady === true,
  )
}

/**
 * Trigger an in-app strict navigation through the app's typed event bus.
 * The Phase 10 raw `window` bridge was removed, so the app only receives
 * `jlz:navigate` via the typed port; the app exposes the dev/test seam
 * `window.__jlzEmit` (entry-app.ts) to call that port from the test.
 */
function navigateInApp(page: Page, path: string): Promise<void> {
  return page.evaluate((nextPath) => {
    const emit = (
      window as unknown as {
        __jlzEmit?: (event: string, detail?: unknown) => void
      }
    ).__jlzEmit
    if (!emit) throw new Error('window.__jlzEmit test seam is not available')
    emit('jlz:navigate', { path: nextPath })
  }, path)
}

test.describe('JustLoveJazz — page boot smoke', () => {
  test('splash HTML does not preload the 3D dependency graph', async ({ request }) => {
    const response = await request.get('/')
    const html = await response.text()

    expect(html).not.toMatch(/modulepreload[^>]+(?:vendor-three|vendor-ui|chunk-core-world)/)
    expect(html).toContain('Zarazeni Inclusion')
    expect(html).toContain('ВКЛЮЧЕНИЕ')
  })

  test('every published SPA route resolves to the application shell', async ({ request }) => {
    for (const route of SPA_ROUTES) {
      const response = await request.get(route)
      expect(response.ok(), `${route} should resolve on the production preview`).toBe(true)
      expect(await response.text(), `${route} should serve the SPA shell`).toContain('id="app"')
    }
  })

  test('approved builder documents ship as static /p pages without the app bundle', async ({
    request,
  }) => {
    // Phase 9, slice 5: `published: true` builder documents are rendered by
    // the publish pipeline (scripts/publish-builder-pages.mjs) through the
    // trusted Vue registry into standalone static routes — the registry body,
    // the per-page Less rewritten by Vite, zero application scripts, no
    // editor surface.
    const response = await request.get('/p/studio-page')
    expect(response.ok()).toBe(true)
    const html = await response.text()

    expect(html).toContain('<main id="main" class="jlz-builder-page" role="main">')
    expect(html).toContain('<title>Studio page | JUSTLOVEJAZZ</title>')
    expect(html).toContain('<link rel="canonical" href="https://justlovejazz.dev/p/studio-page" />')
    expect(html).toMatch(/\/assets\/studio-page-[A-Za-z0-9_-]+\.css/)
    expect(html).not.toContain('<script')
    expect(html).not.toMatch(/vendor-three|assets\/(app|main)\b/)
    expect(html).not.toContain('__jlz-admin')
    expect(html).not.toContain('data-builder-id')
  })

  test('no-scene mode boots the route shell and semantic content without a renderer', async ({
    page,
  }) => {
    // Phase 5 prerender contract: ?no-scene=1 boots the route shell and the
    // semantic route content WITHOUT the scene runtime — no canvas is ever
    // created, and navigation still works on a DOM-only world.
    await page.goto('/?no-scene=1')

    const main = page.locator('main#spa-content')
    await expect(main).toBeAttached({ timeout: 20000 })
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toBeAttached({ timeout: 20000 })
    }
    await expect(page.locator('canvas')).toHaveCount(0)

    // jlz:webgl-ready fired (synthetic) — Enter becomes available.
    await expect(page.locator('#jlz-splash-enter')).toHaveClass(/is-ready/)

    // The no-scene path still mounts the navigation owner (startApp's router
    // branch runs before the no-scene early return inside boot()); wait for
    // it so the request below cannot land in the startup gap.
    await waitForRouter(page)

    // Semantic navigation without the scene: in-app push lands on /works.
    await navigateInApp(page, '/works')
    await expect(page).toHaveURL(/\/works$/)
    await expect(page.locator('#section-works-01')).toBeAttached({ timeout: 20000 })
    await expect(page.locator('canvas')).toHaveCount(0)
  })

  test('direct content-route entry renders the target page, not the prerendered home', async ({
    page,
  }) => {
    // index.html is prerendered with the home sections; a direct deep link to
    // a content route must land on that route's page (the lenient fallback is
    // home-only for UNKNOWN paths, never for a manifest route).
    await page.goto('/works', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#section-works-01')).toBeAttached({ timeout: 60000 })
    await expect(page.locator('#section-works-04')).toBeAttached({ timeout: 20000 })
    // The prerendered home sections are gone once the router lands on /works.
    await expect(page.locator('#section-intro')).toHaveCount(0, { timeout: 60000 })
  })

  test('variable typography is self-hosted with Cyrillic coverage', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const blogHtml = await (await request.get('/blog')).text()
    const fontCss = await (await request.get('/fonts/commissioner.css')).text()
    const fontResponse = await request.get('/fonts/commissioner-variable.ttf')

    expect(html).toContain('/fonts/commissioner-variable.ttf')
    expect(html).not.toContain('/fonts/inter.css')
    expect(blogHtml).toContain('/fonts/commissioner-variable.ttf')
    expect(blogHtml).not.toContain('/fonts/inter.css')
    expect(fontResponse.ok()).toBe(true)
    expect(fontCss).toContain('font-weight: 100 900')
    expect(fontCss).toContain("font-family: 'Commissioner'")
    expect(fontCss).toContain('/fonts/commissioner-variable.ttf')
    expect(fontCss).toContain('font-style: oblique -12deg 0deg')
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

  test('in-app route changes are announced without exposing the decorative canvas', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForRouter(page)

    const announcer = page.locator('#jlz-route-announcer')
    await expect(announcer).toHaveAttribute('aria-live', 'polite')
    await expect(announcer).toHaveAttribute('aria-atomic', 'true')

    await navigateInApp(page, '/services')

    await expect(page).toHaveURL(/\/services$/)
    await expect(page).toHaveTitle('Services — JUSTLOVEJAZZ')
    await expect(announcer).toHaveText('Services — JUSTLOVEJAZZ')

    const canvas = page.locator('canvas.canvas')
    if ((await canvas.count()) > 0) {
      await expect(canvas).toHaveAttribute('aria-hidden', 'true')
    }
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

    const navigate = (path: string) => navigateInApp(page, path)

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

  test('browser history uses the same route handoff as in-app navigation', async ({ page }) => {
    await page.goto('/')
    await waitForRouter(page)

    await navigateInApp(page, '/works')
    await expect(page).toHaveURL(/\/works$/)

    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('#section-intro')).toHaveClass(/section-active/)
    await expect(page.locator('.jlz-route-transition')).toHaveAttribute('data-state', 'idle')
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

    const themeToggle = page.locator('#jlz-theme-toggle')
    await expect(themeToggle).toHaveCount(1)
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'false')
    await page.locator('#jlz-splash-enter').click()
    await expect(page.locator('#jlz-app-loader')).toBeHidden()
    await themeToggle.click()
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(themeToggle).toHaveAttribute('title', 'Theme: inverse')
    await themeToggle.click()
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(themeToggle).toHaveAttribute('title', 'Theme: auto')

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

test.describe('JustLoveJazz — Phase 7 persistent scene host', () => {
  test('splash→Enter over exactly one canvas; navigation never remounts the scene root', async ({
    page,
  }) => {
    // The software backend may take longer than the default budget to reach
    // the first successful render (readiness gate).
    test.setTimeout(120000)
    const errors: string[] = []
    attachErrorCapture(page, errors)

    await page.goto('/')

    // Readiness: Enter becomes available only after renderer init + backend
    // inspection + Tres context mount + the initial World's first render.
    const enter = page.locator('#jlz-splash-enter')
    await expect(enter).toHaveClass(/is-ready/)

    // Exactly one canvas (the persistent Tres root, selector canvas.canvas),
    // hidden from the accessibility tree.
    const canvas = page.locator('canvas.canvas')
    await expect(canvas).toHaveCount(1)
    await expect(canvas).toHaveAttribute('aria-hidden', 'true')

    // Splash → Enter.
    await enter.click()
    await expect(page.locator('#jlz-app-loader')).toBeHidden()

    // Mark the canvas element: a remount would lose the marker.
    await page.evaluate(() => {
      const el = document.querySelector('canvas.canvas') as
        (HTMLCanvasElement & { __jlzPhase7Mark?: string }) | null
      if (el) el.__jlzPhase7Mark = 'phase7'
    })
    const markedAfterBoot = () =>
      page.evaluate(() =>
        Boolean(
          (
            document.querySelector('canvas.canvas') as
              (HTMLCanvasElement & { __jlzPhase7Mark?: string }) | null
          )?.__jlzPhase7Mark,
        ),
      )
    expect(await markedAfterBoot(), 'canvas was not reachable to mark').toBe(true)

    // In-app navigation to a content route.
    await navigateInApp(page, '/works')
    await expect(page).toHaveURL(/\/works$/)
    await expect(page.locator('#section-works-01')).toBeAttached()

    // The persistent SceneHost (sibling of RouterView) survives navigation:
    // still exactly one canvas and the SAME element (marker intact).
    await expect(page.locator('canvas.canvas')).toHaveCount(1)
    expect(await markedAfterBoot(), 'scene root remounted on /works navigation').toBe(true)

    // And again on the way back home.
    await navigateInApp(page, '/')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('canvas.canvas')).toHaveCount(1)
    expect(await markedAfterBoot(), 'scene root remounted on the way back home').toBe(true)

    const fatal = errors.filter(isFatalError)
    expect(fatal, `Fatal errors:\n${fatal.join('\n')}`).toEqual([])
  })

  test('Tres canvas keeps the renderer DPR cap on high-density viewports', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
    })
    const page = await context.newPage()
    try {
      await page.goto('/')
      await expect(page.locator('#jlz-splash-enter')).toHaveClass(/is-ready/, { timeout: 90000 })
      const metrics = await page.evaluate(() => {
        const canvas = document.querySelector('canvas.canvas')
        return {
          dpr: window.devicePixelRatio,
          cssWidth: window.innerWidth,
          bufferWidth: canvas?.width ?? 0,
        }
      })
      expect(metrics.dpr).toBe(3)
      expect(metrics.bufferWidth).toBeLessThanOrEqual(Math.ceil(metrics.cssWidth * 1.5))
    } finally {
      await context.close()
    }
  })
})

test.describe('JustLoveJazz — runtime health', () => {
  test('WebGLBackend survives a real webglcontextlost handoff', async ({ page }) => {
    test.setTimeout(120000)
    const errors: string[] = []
    attachErrorCapture(page, errors)
    await page.goto(process.env.JLZ_WEBGL_RECOVERY_CHROME === '1' ? '/?force-webgl-backend=1' : '/')
    await expect(page.locator('main#spa-content')).toBeAttached({ timeout: 20000 })
    await expect(page.locator('#jlz-splash-enter')).toHaveClass(/is-ready/, { timeout: 90000 })

    await expect
      .poll(() => page.evaluate(() => window.__jlzHost?.backend ?? null), { timeout: 5000 })
      .not.toBeNull()
    const backend = await page.evaluate(() => window.__jlzHost?.backend ?? null)
    if (process.env.JLZ_WEBGL_RECOVERY_CHROME === '1') {
      console.info(`[WebGL recovery gate] backend=${backend ?? 'unreported'}`)
    }
    test.skip(
      backend !== 'WebGLBackend',
      `WebGLBackend probe skipped: ${backend ?? 'backend was not reported'}`,
    )

    const probe = await page.evaluate(async () => {
      // Some headless Chromium builds expose WEBGL_lose_context but do not
      // restore a usable default framebuffer. Skip those environments before
      // touching the production canvas; real WebGL browsers still execute the
      // full recovery handoff below.
      const preflightCanvas = document.createElement('canvas')
      const preflightGl = preflightCanvas.getContext('webgl2')
      const preflightLose = preflightGl?.getExtension('WEBGL_lose_context')
      if (!preflightGl || !preflightLose) {
        return { available: false, reason: 'WebGL context restoration preflight is unavailable' }
      }
      const preflightRestored = await new Promise<boolean>((resolve) => {
        let settled = false
        const finish = (value: boolean) => {
          if (settled) return
          settled = true
          resolve(value)
        }
        preflightCanvas.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault()
            preflightLose.restoreContext()
          },
          { once: true },
        )
        preflightCanvas.addEventListener('webglcontextrestored', () => finish(true), { once: true })
        preflightLose.loseContext()
        window.setTimeout(() => finish(false), 2000)
      })
      if (!preflightRestored || preflightGl.getParameter(preflightGl.VIEWPORT) === null) {
        return { available: false, reason: 'browser cannot restore a usable WebGL framebuffer' }
      }

      const canvas = document.querySelector('canvas.canvas')
      if (!(canvas instanceof HTMLCanvasElement)) {
        return { available: false, reason: 'persistent canvas is unavailable' }
      }
      const gl = canvas.getContext('webgl2')
      if (!gl) {
        return { available: false, reason: 'active WebGL2 context is unavailable' }
      }
      const lose = gl.getExtension('WEBGL_lose_context')
      if (!lose) {
        return { available: false, reason: 'WEBGL_lose_context extension is unavailable' }
      }

      const lost = await new Promise<boolean>((resolve) => {
        let settled = false
        const finish = (value: boolean) => {
          if (settled) return
          settled = true
          resolve(value)
        }
        canvas.addEventListener(
          'webglcontextlost',
          (event) => {
            event.preventDefault()
            finish(true)
          },
          { once: true },
        )
        lose.loseContext()
        window.setTimeout(() => finish(false), 2000)
      })

      // Keep the browser's context-loss contract realistic: preventing the
      // default loss event allows WEBGL_lose_context to restore the context,
      // while the production Renderer recovery runs asynchronously.
      if (lost) {
        await new Promise((resolve) => window.setTimeout(resolve, 100))
        lose.restoreContext()
      }

      return { available: true, lost }
    })

    if (process.env.JLZ_WEBGL_RECOVERY_CHROME === '1' && !probe.available) {
      console.info(`[WebGL recovery gate] skipped: ${probe.reason}`)
    }

    test.skip(!probe.available, `WebGLBackend probe skipped: ${probe.reason}`)
    expect(probe.lost, 'WEBGL_lose_context did not dispatch webglcontextlost').toBe(true)
    await expect
      .poll(() => page.evaluate(() => window.__jlzHost?.recovered === true), { timeout: 15000 })
      .toBe(true)
    expect(await page.locator('canvas.canvas').count()).toBe(1)
    const fatal = errors.filter(isFatalError)
    expect(fatal, `Fatal errors:\n${fatal.join('\n')}`).toEqual([])
  })

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

      await waitForRouter(page)
      await navigateInApp(page, '/works')
      await expect(page).toHaveURL(/\/works$/)
      await expect(page.locator('.jlz-route-transition')).toHaveCount(0)
    } finally {
      await ctx.close()
    }
  })
})
