// src/core/StateBus.ts
// Unified animation state engine — replaces scattered lerp loops.
// Analogue of ORE.Animator from reference architecture.
//
// Usage:
//   const bus = StateBus.getInstance()
//   bus.channel('bloom', 0)
//   bus.channel('vignette', 0.5)
//   bus.animate('bloom', 0.8, 1.0, 'easeInOutQuad')
//   bus.tick(dt)
//   uniform.value = bus.get('bloom')

export type EasingFn = (t: number) => number
export type StateListener = (channel: string, data: unknown) => void

const EASINGS: Record<string, EasingFn> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : (4 - 2 * t) * t - 1),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - --t * t * t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - --t * t * t * t),
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - --t * t * t * t),
}

const identityEasing: EasingFn = (t) => t

export const resolveEasing = (name: string | EasingFn): EasingFn => {
  if (typeof name === 'function') return name
  return EASINGS[name] ?? identityEasing
}

export class StateBus {
  static instance: StateBus | null = null

  #channels = new Map<string, number>()
  #animations = new Map<
    string,
    {
      start: number
      target: number
      progress: number
      duration: number
      easing: EasingFn
    }
  >()
  #listeners = new Map<string, StateListener[]>()

  static getInstance(): StateBus {
    if (!StateBus.instance) {
      StateBus.instance = new StateBus()
    }
    return StateBus.instance
  }

  /** Create a new channel with initial value. Silently overwrites if exists. */
  channel(name: string, value: number = 0): StateBus {
    this.#channels.set(name, value)
    return this
  }

  /** Read current value of a channel */
  get(name: string): number {
    const v = this.#channels.get(name)
    if (v === undefined) {
      console.warn(`StateBus: channel '${name}' not found — returning 0`)
      return 0
    }
    return v
  }

  /** Set value of a channel (instant, no animation) */
  set(name: string, value: number): StateBus {
    this.#channels.set(name, value)
    return this
  }

  /** Animate channel toward target over duration with easing */
  animate(
    name: string,
    target: number,
    duration: number = 1.0,
    easing?: string | EasingFn,
  ): StateBus {
    if (!this.#channels.has(name)) {
      this.channel(name, 0)
    }
    this.#animations.set(name, {
      start: this.#channels.get(name) ?? 0,
      target,
      progress: 0,
      duration: Math.max(0.001, duration),
      easing: resolveEasing(easing ?? 'linear'),
    })
    return this
  }

  /** Cancel active animation on a channel */
  cancel(name: string): StateBus {
    this.#animations.delete(name)
    return this
  }

  /** Cancel all active animations */
  cancelAll(): StateBus {
    this.#animations.clear()
    return this
  }

  /** Subscribe to events on a channel pattern */
  on(channelName: string, listener: StateListener): StateBus {
    const list = this.#listeners.get(channelName) ?? []
    list.push(listener)
    this.#listeners.set(channelName, list)
    return this
  }

  /** Unsubscribe */
  off(channelName: string, listener?: StateListener): StateBus {
    if (listener) {
      const list = this.#listeners.get(channelName)
      if (list) {
        const idx = list.indexOf(listener)
        if (idx >= 0) list.splice(idx, 1)
      }
    } else {
      this.#listeners.delete(channelName)
    }
    return this
  }

  /** Emit an event to all listeners (supports '*' wildcard) */
  emit(channelName: string, data: unknown = undefined): StateBus {
    const list = this.#listeners.get(channelName)
    if (list) {
      list.forEach((l) => l(channelName, data))
    }
    const wildcard = this.#listeners.get('*')
    if (wildcard) {
      wildcard.forEach((l) => l(channelName, data))
    }
    return this
  }

  /** Emit event (private — animation tick only) */
  #notify(channelName: string, data: unknown): void {
    this.emit(channelName, data)
  }

  /** Core tick — advances all animations */
  tick(dt: number): StateBus {
    if (dt <= 0) return this
    const changed: string[] = []

    for (const [name, anim] of this.#animations) {
      anim.progress += dt
      const rawT = Math.min(anim.progress / anim.duration, 1)
      const eased = anim.easing(rawT)
      const newValue = anim.start + (anim.target - anim.start) * eased
      const prev = this.#channels.get(name) ?? newValue
      this.#channels.set(name, newValue)

      if (Math.abs(newValue - prev) > 1e-6) {
        changed.push(name)
      }

      if (rawT >= 1) {
        this.#channels.set(name, anim.target)
        this.#animations.delete(name)
        this.#notify(`done:${name}`, name)
      }
    }

    if (changed.length > 0) {
      this.#notify('change', changed)
    }

    return this
  }

  activeAnimations(): string[] {
    return Array.from(this.#animations.keys())
  }

  isAnimating(name: string): boolean {
    return this.#animations.has(name)
  }

  get hasAnimations(): boolean {
    return this.#animations.size > 0
  }

  snapshot(): Record<string, number> {
    const snap: Record<string, number> = {}
    for (const [name, val] of this.#channels) {
      snap[name] = val
    }
    return snap
  }

  reset(): StateBus {
    for (const [name] of this.#channels) {
      this.#channels.set(name, 0)
    }
    this.#animations.clear()
    this.#listeners.clear()
    return this
  }
}
