// NoiseText — junni-style typewriter reveal with noise tail.
//
// Proven stable pattern: combines 64002f9 (typewriter algorithm) +
// 39eda64 stability fixes (Frame 0 = clean text, cancel restores cleanText).
//
// Critical guarantees (from 39eda64):
// 1. Frame 0 = correct text → no flash of empty/noisy state.
// 2. Final frame = ALWAYS clean text (finalize restores cleanText).
// 3. cancel() restores cleanText BEFORE new show() reads DOM → no stale
//    noise captured as cleanText on rapid re-trigger (IntersectionObserver).
// 4. Safety timeout guarantees finalize() fires even if RAF is throttled.
//
// Algorithm (from 64002f9): typewriter with noise tail
// - Characters appear left-to-right (already-revealed = clean)
// - 1-3 random noise chars flicker ahead of the reveal position
// - At t=1.0: full clean text displayed

const CHARS = '░▒▓█▄▀▌▐│║╟╠╫╬●○◆◇▪▫•·∴∵≈≠≤≥±÷×'

export class NoiseText {
  /** Global registry: one instance per DOM element, prevents overlap. */
  private static instances = new WeakMap<HTMLElement, NoiseText>()
  /** Active animation owners, kept enumerable for runtime teardown. */
  private static active = new Set<NoiseText>()

  private readonly el: HTMLElement
  private cleanText = ''

  private rafId: number | null = null
  private timeoutId: number | null = null
  private running = false
  private start = 0
  private dur = 1000
  /** Reused frame buffer; only the joined DOM string is transient. */
  private readonly chars: string[] = []

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

  /**
   * Start noise animation for `dur` seconds.
   * Junni pattern: typewriter reveal with noise tail.
   *
   * @param dur Duration in seconds.
   * @param sourceText Explicit clean text. If not provided, reads from DOM.
   */
  show(dur: number = 0.6, sourceText?: string): void {
    // D-9 fix (same as BlurFade D-3): read sourceText BEFORE cancel().
    // cancel() restores the PREVIOUS cleanText to the DOM — if translations
    // were applied between shows, the old-language text would be read back.
    const text = sourceText ?? (this.el.textContent || '')
    // cancel() restores cleanText to DOM FIRST — so if caller reads
    // el.textContent below, it gets clean text, not a noisy frame.
    this.cancel()

    this.cleanText = text
    if (this.cleanText.length === 0) return

    // Frame 0 = correct text → no flash of empty state.
    // (Critical fix from 39eda64 — starting with '' causes a visible
    // empty flash before the first tick.)
    this.el.textContent = this.cleanText

    this.dur = dur * 1000
    this.running = true
    NoiseText.active.add(this)
    this.start = performance.now()
    this.el.setAttribute('data-visible', 'true')

    // Safety timeout → guarantees finalize() fires even if RAF is throttled
    // (background tab, heavy GPU, IntersectionObserver during scroll).
    this.timeoutId = window.setTimeout(() => this.finalize(), this.dur + 200)
    this.rafId = requestAnimationFrame(this.tick)
  }

  hide(): void {
    this.finalize()
    this.el.removeAttribute('data-visible')
  }

  private tick = (ts: number): void => {
    if (!this.running) return
    if (!this.el.isConnected) {
      this.finalize()
      return
    }

    const t = Math.min(1, (ts - this.start) / this.dur)

    if (t >= 1) {
      this.finalize()
      return
    }

    // Progressive reveal: fixedLength grows from 0 to text.length
    const fixedLength = Math.floor(t * this.cleanText.length)
    // Noise tail: 1-3 random characters after the fixed portion
    const noiseLength = Math.min(3, this.cleanText.length - fixedLength)

    // PERF-15 fix: build via array + join (was `text +=` in a loop = O(N²)
    // string allocation). For a 20-char title: ~23 string allocs/frame → 1.
    const chars = this.chars
    chars.length = fixedLength + noiseLength

    // Fixed (clean) characters — already revealed
    for (let i = 0; i < fixedLength; i++) {
      chars[i] = this.cleanText[i]!
    }

    // Noise tail — random characters that flicker
    for (let i = 0; i < noiseLength; i++) {
      chars[fixedLength + i] = CHARS[Math.floor(Math.random() * CHARS.length)]!
    }

    this.el.textContent = chars.join('')
    this.rafId = requestAnimationFrame(this.tick)
  }

  /** Hard stop with clean text restoration (called on animation end). */
  finalize(): void {
    this.running = false
    NoiseText.active.delete(this)
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    // Final frame = ALWAYS clean text (no glitch residue)
    if (this.cleanText) this.el.textContent = this.cleanText
  }

  /** Lightweight cancel — restores clean text and cancels RAF+timeout.
   *  MUST restore cleanText before new show() reads DOM (prevents stale
   *  noise being captured as cleanText on rapid re-trigger). */
  private cancel(): void {
    this.running = false
    NoiseText.active.delete(this)
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    // Always restore clean text on cancel so a new show() reading from
    // DOM picks up the correct text, not a noisy frame from the previous run.
    if (this.cleanText) {
      this.el.textContent = this.cleanText
    }
  }

  /** Stop every active text animation owned by the current Experience. */
  static disposeAll(): void {
    for (const instance of NoiseText.active) instance.finalize()
  }
}
