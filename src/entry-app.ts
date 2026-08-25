import UIkit from 'uikit'
import { BlurFade } from './Experience/BlurFade'
import { NoiseText } from './Experience/NoiseText'
import { eventBus } from './core/EventBus'
import { initWorkCards } from './UI/WorkCards'
import { getSoundMuted, setSoundMutedPreference } from './core/SfxSystem'
import { prefersReducedMotion } from './core/motionPolicy'
import { getCurrentPage } from './core/routePage'
// LANG_KEY handled by i18n.ts
import { INITIAL_BOOTSTRAP_STATE, tryTransition, type BootstrapState } from './core/bootstrapStates'

// ── Config: sound toggle (splash overlay) ──
function initSoundToggle(): void {
  const btn = document.getElementById('cfg-sound') as HTMLButtonElement | null
  if (!btn) return
  let soundOn = !getSoundMuted()
  const update = () => {
    btn.setAttribute('aria-pressed', String(soundOn))
    btn.classList.toggle('is-off', !soundOn)
    btn.title = soundOn ? 'Sound: On (click to mute)' : 'Sound: Off (click to enable)'
  }
  update()
  btn.addEventListener('click', () => {
    soundOn = !soundOn
    setSoundMutedPreference(!soundOn)
    update()
  })
}

// ── Config: language toggle EN/RU ──
import { initI18n, toggleLang, getLang } from './core/i18n'

// ── window.__jlzEmit — typed `jlz:*` port facade for non-module producers ──
// The Phase 10 raw window `jlz:*` bridge was removed — the app only receives
// those ports through the typed `eventBus`. Two non-module sites still need to
// emit a port without importing the TS graph:
//   • the index.html splash Enter script (classic, kept outside the initial
//     Vue/Tres/Three/UIkit dependency graph) emits `jlz:splash-entered`;
//   • the e2e suite (production preview) and the Phase 10 soak (dev) trigger
//     `jlz:navigate` etc. from outside the app.
// Both call this facade instead of `window.dispatchEvent`. It is a thin alias
// over the public, typed `eventBus.emit` and adds no new capability surface
// (the equivalent raw dispatch existed in production pre-migration).
// Installed at module scope — the moment entry-app.ts loads, which is before
  // the Vue router mounts and before the splash Enter button
// is ever enabled (`jlz:webgl-ready`) — so it is always present for the splash
// and for navigation tests regardless of whether `experience.init()` succeeds.
;(window as unknown as { __jlzEmit?: (event: string, detail?: unknown) => void }).__jlzEmit = (
  event,
  detail,
) => {
  ;(eventBus.emit as (name: string, detail?: unknown) => void).call(eventBus, event, detail)
}

function initLangToggle(): void {
  const btn = document.getElementById('cfg-lang') as HTMLButtonElement | null
  if (!btn) return
  initI18n()
  const update = () => {
    const lang = getLang()
    btn.querySelector('span')!.textContent = lang
    btn.setAttribute('aria-pressed', String(lang === 'RU'))
    btn.title = `Language: ${lang} (click to switch)`
  }
  update()
  btn.addEventListener('click', () => {
    toggleLang()
    update()
  })
}

// ── Enter button click is wired by inline script in index.html ──
// (initEnterButton removed — was empty no-op. Click handler is in inline
//  <script> in index.html. Was called in startApp but did nothing.)

// ── Show Enter button when 3D is ready ──
function showEnterButton(): void {
  const enterBtn = document.getElementById('jlz-splash-enter') as HTMLButtonElement | null
  if (!enterBtn) return
  // Fill progress ring to 100% then show Enter
  updateLoaderProgress(100)
  enterBtn.classList.add('is-ready')
}

// ── Show a load error when 3D fails to initialize ──
// Replaces the Enter button with an error message + retry link. This runs
// if Experience.init() throws (jlz:webgl-failed) or if jlz:webgl-ready
// doesn't fire within 30s (init hung). The Enter button must NEVER appear
// when 3D isn't ready — clicking it would fade the splash to reveal an
// uninitialized scene (no carousel, no baku, broken camera).
function showLoadError(): void {
  const enterBtn = document.getElementById('jlz-splash-enter')
  const loader = document.getElementById('jlz-app-loader')
  if (!loader) return
  // Replace the Enter button area with an error message
  if (enterBtn) {
    const parent = enterBtn.parentElement
    if (parent) {
      parent.innerHTML = `
        <div style="text-align:center; color: var(--jlz-color-text-muted, rgba(255,255,255,0.7)); font-family:Commissioner,sans-serif; max-width: 320px;">
          <p style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--jlz-color-status-danger, rgba(255,100,100,0.8)); margin:0 0 0.5rem;">3D Failed</p>
          <p style="font-size:0.8rem; line-height:1.4; margin:0 0 1rem;">The 3D experience couldn't load. Your browser may not support WebGL2, or the GPU is unavailable.</p>
          <a href="/" style="font-size:0.7rem; font-weight:600; text-transform:uppercase; color:var(--jlz-color-signal-cool, #6b78a3); text-decoration:none; border:1px solid color-mix(in srgb, var(--jlz-color-signal-cool, #6b78a3) 30%, transparent); padding:0.5rem 1rem; border-radius:999px;">Retry</a>
        </div>
      `
    }
  }
}

