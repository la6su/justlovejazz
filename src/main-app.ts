import { UIManager } from './UI/UIManager'
import { Bootstrapper } from './core/Bootstrapper'
import { ErrorTracker } from './core/ErrorTracker'

export async function bootstrap(): Promise<void> {
  ErrorTracker.init()
  try {
    const ui = new UIManager()
    await ui.init()
    await Bootstrapper.init(ui)
    registerServiceWorker()
    if (import.meta.env.DEV) {
      console.info('Application successfully bootstrapped')
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('Failed to initialize application:', err)
    }
  }
}

/** Phase F.4 — cache static assets in production (CDN-friendly same-origin). */
function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const base = import.meta.env.BASE_URL || '/'
  const path = `${base.endsWith('/') ? base : base + '/'}sw.js`
  void navigator.serviceWorker.register(path).catch(() => {
    /* non-fatal */
  })
}
