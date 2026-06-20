// Subtitles — Section-driven NoiseText subtitles (junni Subtitle pattern).
// Shows a subtitle per section using NoiseText scramble animation.
// DOM-based, synced with 3D section changes via jlz:section-change event.

import { NoiseText } from '../Experience/NoiseText'

const SUBTITLES: Record<string, string> = {
  step01: 'Flexible thinking to pursue ideals to the end.',
  step02: 'Always a challenger to realize unprecedented proposals.',
  step03: 'Explore the works.',
  step04: 'Each carries its own material preset.',
  step05: 'We bring imagination to life.',
  step06: 'Crafting diverse emotions and results.',
}

export class Subtitles {
  private container: HTMLElement
  private current: NoiseText | null = null

  constructor() {
    // Create or find subtitle container.
    this.container = document.querySelector('.jlz-subtitles') as HTMLElement
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'jlz-subtitles'
      document.body.appendChild(this.container)
    }

    // Listen for 3D section changes.
    window.addEventListener('jlz:section-change', (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.sectionId) {
        this.showForSection(detail.sectionId)
      }
    })
  }

  private showForSection(sectionId: string): void {
    const text = SUBTITLES[sectionId] || ''
    if (!text) {
      this.hide()
      return
    }

    // Clear previous.
    this.container.innerHTML = ''
    const p = document.createElement('p')
    p.className = 'jlz-subtitles-text'
    const span = document.createElement('span')
    p.appendChild(span)
    this.container.appendChild(p)

    // NoiseText scramble.
    this.current = new NoiseText(span)
    this.current.show(text, 1.0)

    // Auto-hide after 5s.
    setTimeout(() => {
      if (this.current) {
        this.current.hide()
      }
    }, 5000)
  }

  hide(): void {
    if (this.current) {
      this.current.hide()
      this.current = null
    }
    this.container.innerHTML = ''
  }

  dispose(): void {
    this.hide()
    window.removeEventListener('jlz:section-change', this as unknown as EventListener)
  }
}
