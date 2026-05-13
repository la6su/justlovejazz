// src/Experience/SectionTransition.ts
// Cinematic section transitions: curtain wipe + bloom pulse

interface CurtainPanel {
  el: HTMLElement
  targetProgress: number // 0 = hidden, 1 = full coverage
}

export class SectionTransition {
  private curtain: HTMLElement | null = null
  private panels: CurtainPanel[] = []
  private active = false

  constructor() {
    this.createCurtain()
  }

  private createCurtain() {
    const curtain = document.createElement('div')
    curtain.id = 'section-curtain'
    curtain.style.cssText = `
      position: fixed; inset: 0; z-index: 100; pointer-events: none;
      display: flex; gap: 0;
    `

    for (let i = 0; i < 2; i++) {
      const panel = document.createElement('div')
      panel.style.cssText = `
        flex: 1; background: #000; transform: scaleX(0);
        transform-origin: ${i === 0 ? 'left' : 'right'} center;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      `
      curtain.appendChild(panel)
      this.panels.push({ el: panel, targetProgress: 0 })
    }

    document.body.appendChild(curtain)
    this.curtain = curtain
  }

  /** Trigger curtain wipe transition */
  trigger(): Promise<void> {
    if (this.active) return Promise.resolve()
    this.active = true

    return new Promise((resolve) => {
      // Phase 1: Close (cover)
      this.panels.forEach(p => {
        p.targetProgress = 1
        this.updatePanels()
      })

      // Phase 2: Open (reveal)
      setTimeout(() => {
        this.panels.forEach(p => {
          p.targetProgress = 0
          this.updatePanels()
        })

        // Done
        setTimeout(() => {
          this.active = false
          resolve()
        }, 700)
      }, 150) // Minimum hold time before opening
    })
  }

  private updatePanels(): void {
    this.panels.forEach(p => {
      const scale = p.targetProgress === 1 ? 1 : 0
      p.el.style.transform = `scaleX(${scale})`
    })
  }

  /** Cleanup */
  destroy(): void {
    if (this.curtain) this.curtain.remove()
  }
}
