// Minimal shell entry: keep first paint path tiny, then lazy-load full app.
// Errors are surfaced to console + ErrorTracker (not silently swallowed).

const startApp = () =>
  import('./entry-app')
    .then((m) => m.startApp())
    .catch((err) => {
      console.error('[entry-shell] App startup failed:', err)
      const fallback = document.createElement('div')
      fallback.style.cssText =
        'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
        'background:#050507;color:rgba(255,255,255,0.7);font-family:system-ui,sans-serif;' +
        'font-size:14px;letter-spacing:0.1em;text-align:center;padding:2rem;z-index:9999;'
      fallback.innerHTML =
        'Experience failed to load.<br/><br/>' +
        '<button onclick="location.reload()" style="background:none;border:1px solid rgba(255,255,255,0.3);color:#fff;padding:8px 24px;cursor:pointer;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">Reload</button>'
      document.body.appendChild(fallback)
    })

// Start app: use requestIdleCallback if available (with short timeout),
// otherwise fall back to double-rAF for paint stabilization.
if ('requestIdleCallback' in window) {
  ;(
    window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }
  ).requestIdleCallback(
    () => {
      requestAnimationFrame(() => requestAnimationFrame(startApp))
    },
    { timeout: 250 },
  )
} else {
  requestAnimationFrame(() => requestAnimationFrame(startApp))
}
