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
  /** The clean target text to reveal + restore after animation. */
  private text = ''
  /** Snapshot of el.textContent BEFORE any animation — safety fallback
   *  to guarantee we can always restore the original. Re-snapshotted on
   *  every show() call (in case el was mutated externally between runs). */
  private originalText = ''
  private noise = DEFAULT_NOISE
  private rafId: number | null = null
  private start = 0
  private dur = 600
  private running = false

  private constructor(el: HTMLElement) {
    this.el = el
    this.originalText = el.textContent || ''
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
   *  dur: seconds. sourceText: text to reveal (defaults to el.textContent
   *  or originalText fallback). noise: optional charset for trailing symbols. */
  show(dur: number = 0.6, sourceText?: string, noise?: string): void {
    // Snapshot current text BEFORE clearing (in case el has the clean text
    // from a previous completed animation or external mutation).
    const currentText = this.el.textContent || ''
    this.stopAnimation()
    if (noise) this.noise = noise

    // Resolve target text: explicit sourceText > current el text (if non-empty
    // and not mid-animation noise) > original snapshot
    let resolved = sourceText
    if (!resolved) {
      // If current text looks like clean text (not noise), use it
      resolved = currentText.length > 0 ? currentText : this.originalText
    }
    if (!resolved || resolved.length === 0) return

    this.text = resolved
    this.originalText = this.originalText || resolved

    this.dur = Math.max(100, dur * 1000)
    this.running = true
    this.start = performance.now()
    this.el.setAttribute('data-visible', 'true')
    this.el.textContent = ''
    this.rafId = requestAnimationFrame(this.tick)
  }

  /** Stop animation and restore the clean text immediately. */
  hide(): void {
    this.stopAnimation()
    this.el.removeAttribute('data-visible')
  }

  private tick = (ts: number): void => {
    if (!this.running) return
    const elapsed = ts - this.start
    const t = elapsed / this.dur
    if (t >= 1) {
      // Animation complete — finalize with clean text
      this.finalize()
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

  /** Finalize animation — restore the clean target text. Called when
   *  animation completes naturally (t >= 1). Guarantees el shows the
   *  final clean text, never stuck on noise symbols. */
  private finalize(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.el.textContent = this.text
  }

  /** Stop the rAF loop and restore the target text (cancel mid-animation). */
  private stopAnimation(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    // Restore clean text so el never gets stuck showing noise symbols
    if (this.text) {
      this.el.textContent = this.text
    }
  }
}
