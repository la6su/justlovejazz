/**
 * entry.ts — Phase I-5: lazy loading entry
 *
 * Split strategy:
 *  1. FCP: instant splash (zero deps) — paints in <16ms
 *  2. Background: preload Less + heavy app chunk (three, world, shaders)
 *  3. After both: hide splash, start 3D scene
 *
 * Critical: splash.ts has NO Three.js imports. It renders synchronously
 * before the browser even fetches the main chunk.
 */
import { createSplash } from './splash'
import { syncReducedMotionDataset } from './core/motionPolicy'

// ① Critical path: syncReducedMotion + splash (no network requests)
syncReducedMotionDataset()

// Suppress Three.js UV warnings for particle/line geometry
const origWarn = console.warn.bind(console.warn)
console.warn = (...args: Parameters<typeof console.warn>) => {
  const msg = args[0]
  if (msg && String(msg).includes('Vertex attribute "uv" not found')) return
  origWarn(...args)
}

// ② Show splash IMMEDIATELY — this paints on first frame (<16ms)
const splash = createSplash()
splash.show()

// Store splash ref for IntroSequence to access
let _removeSplash: (() => void) | null = null

// ③ Lazy-load heavy chunks in background (async, non-blocking)
function startApp(): void {
  void Promise.all([
    import('./assets/main.less'),   // CSS
    import('./main-app'),            // three + world + shaders (~700KB)
  ]).then(([, mod]) => {
    // Heavy chunk is ready — coordinate intro fade with splash
    splash.hide(300)
    _removeSplash = () => splash.remove()
    void mod.bootstrap({ onIntroComplete: () => setTimeout(() => _removeSplash?.(), 500) })
  }).catch((err) => {
    // If boot fails, keep splash visible + log
    if (import.meta.env.DEV) {
      console.error('Failed to initialize application:', err)
    }
  })
}

// Wait for DOM + first paint, then start lazy loading
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Yield one frame so splash paints first
    requestAnimationFrame(() => requestAnimationFrame(startApp))
  }, { once: true })
} else {
  requestAnimationFrame(() => requestAnimationFrame(startApp))
}
