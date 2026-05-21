// Minimal shell entry: keep first paint path tiny, then lazy-load full app.
const startApp = () => import('./entry-app').then((m) => m.startApp()).catch(() => {})

if ('requestIdleCallback' in window) {
  ;(window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
    .requestIdleCallback(() => {
      requestAnimationFrame(() => requestAnimationFrame(startApp))
    }, { timeout: 250 })
} else {
  requestAnimationFrame(() => requestAnimationFrame(startApp))
}
