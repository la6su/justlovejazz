// Minimal shell entry: keep first paint path tiny, then lazy-load full app.
// Errors are surfaced to console + ErrorTracker (not silently swallowed).

// ── Kill Vite dev client completely — prevents ~30s reload loop through proxy ──
// Vite injects @vite/client in dev mode. Through the Caddy reverse proxy,
// the WebSocket/polling connection is unstable → Vite client calls
// location.reload() every ~30s. We need to completely neutralize the Vite
// client: block WebSocket, override location.reload, and strip the Vite
// client script tag.
const _OrigWebSocket = window.WebSocket
window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
  const isViteHmr = protocols === 'vite-hmr'
    || (Array.isArray(protocols) && protocols.includes('vite-hmr'))
  if (isViteHmr) {
    return {
      readyState: 3, // CLOSED — tell Vite the connection failed immediately
      url: String(url),
      protocol: '',
      extensions: '',
      bufferedAmount: 0,
      binaryType: 'blob' as BinaryType,
      close() {},
      send() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return false },
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    } as unknown as WebSocket
  }
  return new _OrigWebSocket(url, protocols)
} as unknown as typeof WebSocket
window.WebSocket.prototype = _OrigWebSocket.prototype
;(window.WebSocket as any).CONNECTING = _OrigWebSocket.CONNECTING
;(window.WebSocket as any).OPEN = _OrigWebSocket.OPEN
;(window.WebSocket as any).CLOSING = _OrigWebSocket.CLOSING
;(window.WebSocket as any).CLOSED = _OrigWebSocket.CLOSED

// Override location.reload — Vite client calls this when it detects
// "server connection lost". We block ALL reloads triggered by Vite.
// (User-initiated reloads via F5/Ctrl+R bypass this — they're not
// programmatic location.reload() calls.)
const _origReload = window.location.reload.bind(window.location)
let _viteReloadBlocked = false
window.location.reload = function () {
  // Check call stack — if Vite client is in the stack, block the reload
  const stack = new Error().stack || ''
  if (stack.includes('client.mjs') || stack.includes('vite') || _viteReloadBlocked) {
    if (!_viteReloadBlocked) {
      _viteReloadBlocked = true
      console.warn('[entry-shell] Blocked Vite location.reload() — would cause reload loop')
    }
    return
  }
  _origReload()
} as typeof window.location.reload

// ── Console capture — survives page reload via sessionStorage ──
// Intercepts ALL console.log/warn/error and stores them in sessionStorage
// so we can read them AFTER the reload (the ~30s reload wipes the console).
const CONSOLE_KEY = 'jlz_console_log'
const MAX_ENTRIES = 200

function loadLog(): string[] {
  try { return JSON.parse(sessionStorage.getItem(CONSOLE_KEY) || '[]') } catch { return [] }
}
function saveLog(entries: string[]) {
  try { sessionStorage.setItem(CONSOLE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))) } catch { /* ignore */ }
}

const consoleEntries = loadLog()
const origLog = console.log
const origWarn = console.warn
const origError = console.error

function ts(): string {
  return new Date().toISOString().slice(11, 23) // HH:mm:ss.SSS
}

console.log = (...args: unknown[]) => {
  const entry = `${ts()} LOG: ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`
  consoleEntries.push(entry); saveLog(consoleEntries)
  origLog(...args)
}
console.warn = (...args: unknown[]) => {
  const entry = `${ts()} WARN: ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`
  consoleEntries.push(entry); saveLog(consoleEntries)
  origWarn(...args)
}
console.error = (...args: unknown[]) => {
  const entry = `${ts()} ERROR: ${args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')}`
  consoleEntries.push(entry); saveLog(consoleEntries)
  origError(...args)
}

// On startup: dump the previous session's log (from before the reload)
const prevLog = loadLog()
if (prevLog.length > 0) {
  origWarn('[entry-shell] === PREVIOUS SESSION CONSOLE LOG (before reload) ===')
  for (const entry of prevLog) {
    origWarn(entry)
  }
  origWarn('[entry-shell] === END PREVIOUS SESSION LOG ===')
  // Clear after dumping so we don't re-dump on next reload
  saveLog([])
}

// Capture reload cause
window.addEventListener('beforeunload', () => {
  const exp = (window as any).experience
  const r = exp?.renderer?.instance
  const entry = `${ts()} RELOAD: beforeunload | deviceLost=${r?._isDeviceLost} | backend=${r?.backend?.constructor?.name} | heap=${(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize/1048576)+'MB' : '?'}`
  consoleEntries.push(entry); saveLog(consoleEntries)
})

window.addEventListener('pagehide', (e: PageTransitionEvent) => {
  const entry = `${ts()} PAGEHIDE: persisted=${e.persisted}`
  consoleEntries.push(entry); saveLog(consoleEntries)
})

// Capture unhandled errors + rejections
window.addEventListener('error', (e: ErrorEvent) => {
  const entry = `${ts()} UNHANDLED ERROR: ${e.message} | ${e.filename}:${e.lineno} | ${e.error?.stack || ''}`
  consoleEntries.push(entry); saveLog(consoleEntries)
})
window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  const entry = `${ts()} UNHANDLED REJECTION: ${e.reason?.message || e.reason}`
  consoleEntries.push(entry); saveLog(consoleEntries)
})

const startApp = () =>
  import('./entry-app')
    .then((m) => m.startApp())
    .catch((err) => {
      // Don't swallow — surface to console for debugging.
      console.error('[entry-shell] App startup failed:', err)
      // Show a fallback message so user doesn't see blank screen.
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