// ── Seamless splash loader ──
// index.html has #jlz-app-loader with SVG squares + split curtains + progress.
// Three.js loads lazily from this bootstrap — it does not block FCP.
// We update progress as Experience.init() boots, then trigger curtain
// split (fade-out class) when jlz:webgl-ready fires. Config buttons
// (sound + language) are inside the loader — they fade out with the splash.
// Fade-out is triggered by Enter button click (inline script in index.html), NOT auto.
function updateLoaderProgress(pct: number): void {
  const ring = document.querySelector('.jlz-splash-progress-ring') as SVGRectElement | null
  if (!ring) return
  const value = Math.min(100, Math.max(0, Math.round(pct)))
  // Perimeter of sq-4 rect = 4 × 266 = 1064
  // dashoffset: 1064 (0%, empty) → 0 (100%, full ring)
  const perimeter = 1064
  const offset = perimeter - (perimeter * value) / 100
  ring.style.strokeDashoffset = String(offset)
}

let _bootstrapState: BootstrapState = INITIAL_BOOTSTRAP_STATE

function transitionBootstrap(next: BootstrapState): boolean {
  const result = tryTransition(_bootstrapState, next)
  if (!result) {
    console.warn(`[entry-app] invalid bootstrap transition: ${_bootstrapState} -> ${next}`)
    return false
  }
  _bootstrapState = result
  return true
}

async function boot(): Promise<void> {
  if (_bootstrapState === 'ready' || _bootstrapState === 'entered') return
  if (_bootstrapState === 'failed') transitionBootstrap('app-loading')
  else if (_bootstrapState === 'shell-painted') transitionBootstrap('app-loading')
  const progress = (pct: number) => updateLoaderProgress(Math.min(100, pct))

  // ?no-scene=1 — Phase 5 prerender contract: boot the route shell and the
  // semantic route content WITHOUT the scene runtime (the Three/Experience
  // dynamic imports below never run, no canvas is created). The loader ring
  // completes and `jlz:webgl-ready` fires synchronously so the Enter flow
  // and every scene-ready consumer proceed on a DOM-only world. This is the
  // evidence path for the Phase 5 candidate gate: routes + navigation work
  // with zero renderer, and a route can never (re)create one.
  if (new URLSearchParams(window.location.search).has('no-scene')) {
    try {
      transitionBootstrap('renderer-initializing')
      progress(100)
      const { UIManager } = await import('./UI/UIManager')
      new UIManager().init()
      transitionBootstrap('scene-prewarming')
      transitionBootstrap('ready')
      eventBus.emit('jlz:webgl-ready')
    } catch (e) {
      console.error('[entry-app] no-scene bootstrap failed:', e)
      transitionBootstrap('failed')
      eventBus.emit('jlz:webgl-failed')
    }
    scheduleUiKitRefresh()
    return
  }

  // A failed initialization enters the explicit failed state; a later retry
  // transitions back to app-loading without requiring a page reload.
  try {
    const { ErrorTracker } = await import('./core/ErrorTracker')
    ErrorTracker.init()
    transitionBootstrap('renderer-initializing')
    // entry-shell.ts set the reduced-motion dataset synchronously at shell
    // load (legacy E2E/CSS hook); the preference itself is read on demand
    // through motionPolicy.prefersReducedMotion().

    const bootStart = performance.now()
    progress(15)

    const { UIManager } = await import('./UI/UIManager')
    const ui = new UIManager()
    ui.init()
    progress(40)

    // ── Phase 7: the persistent SceneHost (Vue) is the readiness handshake ──
    // AppShell mounts SceneHost (startApp above); it owns the one canvas, the
    // custom renderer factory and the camera. `sceneHost.ready` settles only
    // AFTER renderer init + actual-backend inspection + the software-adapter
    // policy decision + the Tres context mount. Experience adopts those
    // instances and awaits the initial World's first successful render
    // (Experience.init → firstRender), so `jlz:webgl-ready` below can only
    // fire after that — the renderer factory return alone never satisfies
    // readiness. The `?no-scene` DOM-only rollback above returns earlier and
    // never reaches this handshake.
    const { sceneHost } = await import('./app/sceneHost')
    const host = await sceneHost.ready
    transitionBootstrap('scene-prewarming')
    const { Experience } = await import('./Experience/Experience')
    progress(55)

    const experience = new Experience(
      ui,
      {
        scene: host.scene,
        camera: host.camera,
        renderer: host.renderer,
        canvas: host.canvas,
        mode: host.mode,
        replaceRenderer: (renderer) => sceneHost.replaceRenderer(renderer),
      },
      getCurrentPage,
    )
    await experience.init()
    if (import.meta.env.DEV) {
      ;(window as unknown as { __jlzRuntimeDestroy?: () => void }).__jlzRuntimeDestroy = () => {
        experience.destroy()
      }
    }
    // Phase 6 evidence (fixed 2026-08-22): the unified `WebGPURenderer` on
    // `WebGLBackend` keeps the direct-WebGL path (no TSL post) by design; TSL
    // post runs only on `WebGPUBackend` (`WebGPUPostPipeline`). No
    // TSL-post-on-WebGLBackend claim is made. (The dev-forced classic
    // `?renderer=webgl` parity QA owner that compared the two paths was
    // removed in Phase 10; the automatic software-adapter fallback remains.)
    if (import.meta.env.DEV) {
      console.info(
        `[entry-app] Phase 7 host ready: mode=${host.mode} backend=${host.backend.backendName ?? '?'} isFallbackAdapter=${host.backend.isFallbackAdapter}`,
      )
    }
    progress(95)
    // Small delay at 95% so user sees 'Ready' status before 100% + curtain split
    await new Promise((resolve) => setTimeout(resolve, 150))
    progress(100)

    // ── Fire jlz:webgl-ready → fades out #jlz-app-loader + animates titles ──
    const INTRO_MS = 600
    const elapsed = performance.now() - bootStart
    const readyAt = Math.max(0, INTRO_MS - elapsed)

    transitionBootstrap('ready')
    setTimeout(
      () => {
        eventBus.emit('jlz:webgl-ready')
      },
      prefersReducedMotion() ? 0 : readyAt,
    )
  } catch (e) {
    console.error('[entry-app] bootstrap failed:', e)
    transitionBootstrap('failed')
    eventBus.emit('jlz:webgl-failed')
    // The failed state allows retry without a page reload.
  }

  scheduleUiKitRefresh()
}

