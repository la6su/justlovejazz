// BlurFade — cinematic blur+stagger reveal for section titles.
//
// Effect: characters appear with random X/Y offset + blur, then settle
// into their final position with a stagger. More cinematic than typewriter.
//
// Each character: starts offset (translateY + rotate) + blurred, animates
// to clean position. Staggered timing = wave-like reveal.
//
// Used by: entry-app.ts (scrollSpy on .studio-title), ProjectOverlay title.
// For console-style typewriter (eyebrow numbers), see NoiseText.ts.

export class BlurFade {
  private static instances = new WeakMap<HTMLElement, BlurFade>()
  /** Active animation owners, kept enumerable for runtime teardown. */
  private static active = new Set<BlurFade>()

  private readonly el: HTMLElement
  private cleanText = ''
  private rafId: number | null = null
  private timeoutId: number | null = null
  private running = false
  private start = 0
  private dur = 1000

  private constructor(el: HTMLElement) {
    this.el = el
  }

  static for(el: HTMLElement): BlurFade {
    let inst = this.instances.get(el)
    if (!inst) {
      inst = new BlurFade(el)
      this.instances.set(el, inst)
    }
    return inst
  }

  show(dur: number = 0.6, sourceText?: string): void {
    // D-3 fix: read sourceText BEFORE cancel(). cancel() restores the PREVIOUS
    // cleanText into textContent — if translations were applied between shows,
    // the old-language text would be read back as the new source. Reading first
    // captures the current (possibly just-translated) textContent correctly.
    const text = sourceText ?? (this.el.textContent || '')
    this.cancel()
    this.cleanText = text
    if (this.cleanText.length === 0) return

    this.dur = dur * 1000
    this.running = true
    BlurFade.active.add(this)
    this.start = performance.now()
    this.el.setAttribute('data-visible', 'true')
    this.el.setAttribute('aria-label', this.cleanText)

    // Build spans through DOM APIs. Titles can come from translated/editorial
    // content, so interpolating them into innerHTML would turn markup into
    // executable DOM and pay an avoidable HTML parse cost on every reveal.
    const spans = Array.from(this.cleanText, (ch) => {
      const span = document.createElement('span')
      const rot = (Math.random() - 0.5) * 30
      span.setAttribute('aria-hidden', 'true')
      span.style.cssText =
        'display:inline-block;opacity:0;transform:translateY(20px) rotate(' +
        `${rot}deg);filter:blur(8px);transition:none;`
      span.dataset.rot = String(rot)
      span.textContent = ch === ' ' ? '\u00a0' : ch
      return span
    })
    this.el.replaceChildren(...spans)

    this.timeoutId = window.setTimeout(() => this.finalize(), this.dur + 200)
    this.rafId = requestAnimationFrame(this.tick)
  }

  hide(): void {
    this.finalize()
    if (this.cleanText) this.el.textContent = this.cleanText
    this.el.removeAttribute('aria-label')
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

    const spans = this.el.children
    const n = spans.length
    // Stagger: each character starts at a different time
    const staggerDelay = 0.3 // 30% of duration for stagger spread
    for (let i = 0; i < n; i++) {
      const span = spans[i] as HTMLElement
      const charDelay = (i / n) * staggerDelay
      const charT = Math.max(0, Math.min(1, (t - charDelay) / (1 - staggerDelay)))
      // Ease out cubic
      const eased = 1 - Math.pow(1 - charT, 3)
      const opacity = eased
      const translateY = 20 * (1 - eased)
      const rotate = parseFloat(span.dataset.rot || '0') * (1 - eased)
      const blur = 8 * (1 - eased)
      span.style.opacity = String(opacity)
      span.style.transform = `translateY(${translateY}px) rotate(${rotate}deg)`
      span.style.filter = `blur(${blur}px)`
    }

    this.rafId = requestAnimationFrame(this.tick)
  }

  finalize(): void {
    this.running = false
    BlurFade.active.delete(this)
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    // Set spans to their final resting state IN PLACE (do NOT removeAttribute
    // style — that drops display:inline-block → inline, breaking per-character
    // shift). Keep display:inline-block so the box model matches the during-anim
    // state exactly. Set transform='none' and filter='none' (NOT translateY(0)/
    // blur(0px)) — 'none' removes the compositing layer + filter pipeline, which
    // changes subpixel AA vs the animated state. opacity='1' is the final value.
    const spans = this.el.children
    for (let i = 0; i < spans.length; i++) {
      const sp = spans[i] as HTMLElement
      sp.style.opacity = '1'
      sp.style.transform = 'none'
      sp.style.filter = 'none'
    }
  }

  private cancel(): void {
    this.running = false
    BlurFade.active.delete(this)
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    if (this.cleanText) {
      this.el.textContent = this.cleanText
    }
  }

  /** Stop every active blur animation owned by the current Experience. */
  static disposeAll(): void {
    for (const instance of BlurFade.active) instance.finalize()
  }
}
