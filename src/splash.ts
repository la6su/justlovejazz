// splash.ts — Cinematic curtain splash screen
export type SplashPhase = 'loading' | 'enter' | 'dissolving' | 'revealing' | 'idle'

export interface SplashOverlay {
  show(): void
  hide(durationMs?: number): void
  remove(): void
  setProgress(pct: number): void
  setState(state: 'booting' | 'warming' | 'ready'): void
  curtainSplit(duration?: number): Promise<void>
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
    shellReady = true
    return true
  }

  function buildShell() {
    root = document.createElement('div')
    root.id = id
    root.setAttribute('data-phase', 'loading')

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

    root.appendChild(topPanel)
    root.appendChild(bottomPanel)
    root.appendChild(splitLine)
    root.appendChild(brandEl)
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

    hide(durationMs: number = 0): void {
      root!.style.opacity = '0'
      if (durationMs > 0) {
        root!.style.transition = `opacity ${durationMs}ms var(--jlz-ease-exit)`
      }
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
      labelEl!.textContent = state
      if (root) {
        root.dataset.phase = state === 'ready' ? 'enter' : 'loading'
      }
    },

    curtainSplit(duration: number = 1400): Promise<void> {
      return new Promise<void>((resolve) => {
        if (!root) {
          resolve()
          return
        }
        root.classList.add('is-splitting')
        resolve(new Promise((r) => {
          setTimeout(r, duration)
        }))
      })
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