function scheduleUiKitRefresh(): void {
  const refresh = () => {
    const content = document.getElementById('spa-content')
    if (!content) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(content)
  }
  if ('requestIdleCallback' in window) {
    ;(
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void
      }
    ).requestIdleCallback(refresh, { timeout: 800 })
  } else {
    setTimeout(refresh, 120)
  }
}

export async function startApp(): Promise<void> {
  // Init splash config toggles FIRST — instant, no dependencies.
  // These work during loading, before three.js finishes.
  initSoundToggle()
  initLangToggle()
  // (initEnterButton call removed — was a no-op.)

  // Use ?inline to prevent Vite from injecting @vite/client (updateStyle/
  // removeStyle) into the CSS module — through the reverse proxy, /@vite/client
  // resolves to the Next.js app which returns HTML instead of JS, breaking
  // the entire module loading chain. ?inline returns raw CSS string without
  // HMR injection.
  const cssModule = await import('./assets/main.less?inline')
  // Manually inject the CSS into the document
  const style = document.createElement('style')
  style.textContent = (cssModule as unknown as { default: string }).default || ''
  document.head.appendChild(style)
  // Register console-themed SVG icons — replaces UIKit's default icon set
  // (76KB) with our custom pixel/console-style icons. No uikit-icons import.
  // UIKit's icon component is built into the core; we just register our SVGs.
  import('./assets/console-icons')
    .then(({ registerConsoleIcons }) => {
      registerConsoleIcons()
    })
    .catch(() => {
      /* icons are enhancement, not critical */
    })

  // Phase 5 (cleanup): Vue Router (src/app) owns navigation. The dynamic
  // import below is the only edge into the Vue graph, so the router + route
  // SFCs stay in a separate lazy `app` chunk and the initial entry bundle
  // remains lean. The scene runtime boots exactly once regardless of the
  // route.
  void import('./app').then((m) => m.mountVueApp())

  // ── Works page 3D cards: bind tilt + click on every route change ──
  // initWorkCards() is idempotent (skips already-bound cards).
  eventBus.on('jlz:route-change', () => {
    initWorkCards()
  })
  initWorkCards()

  // jlz:webgl-ready fires when Experience.init() completes — show Enter button.
  // Animations (BlurFade + NoiseText) are DELAYED until jlz:splash-entered
  // (Enter click) so user sees them as 3D scene reveals, not behind splash.
  eventBus.on('jlz:webgl-ready', () => {
    showEnterButton()
  })

  // jlz:webgl-failed fires if Experience.init() throws — show an error message
  // instead of the Enter button, so the user knows the 3D failed (not just slow).
  eventBus.on('jlz:webgl-failed', () => {
    if (_bootstrapState !== 'failed') transitionBootstrap('failed')
    showLoadError()
  })

  // jlz:splash-entered fires when user clicks Enter — splash starts fading.
  // Let the active title answer the opening curtain, rather than animating
  // every title in the document behind the splash.
  eventBus.on('jlz:splash-entered', () => {
    transitionBootstrap('entered')
    // Let the curtain begin to split, then reveal the title inside that gap.
    setTimeout(() => {
      revealActiveSplashTitle()
      setupTitleObserver()
    }, 90)
  })

  // Fallback: if jlz:webgl-ready doesn't fire within 60s (Experience.init
  // crashed or hung), show a load error. The Enter button stays DISABLED
  // (greyed, non-clickable) the entire time — it never activates until 3D
  // is truly ready. Under CPU/network throttling, init() can take 10-20s;
  // that's expected and the progress ring keeps the user informed.
  setTimeout(() => {
    const enterBtn = document.getElementById('jlz-splash-enter')
    if (enterBtn && !enterBtn.classList.contains('is-ready')) {
      console.error('[entry-app] jlz:webgl-ready did not fire within 60s — showing load error')
      showLoadError()
    }
  }, 60000)

  // ── Animate titles on section change (home: data-section) ──
  eventBus.on('jlz:section-change', (payload) => {
    if (!payload?.sectionId) return
    if (prefersReducedMotion()) return
    const section = document.querySelector(`[data-section="${payload.sectionId}"]`)
    if (!section) return
    const title = section.querySelector<HTMLElement>('.studio-title')
    if (title && title.dataset.blurFade !== 'off') {
      const text = title.textContent?.trim() || ''
      if (text) BlurFade.for(title).show(1.5)
    }
  })

  // ── Animate titles on page section change (content: data-page-section) ──
  eventBus.on('jlz:page-section-change', ({ index }) => {
    if (prefersReducedMotion()) return
    const sections = document.querySelectorAll<HTMLElement>('[data-page-section]')
    const el = sections[index]
    if (!el) return
    // BlurFade on title
    const title = el.querySelector<HTMLElement>('.studio-title')
    if (title && title.dataset.blurFade !== 'off') {
      const text = title.textContent?.trim() || ''
      if (text) BlurFade.for(title).show(1.5)
    }
    // NoiseText on eyebrow
    const eyebrow = el.querySelector<HTMLElement>('[data-eyebrow]')
    if (eyebrow) {
      const text = eyebrow.getAttribute('data-eyebrow-text') ?? eyebrow.textContent ?? ''
      if (text) NoiseText.for(eyebrow).show(0.6, text)
    }
  })

  void boot()
}

