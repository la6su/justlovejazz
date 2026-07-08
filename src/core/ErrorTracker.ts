// src/core/ErrorTracker.ts — Zero-dependency error tracking
// Sends errors via navigator.sendBeacon (fire-and-forget, no 404 spam).
// If no error endpoint is configured, falls back to console.error.
const sent = new Set<string>()

// Configurable error endpoint. Set via window.__ERROR_ENDPOINT__ or leave
// empty to use console-only logging (default — no /api/errors 404 spam).
const ERROR_ENDPOINT = (typeof window !== 'undefined' && (window as unknown as { __ERROR_ENDPOINT__?: string }).__ERROR_ENDPOINT__) || ''

interface ErrorReport {
  message: string
  url: string
  timestamp: string
  user_agent: string
  version: string
  context?: Record<string, unknown>
}

// Build version — replaced at build time via Vite define, or 'dev'
const VERSION = (typeof globalThis !== 'undefined' && (globalThis as unknown as { __BUILD_VERSION__?: string }).__BUILD_VERSION__) || 'dev'

export const ErrorTracker = {
  report: (error: Error | string, context?: Record<string, unknown>) => {
    const report: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      url: typeof location !== 'undefined' ? location.href : '',
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      version: VERSION,
      context,
    }

    const key = report.message.slice(0, 100)
    if (sent.has(key)) return
    sent.add(key)

    // Always log to console (DEV + PROD)
    console.error('[ErrorTracker]', report.message, context ?? '')

    // In PROD with a configured endpoint: send via sendBeacon (no 404 if
    // endpoint doesn't exist — sendBeacon silently fails, unlike fetch).
    if (import.meta.env.PROD && ERROR_ENDPOINT) {
      try {
        navigator.sendBeacon(ERROR_ENDPOINT, JSON.stringify(report))
      } catch {
        // sendBeacon not available — silently skip (already logged to console)
      }
    }
  },

  init: () => {
    window.addEventListener('unhandledrejection', (e) => {
      e.preventDefault()
      ErrorTracker.report(e.reason as Error, { source: 'unhandledrejection' })
    })

    window.addEventListener('error', (e) => {
      // Suppress benign ResizeObserver loop error — this is a browser
      // limitation, not a real bug. The observation completes next frame.
      const msg = e.error?.message ?? e.message ?? 'Unknown error'
      if (msg.includes('ResizeObserver loop')) return
      ErrorTracker.report(new Error(msg), {
        source: 'window.error',
        filename: e.filename ?? '',
        lineno: e.lineno ?? 0,
        colno: e.colno ?? 0,
      })
    })
  },
}
