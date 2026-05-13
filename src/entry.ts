/**
 * Phase F — minimal first JS: defer full Less bundle + app to next frame
 * so the browser can paint skeleton HTML + critical inline CSS first.
 */
import { syncReducedMotionDataset } from './core/motionPolicy'

syncReducedMotionDataset()

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
