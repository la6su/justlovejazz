// src/EnterButton.ts
// Junni-style entry trigger that orchestrates the splash→dissolve transition

export class EnterButton {
  private el: HTMLElement | null = null

  constructor() {
    this.el = document.createElement('button')
    this.el.id = 'jlj-enter'
    this.el.className = 'jlz-enter'
    // Visual styling lives in src/styles/tokens.css (.jlz-enter).
    // id kept as jlj-enter for back-compat with main-app.ts lookup.
    // Only opacity + pointer-events are toggled dynamically below.
  }

  show(label = 'ENTER SITE'): void {
    this.el!.textContent = label
    document.body.appendChild(this.el!)
    requestAnimationFrame(() => {
      this.el!.style.opacity = '1'
      this.el!.style.pointerEvents = 'auto'
    })
  }

  hide(): void {
    this.el!.style.opacity = '0'
    this.el!.style.pointerEvents = 'none'
    setTimeout(() => this.el!.remove(), 600)
  }

  onTrigger(fn: () => void): void {
    this.el!.addEventListener('click', fn, { once: true })
    this.el!.addEventListener('touchend', fn, { once: true })
  }

  animateOut(duration = 300): void {
    this.el!.style.opacity = '0'
    this.el!.style.pointerEvents = 'none'
    this.cleared = true
    clearTimeout(this._autoId ?? undefined)
    setTimeout(() => this.el?.remove(), duration)
  }

  /**
   * Auto-trigger after timeout — if user doesn't click Enter,
   * dissolve starts automatically.
   */
  private _autoId: ReturnType<typeof setTimeout> | null = null
  private cleared = false

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
