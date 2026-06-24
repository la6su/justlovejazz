// NoiseText — character-level flicker (Junni identity effect).
//
// Critical guarantees:
// 1. Frame 0 = correct text → no flash.
// 2. Final frame = ALWAYS clean text (no glitch residue).
// 3. Global instance per element → prevents overlapping animations.
// 4. Debounce: show() called within 1s of a previous call is ignored,
//    preventing rapid re-triggers from leaving text in glitch state.
// 5. sourceText is ALWAYS cached on first call — never re-read from DOM
//    (which might contain glitched text from a previous animation).

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>?+=_~|{}[]';

export class NoiseText {
  private static instances = new WeakMap<HTMLElement, NoiseText>();

  private readonly el: HTMLElement;
  private cleanText = '';
  private hasCleanText = false;  // tracks whether cleanText was ever set

  private rafId: number | null = null;
  private timeoutId: number | null = null;
  private running = false;
  private start = 0;
  private dur = 600;
  private lastShowTime = 0;  // debounce: ignore show() within 1s of previous

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

  /**
   * Start noise animation for `dur` seconds.
   * @param dur Duration in seconds.
   * @param sourceText Explicit clean text. STRONGLY RECOMMENDED — if not
   *   provided, reads from el.textContent ONLY on the first call (cached
   *   thereafter). This prevents glitched text from being captured as
   *   "clean" when show() is called mid-previous-animation.
   */
  show(dur: number = 0.6, sourceText?: string): void {
    const now = performance.now();

    // Debounce: if show() was called less than 1s ago AND animation is
    // still running, ignore this call. Prevents rapid re-triggers from
    // leaving text permanently glitched.
    if (this.running && (now - this.lastShowTime) < 1000) {
      return;
    }
    this.lastShowTime = now;

    this.cancel();

    // Set cleanText: prefer explicit sourceText, then cached value,
    // then read from DOM (first call only).
    if (sourceText) {
      this.cleanText = sourceText;
      this.hasCleanText = true;
    } else if (!this.hasCleanText) {
      // First call ever — read from DOM. This is safe because cancel()
      // above restored cleanText if we had one, or left DOM untouched
      // if this is the first call.
      this.cleanText = this.el.textContent || '';
      this.hasCleanText = true;
    }
    // If hasCleanText is true and no sourceText provided, keep the cached
    // cleanText — NEVER re-read from DOM (it might be glitched).

    if (this.cleanText.length === 0) return;

    // Frame 0 = correct text.
    this.el.textContent = this.cleanText;

    this.dur = dur * 1000;
    this.running = true;
    this.start = now;
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

    if (t >= 1) {
      this.finalize();
      return;
    }

    // Ramp: intensity starts at ~60%, fades linearly to 0 at t=1.
    const intensity = Math.max(0, 1 - t) * 0.60;

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
    // Restore clean text on cancel so DOM is never left glitched.
    if (this.hasCleanText && this.cleanText) {
      this.el.textContent = this.cleanText;
    }
  }
}
