/**
 * entry.ts — splash → lazy load (with progress) → ENTER → GPU dissolve → scene
 */

import { createSplash, type SplashOverlay } from './splash'

// ① Instant splash — zero deps, paints <16ms at FCP
const splash: SplashOverlay = createSplash()
splash.show()

function createProgressBar(splash: SplashOverlay) {
  let target = 0
  let current = 0
  let rafId: number | null = null

  const tick = () => {
    if (current < target) {
      current = Math.min(current + 0.8, target)
      splash.setProgress(current)
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
    }
  }

  return {
    set(pct: number): void {
      if (pct <= current) return // never go backwards
      target = Math.min(Math.max(pct, 0), 100)
      if (rafId === null) {
        rafId = requestAnimationFrame(tick)
      }
    },
  }
}

const progress = createProgressBar(splash)

// ③ Lazy-load heavy deps with visual progress
async function startApp(): Promise<void> {
  progress.set(3)

  await import('./assets/main.less')
  progress.set(25)

  const mod = await import('./main-app')
  progress.set(85)

  await mod.bootstrap({
    splash,
    onReady: (enterButton: any) => {
      progress.set(100)
      setTimeout(() => enterButton.show('ENTER SITE'), 400)
    },
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => requestAnimationFrame(startApp))
  }, { once: true })
} else {
  requestAnimationFrame(() => requestAnimationFrame(startApp))
}
