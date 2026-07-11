import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { initRouter } from './router'
import { bootstrap as bootstrapApp, type BootstrapOptions } from './main-app'
import { BlurFade } from './Experience/BlurFade'
import { eventBus } from './core/EventBus'

const THEME_KEY = 'jlz:theme'
const SOUND_KEY = 'jlz:sound'

// ── Config: theme toggle (splash overlay) ──
function initThemeToggle(): void {
  const btn = document.getElementById('cfg-theme') as HTMLButtonElement | null
  if (!btn) return
  let isInverse = false
  try {
    if (localStorage.getItem(THEME_KEY) === 'inverse') isInverse = true
  } catch { /* ignore */ }
  const update = () => {
    btn.setAttribute('aria-pressed', String(isInverse))
    btn.classList.toggle('is-off', !isInverse)
    btn.title = isInverse ? 'Theme: Inverse (click for Auto)' : 'Theme: Auto (click for Inverse)'
  }
  update()
  btn.addEventListener('click', () => {
    isInverse = !isInverse
    try { localStorage.setItem(THEME_KEY, isInverse ? 'inverse' : 'auto') } catch { /* ignore */ }
    update()
  })
}

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

// ── Seamless splash loader ──
// index.html has #jlz-app-loader with SVG squares + CRT curtains + progress.
// three.js loads LAZY (dynamic import in main-app.ts) — does NOT block FCP.
// We update progress as Experience.init() boots, then trigger curtain
// split (fade-out class) when jlz:webgl-ready fires. Config buttons
// (theme/sound) are inside the loader — they fade out with the splash.
// After fade, navbar theme toggle takes over.
function fadeOutLoader(): void {
  const loader = document.getElementById('jlz-app-loader')
  if (!loader) return
  // Set progress to 100% before split (visual completeness)
  updateLoaderProgress(100)
  // Small delay so user sees 100% before curtains split
  setTimeout(() => {
    loader.classList.add('fade-out')
    // Remove from DOM after curtain split (0.8s) + small buffer
    setTimeout(() => loader.remove(), 1000)
  }, 200)
}

function updateLoaderProgress(pct: number): void {
  const bar = document.getElementById('jlz-loader-bar')
  const pctEl = document.getElementById('jlz-loader-pct')
  const statusEl = document.getElementById('jlz-loader-status')
  const progressbar = document.getElementById('jlz-loader-progress')
  if (!bar || !pctEl) return
  const value = Math.min(100, Math.max(0, Math.round(pct)))
  bar.style.width = `${value}%`
  pctEl.textContent = `${value}%`
  // Update ARIA for screen readers
  if (progressbar) progressbar.setAttribute('aria-valuenow', String(value))
  // Status text — friendly phases
  if (statusEl) {
    if (value >= 95) statusEl.textContent = 'Ready'
    else if (value >= 55) statusEl.textContent = 'Warming up'
    else if (value >= 20) statusEl.textContent = 'Loading'
    else statusEl.textContent = 'Starting'
  }
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
  // Init splash config toggles FIRST (theme/sound) — instant, no dependencies.
  // These work during loading, before three.js finishes.
  initThemeToggle()
  initSoundToggle()

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

  // jlz:webgl-ready fires when Experience.init() completes — fade out
  // the loader, drop scrollspy-pending, animate titles.
  eventBus.on('jlz:webgl-ready', () => {
    document.body.classList.remove('scrollspy-pending')
    fadeOutLoader()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(UIkit as any).update(document)
    animateBlurFadeTitles()
    setupTitleObserver()
    // Note: eyebrow NoiseText is driven by Experience.ts jlz:section-change
    // handler (single source of truth). No IntersectionObserver — it caused
    // conflicts (double-trigger + stale noise captured as cleanText).
    // After CRT curtains split (~0.8s), trigger SplashCube opener —
    // the glass cube does a scale pulse + particle burst.
    // This is the "baku awakens" moment when the 3D scene is revealed.
    setTimeout(() => {
      const exp = (window as unknown as { experience?: { triggerSplashOpener?: () => void } }).experience
      exp?.triggerSplashOpener?.()
    }, 600) // slightly before curtains finish — cube pulses as they open
  })

  // Fallback: if jlz:webgl-ready doesn't fire within 6s (Experience.init
  // crashed or hung), fade out the loader anyway so the user isn't stuck
  // staring at "Loading". The app may still be partially functional.
  setTimeout(() => {
    const loader = document.getElementById('jlz-app-loader')
    if (loader && !loader.classList.contains('fade-out')) {
      console.warn('[entry-app] jlz:webgl-ready timeout — forcing loader fade-out')
      document.body.classList.remove('scrollspy-pending')
      fadeOutLoader()
    }
  }, 6000)

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
