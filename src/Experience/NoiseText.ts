// NoiseText — console-style glitch reveal (junni reference).
//
// Effect: typewriter with random noise symbols trailing the revealed text.
// Characters appear left-to-right; 1-3 random noise chars follow the cursor
// position, flickering as the reveal progresses. Pure textContent (no spans)
// = no layout shift, cheap to animate, perfect for console/TUI eyebrows.
//
// Reference: references/next.junni.co.jp/src/ts/MainScene/NoiseText/index.ts
// Adapted: WeakMap singleton (for(el) API), rAF instead of setInterval,
// configurable noise charset (default: box-drawing + symbols for TUI feel).

const DEFAULT_NOISE = '░▒▓█▄▀▌▐│║╟╠╫╬●○◆◇▪▫•·∴∵≈≠≤≥±÷×'

export class NoiseText {
  private static instances = new WeakMap<HTMLElement, NoiseText>()

  private readonly el: HTMLElement
  private text = ''
  private noise = DEFAULT_NOISE
  private rafId: number | null = null
  private start = 0
  private dur = 600
  private running = false

  private constructor(el: HTMLElement) {
    this.el = el
  }

  static for(el: HTMLElement): NoiseText {
    let inst = this.instances.get(el)
    if (!inst) {
      inst = new NoiseText(el)
      this.instances.set(el, inst)
    }
    return inst
  }

  /** Reveal the text with a trailing-noise typewriter effect.
   *  dur: seconds. sourceText: text to reveal (defaults to el.textContent).
   *  noise: optional charset for the trailing random symbols. */
  show(dur: number = 0.6, sourceText?: string, noise?: string): void {
    this.cancel()
    this.text = sourceText ?? (this.el.textContent || '')
    if (this.text.length === 0) return
    if (noise) this.noise = noise

    this.dur = dur * 1000
    this.running = true
    this.start = performance.now()
    this.el.setAttribute('data-visible', 'true')
    this.el.textContent = ''
    this.rafId = requestAnimationFrame(this.tick)
  }

  hide(): void {
    this.cancel()
    this.el.removeAttribute('data-visible')
  }

  private tick = (ts: number): void => {
    if (!this.running) return
    const t = (ts - this.start) / this.dur
    if (t >= 1) {
      this.el.textContent = this.text
      this.running = false
      this.rafId = null
      return
    }

    // Progress 0→1 → fixed chars 0→text.length
    const fixedLength = Math.floor(t * this.text.length)
    // Trailing noise: 1-3 random chars after the cursor
    const noiseLength = Math.min(3, this.text.length - fixedLength)

    let out = ''
    for (let i = 0; i < fixedLength; i++) {
      out += this.text[i] ?? ''
    }
    for (let i = 0; i < noiseLength; i++) {
      out += this.noise[Math.floor(Math.random() * this.noise.length)] ?? ''
    }
    this.el.textContent = out

    this.rafId = requestAnimationFrame(this.tick)
  }

  private cancel(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.text) {
      this.el.textContent = this.text
    }
  }
}
