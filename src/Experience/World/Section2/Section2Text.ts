// Section2Text — DOM overlay text for the FLEXIBLE scene (Section2, step07).
//
// Uses a pure DOM overlay approach (no CSS3DRenderer). Text elements are
// absolutely-positioned over the WebGL canvas and driven via requestAnimationFrame.
// Follows the same pattern as NoiseText / intro sequence.
//
// Only imports: standard DOM APIs.

/** Animation phase for lifecycle tracking */
export enum Phase {
  INIT = 'init',
  IN = 'in',
  IDLE = 'idle',
  OUT = 'out',
  DONE = 'done',
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface TextItem {
  el: HTMLElement
  delay: number
  initialScale: number
  targetScale: number
  wobbleAmp: number
  wobbleFreq: number
}

export class Section2Text {
  private container: HTMLElement

  get containerEl(): HTMLElement {
    return this.container
  }

  private items: TextItem[] = []
  private phase: Phase = Phase.INIT

  private rafId: number | null = null
  private animStart = 0
  private animDuration = 0

  constructor() {
    this.container = document.createElement('div')
    this.container.className = 'section2-text-overlay'
    this.container.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
      opacity: 0;
    `

    // Hero text — "FLEXIBLE"
    const heroEl = document.createElement('h1')
    heroEl.className = 'section2-hero-text'
    heroEl.textContent = 'FLEXIBLE'
    heroEl.style.cssText = `
      font-size: clamp(3rem, 8vw, 7rem);
      font-weight: 800;
      letter-spacing: 0.12em;
      line-height: 1;
      color: #111;
      margin: 0;
      transform: translateY(24px) scale(1.15);
      opacity: 0;
      text-transform: uppercase;
    `
    this.container.appendChild(heroEl)

    // Secondary text — "Always"
    const subEl = document.createElement('h2')
    subEl.className = 'section2-sub-text'
    subEl.textContent = 'Always'
    subEl.style.cssText = `
      font-size: clamp(1rem, 2.5vw, 2rem);
      font-weight: 300;
      letter-spacing: 0.25em;
      line-height: 1;
      color: #555;
      margin: 1.2rem 0 0;
      transform: translateY(18px) scale(1.1);
      opacity: 0;
      text-transform: uppercase;
    `
    this.container.appendChild(subEl)

    this.items = [
      {
        el: heroEl,
        delay: 0,
        initialScale: 1.15,
        targetScale: 1,
        wobbleAmp: 0.6,
        wobbleFreq: 1.8,
      },
      {
        el: subEl,
        delay: 0.35,
        initialScale: 1.1,
        targetScale: 1,
        wobbleAmp: 0.3,
        wobbleFreq: 2.5,
      },
    ]
  }

  mountTo(parent: HTMLElement): void {
    if (!parent.contains(this.container)) {
      parent.appendChild(this.container)
    }
  }

  animateIn(duration: number = 1.4): void {
    this.cancelAnim()
    this.phase = Phase.IN

    this.container.style.opacity = '1'

    for (const item of this.items) {
      item.el.style.opacity = '0'
      item.el.style.transform = `translateY(24px) scale(${item.initialScale})`
    }

    this.animDuration = duration * 1000
    this.animStart = performance.now()
    this.rafId = requestAnimationFrame(this.tickIn)
  }

  animateOut(duration: number = 0.8): void {
    this.cancelAnim()
    this.phase = Phase.OUT

    this.animDuration = duration * 1000
    this.animStart = performance.now()
    this.rafId = requestAnimationFrame(this.tickOut)
  }

  update(time: number): void {
    if (this.phase !== Phase.IDLE) return

    for (const item of this.items) {
      const dx = Math.sin(time * item.wobbleFreq + item.delay * 10) * item.wobbleAmp
      const dy = Math.cos(time * item.wobbleFreq * 0.7 + item.delay * 8) * item.wobbleAmp * 0.5
      item.el.style.transform = `translate(${dx}px, ${dy}px) scale(1)`
    }
  }

  getState(): Phase {
    return this.phase
  }

  dispose(): void {
    this.cancelAnim()
    this.phase = Phase.DONE
    this.container.style.opacity = '0'
    for (const item of this.items) {
      item.el.style.opacity = '0'
    }
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container)
    }
    this.items = []
  }

  private cancelAnim(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private tickIn = (ts: number): void => {
    if (this.phase !== Phase.IN) return

    const elapsed = ts - this.animStart
    const t = Math.min(1, elapsed / this.animDuration)

    let allDone = true
    for (const item of this.items) {
      const effectiveT = Math.max(0, (t - item.delay) / (1 - item.delay))
      const progress = easeOutExpo(Math.min(1, effectiveT))

      if (effectiveT < 1) allDone = false

      const opacity = progress
      const yOffset = (1 - progress) * 24
      const scale = item.initialScale + (item.targetScale - item.initialScale) * progress

      item.el.style.opacity = String(opacity)
      item.el.style.transform = `translateY(${yOffset}px) scale(${scale})`
    }

    if (allDone) {
      this.phase = Phase.IDLE
      this.container.style.opacity = '1'
      return
    }

    this.rafId = requestAnimationFrame(this.tickIn)
  }

  private tickOut = (ts: number): void => {
    if (this.phase !== Phase.OUT) return

    const elapsed = ts - this.animStart
    const t = Math.min(1, elapsed / this.animDuration)
    const progress = easeInOutCubic(t)

    this.container.style.opacity = String(1 - progress)

    for (const item of this.items) {
      const staggeredT = Math.max(0, Math.min(1, (t - item.delay) / (1 - item.delay)))
      const itemProgress = easeInOutCubic(staggeredT)
      const drift = itemProgress * 15
      const scale = 1 + itemProgress * 0.05

      item.el.style.opacity = String(1 - itemProgress)
      item.el.style.transform = `translateY(${-drift}px) scale(${scale})`
    }

    if (t >= 1) {
      this.phase = Phase.INIT
      this.container.style.opacity = '0'
      this.rafId = null
      return
    }

    this.rafId = requestAnimationFrame(this.tickOut)
  }
}

export default Section2Text
