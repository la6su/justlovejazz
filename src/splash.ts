// splash.ts — Cinematic portal splash screen
//
// Flow:
// 1. Black screen → "JUSTLOVEJAZZ" fades in (warming phase)
// 2. Portal frames: 3-4 rectangular frames scale down toward center
//    creating a "flying through portals" effect
// 3. Curtain split: top/bottom panels slide apart with overshoot
// 4. Brand exits, scene revealed

export type SplashPhase = 'loading' | 'enter' | 'dissolving' | 'revealing' | 'idle'

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
  setState(state: 'booting' | 'warming' | 'ready'): void
  triggerPortalCollapse(): void
  curtainSplit(duration?: number): void
  markPhase(phase: SplashPhase): void
  getElements(): { root: HTMLElement; top: HTMLElement; bottom: HTMLElement; line: HTMLElement } | null
}

export function createSplash(): SplashOverlay {
  const id = 'jlj-splash'
  let root: HTMLElement | null = null
  let topPanel: HTMLDivElement | null = null
  let bottomPanel: HTMLDivElement | null = null
  let splitLine: HTMLDivElement | null = null
  let brandEl: HTMLDivElement | null = null
  let progressBar: HTMLDivElement | null = null
  let labelEl: HTMLDivElement | null = null
  let portalContainer: HTMLDivElement | null = null
  let portals: HTMLDivElement[] = []
  let shellReady = false

  function bindShell() {
    const existing = document.getElementById(id)
    if (!existing) return false
    root = existing
    topPanel = existing.querySelector('.jlj-splash-top')!
    bottomPanel = existing.querySelector('.jlj-splash-bottom')!
    splitLine = existing.querySelector('.jlj-splash-line')!
    brandEl = existing.querySelector('#jlj-splash-brand')!
    progressBar = existing.querySelector('#jlj-splash-progress')!
    labelEl = existing.querySelector('#jlj-splash-label')!
    portalContainer = existing.querySelector('.jlj-splash-portals')!
    portals = Array.from(existing.querySelectorAll('.jlj-splash-portal'))
    shellReady = true
    return true
  }

  function buildShell() {
    root = document.createElement('div')
    root.id = id
    root.setAttribute('data-phase', 'loading')

    // Portal frames container
    portalContainer = document.createElement('div')
    portalContainer.className = 'jlj-splash-portals'

    // Create 4 portal frames (different sizes, staggered animation)
    for (let i = 0; i < 4; i++) {
      const portal = document.createElement('div')
      portal.className = `jlj-splash-portal jlz-portal-${i + 1}`
      portal.style.animationDelay = `${0.1 + i * 0.15}s`
      portalContainer.appendChild(portal)
      portals.push(portal)
    }

    topPanel = document.createElement('div')
    topPanel.className = 'jlj-splash-top'

    bottomPanel = document.createElement('div')
    bottomPanel.className = 'jlj-splash-bottom'

    progressBar = document.createElement('div')
    progressBar.id = 'jlj-splash-progress'
    progressBar.setAttribute('role', 'progressbar')
    progressBar.setAttribute('aria-valuenow', '0')
    progressBar.setAttribute('aria-valuemin', '0')
    progressBar.setAttribute('aria-valuemax', '100')
    bottomPanel.appendChild(progressBar)

    labelEl = document.createElement('div')
    labelEl.id = 'jlj-splash-label'
    labelEl.className = 'jlj-splash-label'
    bottomPanel.appendChild(labelEl)

    splitLine = document.createElement('div')
    splitLine.className = 'jlj-splash-line'

    brandEl = document.createElement('div')
    brandEl.id = 'jlj-splash-brand'
    brandEl.textContent = 'JUSTLOVEJAZZ'

    // Cinematic overlays
    const vignette = document.createElement('div')
    vignette.className = 'jlj-splash-vignette'

    const scanlines = document.createElement('div')
    scanlines.className = 'jlj-splash-scanlines'

    root.appendChild(portalContainer)
    root.appendChild(topPanel)
    root.appendChild(bottomPanel)
    root.appendChild(splitLine)
    root.appendChild(brandEl)
    root.appendChild(vignette)
    root.appendChild(scanlines)
    document.body.appendChild(root)
    shellReady = true
  }

  return {
    show(): void {
      if (!shellReady) {
        bindShell() || buildShell()
      }
      root!.style.opacity = '1'
      root!.style.visibility = 'visible'
    },

    hide(_durationMs?: number): void {
      if (!root) return
      root.classList.add('hide')
    },

    remove(): void {
      if (root) {
        root.remove()
        root = null
      }
    },

    setProgress(pct: number): void {
      progressBar!.style.width = `${pct}%`
      progressBar!.setAttribute('aria-valuenow', String(pct))
    },

    setState(state: 'booting' | 'warming' | 'ready'): void {
      labelEl!.textContent = state.toUpperCase()
      if (root) {
        root.dataset.phase = state === 'ready' ? 'enter' : 'loading'
      }
      // Portal collapse is triggered separately by triggerPortalCollapse()
      // to avoid collapsing immediately when 'ready' state is set.
    },

    triggerPortalCollapse(): void {
      if (portalContainer) {
        portalContainer.classList.add('is-collapsing')
      }
    },

    curtainSplit(_duration?: number): void {
      if (!root) return
      root.classList.add('is-splitting')
    },

    markPhase(phase: SplashPhase): void {
      if (root) {
        root.dataset.phase = phase
      }
    },

    getElements() {
      if (!root || !topPanel || !bottomPanel || !splitLine) return null
      return { root, top: topPanel, bottom: bottomPanel, line: splitLine }
    }
  }
}

export default createSplash
