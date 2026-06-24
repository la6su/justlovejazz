// NoiseText — character-level flicker (Junni identity effect).
//
// Critical guarantees:
// 1. Frame 0 = correct text → no flash.
// 2. Final frame = ALWAYS clean text (no glitch residue).
// 3. Global instance per element → prevents overlapping animations.

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>?+=_~|{}[]';

export class NoiseText {
  /** Global registry: one instance per DOM element, prevents overlap. */
  private static instances = new WeakMap<HTMLElement, NoiseText>();

  private readonly el: HTMLElement;
  private cleanText = '';

  private rafId: number | null = null;
  private timeoutId: number | null = null;
  private running = false;
  private start = 0;
  private dur = 600;

  private constructor(el: HTMLElement) {
    this.el = el;
  }

  /**
   * Get or create the singleton NoiseText for this element.
   */
  static for(el: HTMLElement): NoiseText {
    let inst = this.instances.get(el);
    if (!inst) {
      inst = new NoiseText(el);
      this.instances.set(el, inst);
    }
    return inst;
  }

  /**
   * Start noise animation for `dur` seconds.
   * @param dur Duration in seconds.
   * @param sourceText Explicit clean text to use. If passed (strongly recommended),
   *   this overrides reading `el.textContent` and guarantees no "stale noisy text"
   *   is captured when a new animation starts mid-previous-animation.
   */
  show(dur: number = 0.6, sourceText?: string): void {
    this.cancel();

    // If caller provides explicit text, use it. Otherwise read from DOM.
    // Reading from DOM immediately after cancel is safe because cancel only
    // stops RAF/timers — it does NOT modify el.textContent.
    this.cleanText = sourceText ?? (this.el.textContent || '');
    if (this.cleanText.length === 0) return;

    // Frame 0 = correct text.
    this.el.textContent = this.cleanText;

    this.dur = dur * 1000;
    this.running = true;
    this.start = performance.now();
    this.el.setAttribute('data-visible', 'true');

    // Safety timeout → guarantees we always stop even if RAF is throttled.
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

    // Hard stop at 100%: only the very last frame produces noise,
    // then we immediately finalize. No "90% early stop" that can leave
    // the animation in an intermediate state.
    if (t >= 1) {
      this.finalize();
      return;
    }

    // Ramp: intensity starts at ~30%, fades linearly to 0 at t=1.
    const intensity = Math.max(0, 1 - t) * 0.30;

    // Generate noisy version of cleanText.
    let buf = '';
    for (let i = 0; i < this.cleanText.length; i++) {
      const ch = this.cleanText[i];
      if (ch === ' ' || ch === '\n' || ch === '\t') {
        buf += ch;
      } else if (Math.random() < intensity) {
        buf += CHARS[Math.floor(Math.random() * CHARS.length)];
      } else {
        buf += ch;
      }
    }

    this.el.textContent = buf;
    this.rafId = requestAnimationFrame(this.tick);
  };

  /** Hard stop with clean text restoration (called on animation end). */
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
    this.el.textContent = this.cleanText;
  }

  /** Lightweight cancel — restores clean text and cancels RAF+timeout. */
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
    // Always restore clean text on cancel so a new show() read from DOM
    // picks up the correct text, not a noisy frame from the previous run.
    if (this.cleanText) {
      this.el.textContent = this.cleanText;
    }
  }
}
