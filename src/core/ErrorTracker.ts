// src/core/ErrorTracker.ts — Zero-dependency error tracking
const sent = new Set<string>()

// EXported error tracker
interface ErrorReport {
  message: string
  url: string
  timestamp: string
  user_agent: string
  version: string
}

export const ErrorTracker = {
  report: (error: Error | string, context?: Record<string, unknown>) => {
    const report: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      url: location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      version: 'dev',
    }

    const key = report.message.slice(0, 100)
    if (sent.has(key)) return

    sent.add(key)
    if (import.meta.env.PROD) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, context }),
        keepalive: true,
      }).catch(() => {})
    }
  },

  init: () => {
    window.addEventListener('unhandledrejection', (e) => {
      e.preventDefault()
      ErrorTracker.report(e.reason as Error, { source: 'unhandledrejection' })
    })

    window.addEventListener('error', (e) => {
      const msg = e.error?.message ?? e.message ?? 'Unknown error'
      ErrorTracker.report(new Error(msg), {
        source: 'window.error',
        filename: e.filename ?? '',
        lineno: e.lineno ?? 0,
        colno: e.colno ?? 0,
      })
    })
  },
}