/**
 * IntersectionObserver that fires BlurFade when a .studio-title enters the
 * viewport — synchronized with UIkit scrollspy's viewport entry.
 */
let _titleObserver: IntersectionObserver | null = null
const splashRevealedTitles = new WeakSet<HTMLElement>()

function setupTitleObserver(): void {
  // Disconnect previous observer if any (HMR re-init guard)
  _titleObserver?.disconnect()
  if (prefersReducedMotion()) return

  const titles = document.querySelectorAll<HTMLElement>('.studio-title:not([data-blur-fade="off"])')
  if (titles.length === 0) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          // The splash owns the first reveal of the visible title. Skipping
          // this one observer entry prevents its slower default reveal from
          // restarting over the splash-specific animation.
          if (splashRevealedTitles.delete(el)) continue
          const text = el.textContent?.trim() || ''
          if (text) BlurFade.for(el).show(1.2)
        }
      }
    },
    { threshold: 0.15 },
  )
  titles.forEach((t) => observer.observe(t))
  _titleObserver = observer
}

/** Fast first reveal that is synchronized with the splash curtain opening. */
function revealActiveSplashTitle(): void {
  const title = document.querySelector<HTMLElement>(
    '.section-active .studio-title:not([data-blur-fade="off"]), [data-section="intro"] .studio-title:not([data-blur-fade="off"])',
  )
  if (!title) return

  splashRevealedTitles.add(title)
  const text = title.textContent?.trim() || ''
  if (text && !prefersReducedMotion()) BlurFade.for(title).show(0.55, text)
}
