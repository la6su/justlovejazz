// Subtitles — Section-driven NoiseText subtitles (junni Subtitle pattern).
// Shows a subtitle per section using NoiseText scramble animation.
// DOM-based, synced with 3D section changes via jlz:section-change event.

import { NoiseText } from '../Experience/NoiseText'

// Section IDs match templates.ts: intro, about, flexible, challenge, innovative, contact
const SUBTITLES: Record<string, string> = {
  intro: 'Scene-first thinking. Scroll maps to emotion.',
  about: 'One source of truth for DOM and WebGL.',
  flexible: 'Adaptive workflows from concept to production.',
  challenge: 'Each project — its own universe.',
  innovative: 'Pushing the frontier of what browsers can do.',
  contact: 'We bring imagination to life through code.',
}

export class Subtitles {
  private container: HTMLElement
  private current: NoiseText | null = null
  private readonly sectionChangeHandler: (e: Event) => void

  constructor() {
    // Create or find subtitle container.
    this.container = document.querySelector('.jlz-subtitles') as HTMLElement
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'jlz-subtitles'
      document.body.appendChild(this.container)
    }

    // Bound handler for cleanup in dispose().
    this.sectionChangeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.sectionId) {
        this.showForSection(detail.sectionId)
      }
    }
    window.addEventListener('jlz:section-change', this.sectionChangeHandler)
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
    window.removeEventListener('jlz:section-change', this.sectionChangeHandler)
    this.hide()
    this.container.remove()
  }
}
