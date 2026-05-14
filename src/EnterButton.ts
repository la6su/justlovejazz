// src/EnterButton.ts
// Junni-style entry trigger that orchestrates the splash→dissolve transition

export class EnterButton {
  private el: HTMLElement | null = null

  constructor() {
    this.el = document.createElement('button')
    this.el.id = 'jlj-enter'
    this.el.style.cssText = `
      position: fixed;
      bottom: 10vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.8);
      font: 600 clamp(0.55rem, 1vw, 0.85rem) 'Inter', system-ui, -apple-system, sans-serif;
      letter-spacing: 0.3em;
      padding: 14px 40px;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.8s ease, border-color 0.3s ease, color 0.3s ease;
      text-transform: uppercase;
    `
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
    setTimeout(() => {
      this.el!.remove()
    }, duration)
  }
}
