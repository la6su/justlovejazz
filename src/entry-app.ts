import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, type BootstrapOptions } from './main-app'
import { BlurFade } from './Experience/BlurFade'
import { eventBus } from './core/EventBus'

const SOUND_KEY = 'jlz:sound'
const LANG_KEY = 'jlz:lang'

// ── Config: sound toggle (splash overlay) ──
function initSoundToggle(): void {
  const btn = document.getElementById('cfg-sound') as HTMLButtonElement | null
  if (!btn) return
  let soundOn = false
  try {
    if (localStorage.getItem(SOUND_KEY) === 'on') soundOn = true
  } catch { /* ignore */ }
  const update = () => {
    btn.setAttribute('aria-pressed', String(soundOn))
    btn.classList.toggle('is-off', !soundOn)
    btn.title = soundOn ? 'Sound: On (click to mute)' : 'Sound: Off (click to enable)'
  }
  update()
  btn.addEventListener('click', () => {
    soundOn = !soundOn
    try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off') } catch { /* ignore */ }
    update()
  })
}

// ── Config: language toggle EN/RU (splash overlay — stub for now) ──
function initLangToggle(): void {
  const btn = document.getElementById('cfg-lang') as HTMLButtonElement | null
  if (!btn) return
  let lang: 'EN' | 'RU' = 'EN'
  try {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'RU') lang = 'RU'
  } catch { /* ignore */ }
  const update = () => {
    btn.querySelector('span')!.textContent = lang
    btn.setAttribute('aria-pressed', String(lang === 'RU'))
    btn.title = `Language: ${lang} (click to switch)`
  }
  update()
  btn.addEventListener('click', () => {
    lang = lang === 'EN' ? 'RU' : 'EN'
    try { localStorage.setItem(LANG_KEY, lang) } catch { /* ignore */ }
    update()
  })
}

// ── Enter button click is wired by inline script in index.html ──
// (single source of truth — works even if entry-app.ts fails to load).
// entry-app.ts only shows the button (showEnterButton) when 3D is ready.
function initEnterButton(): void {
  // No-op — click handler is in inline <script> in index.html.
  // This function kept for API compat (called in startApp).
}

// ── Show Enter button when 3D is ready ──
function showEnterButton(): void {
  const enterBtn = document.getElementById('jlz-splash-enter') as HTMLButtonElement | null
  if (!enterBtn) return
  // Fill progress ring to 100% then show Enter
  updateLoaderProgress(100)
  enterBtn.classList.add('is-ready')
}

// ── Seamless splash loader ──
// index.html has #jlz-app-loader with SVG squares + CRT curtains + progress.
// three.js loads LAZY (dynamic import in main-app.ts) — does NOT block FCP.
// We update progress as Experience.init() boots, then trigger curtain
// split (fade-out class) when jlz:webgl-ready fires. Config buttons
// (sound + language) are inside the loader — they fade out with the splash.
// Fade-out is triggered by Enter button click (initEnterButton), NOT auto.
function updateLoaderProgress(pct: number): void {
  const ring = document.querySelector('.jlz-splash-progress-ring') as SVGRectElement | null
  if (!ring) return
  const value = Math.min(100, Math.max(0, Math.round(pct)))
  // Perimeter of sq-4 rect = 4 × 266 = 1064
  // dashoffset: 1064 (0%, empty) → 0 (100%, full ring)
  const perimeter = 1064
  const offset = perimeter - (perimeter * value / 100)
  ring.style.strokeDashoffset = String(offset)
}

async function boot(): Promise<void> {
  const opts: BootstrapOptions = {
    progress: (pct) => {
      updateLoaderProgress(Math.min(100, pct))
    },
  }

  await bootstrapApp(opts)
  scheduleUiKitRefresh()
}

function scheduleUiKitRefresh(): void {
  const refresh = () => {
    const content = document.getElementById('spa-content')
    if (!content) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update()
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
  initEnterButton()

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
  ;(UIkit as { use: (p: object) => void }).use(Icons as object)

  // scrollspy-pending: cancel scrollspy animations until jlz:webgl-ready
  // fires (prevents fade-in playing behind loader).
  document.body.classList.add('scrollspy-pending')
  initRouter()

  // jlz:webgl-ready fires when Experience.init() completes — show Enter button.
  // Animations (BlurFade + NoiseText) are DELAYED until jlz:splash-entered
  // (Enter click) so user sees them as 3D scene reveals, not behind splash.
  eventBus.on('jlz:webgl-ready', () => {
    showEnterButton()
  })

  // jlz:splash-entered fires when user clicks Enter — splash starts fading.
  // NOW trigger animations (titles + scrollspy) so they're visible as 3D reveals.
  window.addEventListener('jlz:splash-entered', () => {
    document.body.classList.remove('scrollspy-pending')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(document)
    // Small delay — let curtains start splitting so DOM is partially visible
    setTimeout(() => {
      animateBlurFadeTitles()
      setupTitleObserver()
    }, 300) // 300ms into 800ms curtain split — titles animate as scene reveals
  })

  // Fallback: if jlz:webgl-ready doesn't fire within 4s (Experience.init
  // crashed or hung), show Enter button anyway so the user isn't stuck
  // staring at "Loading". The app may still be partially functional.
  setTimeout(() => {
    const enterBtn = document.getElementById('jlz-splash-enter')
    if (enterBtn && !enterBtn.classList.contains('is-ready')) {
      console.warn('[entry-app] jlz:webgl-ready timeout — showing Enter button')
      document.body.classList.remove('scrollspy-pending')
      showEnterButton()
    }
  }, 4000)

  // ── Animate titles on section change ──
  eventBus.on('jlz:section-change', (payload) => {
    if (!payload?.sectionId) return
    const section = document.querySelector(`[data-section="${payload.sectionId}"]`)
    if (!section) return
    const title = section.querySelector<HTMLElement>('.studio-title')
    if (title) {
      const text = title.textContent?.trim() || ''
      if (text) BlurFade.for(title).show(1.5) // 1.5s — softer/longer
    }
  })

  void boot()
}

/**
 * IntersectionObserver that fires BlurFade when a .studio-title enters the
 * viewport — synchronized with UIkit scrollspy's viewport entry.
 */
function setupTitleObserver(): void {
  const titles = document.querySelectorAll<HTMLElement>('.studio-title')
  if (titles.length === 0) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          const text = el.textContent?.trim() || ''
          if (text) BlurFade.for(el).show(1.2)
        }
      }
    },
    { threshold: 0.15 },
  )
  titles.forEach((t) => observer.observe(t))
}

/**
 * BlurFade animation on studio titles — animates ALL .studio-title elements.
 */
let blurFadeAnimating = false

function animateBlurFadeTitles(): void {
  if (blurFadeAnimating) return
  blurFadeAnimating = true
  setTimeout(() => {
    blurFadeAnimating = false
  }, 2200)

  for (const el of document.querySelectorAll<HTMLElement>('.studio-title')) {
    const text = el.textContent?.trim() || ''
    if (!text) continue
    BlurFade.for(el).show(1.2)
  }
}
