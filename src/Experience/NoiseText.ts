// NoiseText — junni-style typewriter reveal with noise tail.
//
// Port of junni-inc/next.junni.co.jp NoiseText (src/ts/MainScene/NoiseText/index.ts).
// Commit 64002f9 pattern — proven stable in production.
//
// Effect: characters appear left-to-right. Already-revealed characters
// are clean (correct). Ahead of the reveal position, 1-3 random noise
// characters flicker. As the animation progresses, more characters
// become "fixed" (clean) and the noise tail shrinks. At the end, the
// full text is displayed clean.
//
// Key stability fix (from 64002f9): safety timeout guarantees finalize()
// fires even if RAF is throttled (background tab, heavy GPU, etc).
// finalize() + cancel() both restore this.cleanText so el never gets
// stuck showing noise symbols.

const CHARS = '░▒▓█▄▀▌▐│║╟╠╫╬●○◆◇▪▫•·∴∵≈≠≤≥±÷×';

export class NoiseText {
  /** Global registry: one instance per DOM element, prevents overlap. */
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

  /**
   * Start noise animation for `dur` seconds.
   * Junni pattern: typewriter reveal with noise tail.
   *
   * @param dur Duration in seconds.
   * @param sourceText Explicit clean text. If not provided, reads from DOM.
   */
  show(dur: number = 0.6, sourceText?: string): void {
    this.cancel();

    this.cleanText = sourceText ?? (this.el.textContent || '');
    if (this.cleanText.length === 0) return;

    // Start with empty text — characters will appear left-to-right
    this.el.textContent = '';

    this.dur = dur * 1000;
    this.running = true;
    this.start = performance.now();
    this.el.setAttribute('data-visible', 'true');

    // Safety timeout → guarantees we always stop even if RAF is throttled.
    // This is the critical fix from commit 64002f9 — without it, a throttled
    // RAF (background tab, heavy GPU) could leave el stuck mid-noise.
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

    // Progressive reveal: fixedLength grows from 0 to text.length
    const fixedLength = Math.floor(t * this.cleanText.length);
    // Noise tail: 1-3 random characters after the fixed portion
    const noiseLength = Math.min(3, this.cleanText.length - fixedLength);

    let text = '';

    // Fixed (clean) characters — already revealed
    for (let i = 0; i < fixedLength; i++) {
      text += this.cleanText[i];
    }

    // Noise tail — random characters that flicker
    for (let i = 0; i < noiseLength; i++) {
      text += CHARS[Math.floor(Math.random() * CHARS.length)];
    }

    this.el.textContent = text;
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
    // Restore clean text — guarantees el never stuck on noise symbols
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
    // Restore clean text so el never gets stuck showing noise symbols
    if (this.cleanText) {
      this.el.textContent = this.cleanText;
    }
  }
}
