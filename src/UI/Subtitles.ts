// Subtitles — Section-driven NoiseText subtitles (junni Subtitle pattern).
// Shows a subtitle per section using NoiseText scramble animation.
// DOM-based, synced with 3D section changes via jlz:section-change event.

import { NoiseText } from '../Experience/NoiseText'

const SUBTITLES: Record<string, string> = {
  step01: 'Scene-first thinking. Scroll maps to emotion.',
  step02: 'One source of truth for DOM and WebGL.',
  step03: 'Each project — its own universe.',
  step04: 'Material presets, lighting, post — all state-driven.',
  step05: 'We bring imagination to life through code.',
  step06: 'Lifecycle is a feature, not an afterthought.',
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
    span.textContent = text
    p.appendChild(span)
    this.container.appendChild(p)

    // NoiseText scramble.
    this.current = NoiseText.for(span)
    this.current.show(0.8)

    // Auto-hide after 5s.
    setTimeout(() => {
      if (this.current) {
        this.current.hide()
        this.current = null
      }
    }, 5000)
  }

  hide(): void {
    this.current?.hide()
    this.current = null
    this.container.innerHTML = ''
  }

  dispose(): void {
    this.hide()
    this.container.remove()
  }
}
