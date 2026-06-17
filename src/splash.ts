// src/splash.ts — instant splash screen (zero deps: no Three.js, no heavy imports)
// Purpose: paint immediately on FCP. Heavy app loads in background.

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
  setState(state: 'booting' | 'warming' | 'ready'): void
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
  let labelEl: HTMLDivElement | null = null
  let shellReady = false

  function bindExistingShell() {
    const root = document.getElementById(id)
    const bar = document.getElementById('jlj-splash-progress') as HTMLDivElement | null
    const label = document.getElementById('jlj-splash-label') as HTMLDivElement | null
    if (!root || !bar || !label) return false
    el = root
    progressBar = bar
    labelEl = label
    shellReady = true
    return true
  }

  function doShow() {
    if (el) return
    if (bindExistingShell()) return

    el = document.createElement('div')
    el.id = id
    // All visual styling lives in src/styles/tokens.css (#jlj-splash*).
    // This function only builds the DOM structure; opacity/width are
    // toggled dynamically in doHide/doSetProgress.

    // ── Brand mark ──
    const logo = document.createElement('div')
    logo.textContent = 'JUSTLOVEJAZZ'
    el.appendChild(logo)

    // ── Progress bar fill (track is via ::before on #jlj-splash-progress
    //     OR a sibling; here we keep the simple fill-only structure) ──
    progressBar = document.createElement('div')
    progressBar.id = 'jlj-splash-progress'
    el.appendChild(progressBar)

    // ── State label ──
    labelEl = document.createElement('div')
    labelEl.id = 'jlj-splash-label'
    labelEl.textContent = 'loading'
    el.appendChild(labelEl)

    document.body.prepend(el)
    shellReady = true
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
      // Keep the ARIA progressbar value in sync for screen readers.
      progressBar.setAttribute('aria-valuenow', String(Math.round(pct)))
    }
    if (pct >= 95) doSetState('ready')
    else if (pct >= 55) doSetState('warming')
    else doSetState('booting')
  }

  function doSetState(state: 'booting' | 'warming' | 'ready') {
    if (!shellReady) bindExistingShell()
    if (!labelEl) return
    labelEl.textContent = state
  }

  return {
    show: doShow,
    hide: doHide,
    remove: doRemove,
    setProgress: doSetProgress,
    setState: doSetState,
  }
}
