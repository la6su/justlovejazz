// src/splash.ts — instant splash screen (zero deps: no Three.js, no heavy imports)
// Purpose: paint immediately on FCP. Heavy app loads in background.

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
}

/**
 * Zero-dependency splash overlay.
 *
 * Renders a minimal dark screen with the brand mark and a thin progress bar.
 * No external CSS, no fonts, no images — guaranteed to paint before first frame.
 */
export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let el: HTMLElement | null = null
  let progressBar: HTMLDivElement | null = null
  let progressTrack: HTMLDivElement | null = null
  let labelEl: HTMLDivElement | null = null

  function doShow() {
    if (el) return

    el = document.createElement('div')
    el.id = id
    el.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:#0a0a0a;
      display:flex;align-items:center;justify-content:center;flex-direction:column;
      opacity:1;transition:opacity .6s ease;
      will-change:opacity;
    `

    // ── Brand mark ──
    const logo = document.createElement('div')
    logo.style.cssText = `
      color:#fff;font:700 clamp(1.5rem,4vw,3rem) system-ui,-apple-system,sans-serif;
      letter-spacing:.3em;text-align:center;opacity:0;
      animation:splashIn .8s ease .1s forwards;
    `
    logo.textContent = 'JUSTLOVEJAZZ'
    el.appendChild(logo)

    // ── Progress bar (track + fill) ──
    progressTrack = document.createElement('div')
    progressTrack.style.cssText = `
      position:absolute;bottom:0;left:0;right:0;
      height:2px;background:rgba(255,255,255,.06);
      transform:translateY(0);
    `
    el.appendChild(progressTrack)

    progressBar = document.createElement('div')
    progressBar.style.cssText = `
      position:absolute;bottom:0;left:0;
      height:2px;width:0%;
      background:#fff;
      transition:width .3s ease;
      will-change:width;
    `
    el.appendChild(progressBar)

    // ── PerceEl ──
    labelEl = document.createElement('div')
    labelEl.style.cssText = `
      position:absolute;bottom:24px;
      color:rgba(255,255,255,.3);
      font:600 .65rem system-ui,sans-serif;
      letter-spacing:.12em;text-transform:uppercase;
    `
    labelEl.textContent = 'loading'
    el.appendChild(labelEl)

    // ── Splash keyframe ──
    if (!document.getElementById('jlj-splash-styles')) {
      const style = document.createElement('style')
      style.id = 'jlj-splash-styles'
      style.textContent = `@keyframes splashIn { to { opacity: 1; } }`
      document.head.appendChild(style)
    }

    document.body.prepend(el)
  }

  function doHide(durationMs = 600) {
    if (!el) return
    el.style.opacity = '0'
    setTimeout(() => {
      if (el) {
        el.remove()
        el = null
      }
    }, durationMs)
  }

  function doRemove() {
    if (!el) return
    el.remove()
    el = null
  }

  function doSetProgress(pct: number) {
    if (progressBar) {
      progressBar.style.width = `${Math.round(pct)}%`
    }
    if (labelEl && pct >= 95) {
      labelEl.textContent = 'ready'
    }
  }

  return {
    show: doShow,
    hide: doHide,
    remove: doRemove,
    setProgress: doSetProgress,
  }
}
