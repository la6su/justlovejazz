// src/EnterButton.ts
// Junni-style entry trigger that orchestrates the splash→dissolve transition

export class EnterButton {
  private el: HTMLElement | null = null
  private cleared = false
  private _autoId: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.el = document.createElement('button')
    this.el.id = 'jlj-enter'
    this.el.className = 'jlz-enter'
  }

  show(label = 'ENTER SITE'): void {
    this.el!.textContent = label
    this.el!.setAttribute('tabindex', '0')
    this.el!.setAttribute('role', 'button')
    document.body.appendChild(this.el!)
    // Delay reveal slightly for cinematic timing
    requestAnimationFrame(() => {
      this.el!.classList.add('is-visible')
      this.el!.focus()
    })
  }

  hide(): void {
    this.el!.classList.remove('is-visible')
    this.el!.style.pointerEvents = 'none'
  }

  onTrigger(fn: () => void): void {
    this.el!.addEventListener('click', fn, { once: true })
    this.el!.addEventListener('touchend', fn, { once: true })
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        fn()
      }
    }
    this.el!.addEventListener('keydown', keyHandler, { once: true })
  }

  animateOut(duration = 400): void {
    this.el!.classList.remove('is-visible')
    this.el!.style.pointerEvents = 'none'
    this.el!.style.opacity = '0'
    this.cleared = true
    clearTimeout(this._autoId ?? undefined)
    setTimeout(() => this.el?.remove(), duration)
  }

  /**
   * Auto-trigger after timeout — if user doesn't click Enter,
   * dissolve starts automatically.
   */
  autoTriggerAfter(ms: number, fn: () => void): void {
    this._autoId = setTimeout(() => {
      if (!this.cleared) {
        fn()
      }
    }, ms)
  }

  cancelAuto(): void {
    clearTimeout(this._autoId ?? undefined)
    this._autoId = null
  }
}