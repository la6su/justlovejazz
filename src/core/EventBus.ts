// Typed event bus — replaces untyped window.dispatchEvent(CustomEvent) calls.
// Compile-time safety on event payloads; no DOM dependency; `on()` returns
// an unsubscribe function for cleaner lifecycle management.

export interface AppEvents {
  /** Fired by main-app.ts at curtain mid-open — triggers NoiseText title animation. */
  'jlz:webgl-ready': void
  /** Fired by main-app.ts if Experience.init() throws — shows load error, NOT Enter. */
  'jlz:webgl-failed': void
  /** Fired by Experience.update() on section index change — drives ContentReveal + NoiseText. */
  'jlz:section-change': {
    sectionId: string
    context?: string
    configId?: string
    index: number
  }
  /** Fired by router.ts on page navigation — triggers UIMenu page active + slider labels. */
  'jlz:route-change': { page?: string }
}

type Handler<K extends keyof AppEvents> = (payload: AppEvents[K]) => void

class EventBus {
  // Stored as Set<Function> internally — type safety is enforced at the
  // on()/emit() call boundaries via generic signatures. (TypeScript mapped
  // type variance prevents a directly-typed { [K]: Set<Handler<K>> } storage.)
  private listeners = new Map<keyof AppEvents, Set<(payload: unknown) => void>>()

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof AppEvents>(event: K, cb: Handler<K>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(cb as (payload: unknown) => void)
    return () => this.off(event, cb)
  }

  /** Unsubscribe from an event. */
  off<K extends keyof AppEvents>(event: K, cb: Handler<K>): void {
    this.listeners.get(event)?.delete(cb as (payload: unknown) => void)
  }

  /** Emit an event to all subscribers.
   *  Also bridges to window.dispatchEvent so legacy/raw window.addEventListener
   *  consumers (UIMenu, ContentReveal, entry-app) receive typed events without
   *  each call site needing to dispatch raw. This fixes the contract gap where
   *  jlz:section-change was emitted via eventBus.emit() but UIMenu listened on
   *  window — the hamburger↔X sync was dead on home routes. */
  emit<K extends keyof AppEvents>(
    event: K,
    ...args: AppEvents[K] extends void ? [] : [AppEvents[K]]
  ): void {
    const set = this.listeners.get(event)
    if (set) {
      for (const cb of set) cb(args[0])
    }
    // Bridge to window for raw listeners. Guard for SSR/jsdom without window.
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const payload = args[0]
      window.dispatchEvent(new CustomEvent(event, payload === undefined ? undefined : { detail: payload }))
    }
  }

  /** Remove all listeners (for HMR / teardown). */
  clear(): void {
    this.listeners.clear()
  }
}

/** Singleton instance — import this, not the class. */
export const eventBus = new EventBus()

// HMR disabled — import.meta.hot triggers Vite to inject @vite/client
// which breaks module loading through the reverse proxy.
