// NoiseText — glitch reveal animation.
//
// Effect: characters appear with random X/Y offset + blur, then settle
// into their final position with a stagger. More cinematic than typewriter.
//
// Each character: starts offset (translateY + rotate) + blurred, animates
// to clean position. Staggered timing = wave-like reveal.

export class NoiseText {
  private static instances = new WeakMap<HTMLElement, NoiseText>();

  private readonly el: HTMLElement;
  private cleanText = '';
  private rafId: number | null = null;
  private timeoutId: number | null = null;
  private running = false;
  private start = 0;
  private dur = 1000;

  private constructor(el: HTMLElement) {
    this.el = el;
  }

  static for(el: HTMLElement): NoiseText {
    let inst = this.instances.get(el);
    if (!inst) {
      inst = new NoiseText(el);
      this.instances.set(el, inst);
    }
    return inst;
  }

  show(dur: number = 0.6, sourceText?: string): void {
    this.cancel();
    this.cleanText = sourceText ?? (this.el.textContent || '');
    if (this.cleanText.length === 0) return;

    this.dur = dur * 1000;
    this.running = true;
    this.start = performance.now();
    this.el.setAttribute('data-visible', 'true');

    // Build spans — each character in its own span for stagger animation
    this.el.innerHTML = this.cleanText.split('').map((ch) => {
      const safeChar = ch === ' ' ? '&nbsp;' : ch;
      return `<span style="display:inline-block;opacity:0;transform:translateY(20px) rotate(${(Math.random() - 0.5) * 30}deg);filter:blur(8px);transition:none;">${safeChar}</span>`;
    }).join('');

    this.timeoutId = window.setTimeout(() => this.finalize(), this.dur + 200);
    this.rafId = requestAnimationFrame(this.tick);
  }

  hide(): void {
    this.finalize();
    this.el.removeAttribute('data-visible');
  }

  private tick = (ts: number): void => {
    if (!this.running) return;
    const t = Math.min(1, (ts - this.start) / this.dur);
    if (t >= 1) {
      this.finalize();
      return;
    }

    const spans = this.el.children;
    const n = spans.length;
    // Stagger: each character starts at a different time
    const staggerDelay = 0.3; // 30% of duration for stagger spread
    for (let i = 0; i < n; i++) {
      const span = spans[i] as HTMLElement;
      const charDelay = (i / n) * staggerDelay;
      const charT = Math.max(0, Math.min(1, (t - charDelay) / (1 - staggerDelay)));
      // Ease out cubic
      const eased = 1 - Math.pow(1 - charT, 3);
      const opacity = eased;
      const translateY = 20 * (1 - eased);
      const rotate = (parseFloat(span.dataset.rot || '0')) * (1 - eased);
      const blur = 8 * (1 - eased);
      span.style.opacity = String(opacity);
      span.style.transform = `translateY(${translateY}px) rotate(${rotate}deg)`;
      span.style.filter = `blur(${blur}px)`;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  finalize(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    // Strip inline styles from the animation spans IN PLACE instead of
    // swapping innerHTML to textContent. Replacing with textContent caused a
    // layout pop: the animated spans were display:inline-block with
    // transform/filter (subpixel rendering + letter-spacing trailing differ
    // from plain text nodes), so the title shifted ~1px at animation end.
    // Removing the style attributes lets the spans render as plain inline
    // text — identical metrics to the pre-animation state, no shift.
    const spans = this.el.children;
    for (let i = 0; i < spans.length; i++) {
      (spans[i] as HTMLElement).removeAttribute('style');
    }
  }

  private cancel(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.cleanText) {
      this.el.textContent = this.cleanText;
    }
  }
}
