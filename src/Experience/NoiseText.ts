// NoiseText — DOM text with character scramble animation.
// Junni pattern: text appears letter-by-letter with random noise characters
// resolving to final text. Studio identity effect.
//
// Usage: const nt = new NoiseText(element); nt.show('JUSTLOVEJAZZ', 1.5)

const NOISE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

export class NoiseText {
  private elm: HTMLElement
  private text = ''
  private startTime = 0
  private duration = 0
  private interval: ReturnType<typeof setInterval> | null = null
  private onFinishAnimation: (() => void) | null = null

  constructor(elm: HTMLElement) {
    this.elm = elm
  }

  show(text: string, duration = 1.5, onFinish?: () => void): void {
    this.text = text
    this.stopAnimation()
    this.startTime = Date.now()
    this.elm.textContent = ''
    this.elm.setAttribute('data-visible', 'true')
    this.duration = duration * 1000 // ms
    this.onFinishAnimation = onFinish ?? null

    this.interval = setInterval(() => this.draw(), 30)
  }

  hide(): void {
    this.stopAnimation()
    this.elm.setAttribute('data-visible', 'false')
    this.elm.textContent = ''
  }

  private draw(): void {
    const elapsed = Date.now() - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)

    if (progress >= 1) {
      this.elm.textContent = this.text
      this.stopAnimation()
      this.onFinishAnimation?.()
      return
    }

    // Reveal characters left-to-right; unrevealed show noise.
    const revealCount = Math.floor(this.text.length * progress)
    let result = ''
    for (let i = 0; i < this.text.length; i++) {
      if (i < revealCount) {
        result += this.text[i]
      } else if (this.text[i] === ' ') {
        result += ' '
      } else {
        result += NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
      }
    }
    this.elm.textContent = result
  }

  private stopAnimation(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  dispose(): void {
    this.stopAnimation()
  }
}
