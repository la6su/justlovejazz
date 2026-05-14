import { UIManager } from './UI/UIManager'
import { Bootstrapper } from './core/Bootstrapper'
import { ErrorTracker } from './core/ErrorTracker'

export async function bootstrap(): Promise<void> {
  const mode = document.body.dataset.appMode ?? 'full'
  if (mode !== 'full') return

  ErrorTracker.init()
  try {
    const ui = new UIManager()
    await ui.init()
    await Bootstrapper.init(ui)
    initScrollHint()
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

// Hide "scroll to explore" hint after first scroll
function initScrollHint(): void {
  const hint = document.getElementById('scrollHint') as HTMLElement | null;
  if (!hint) return;
  const hideHint = () => {
    hint.classList.add('fade-out');
    setTimeout(() => hint.remove(), 700);
    window.removeEventListener('scroll', hideHint);
  };
  window.addEventListener('scroll', hideHint, { passive: true, once: true });
}
