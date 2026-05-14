/**
 * Phase F — minimal first JS: defer full Less bundle + app to next frame
 * so the browser can paint skeleton HTML + critical inline CSS first.
 */
import { syncReducedMotionDataset } from './core/motionPolicy'

syncReducedMotionDataset()

// Suppress Three.js UV warnings for particle/line geometry
const origWarn = console.warn.bind(console.warn)
console.warn = (...args: Parameters<typeof console.warn>) => {
  const msg = args[0]
  if (msg && String(msg).includes('Vertex attribute "uv" not found')) return
  origWarn(...args)
}

function startApp(): void {
  void Promise.all([import('./assets/main.less'), import('./main-app')]).then(([, mod]) => {
    void mod.bootstrap()
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(startApp), { once: true })
} else {
  requestAnimationFrame(startApp)
}
