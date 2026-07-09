// Subtitles.ts — Short section hints (UI labels, not long subtitles).
//
// Shows a brief, informative hint for each section — like "Drag · Click to open"
// on the works section. Positioned at bottom-center near the dock, subtle styling.
// Fades in on section change, auto-fades after 4s.
//
// Synced with 3D section changes via jlz:section-change event.

import { eventBus, type AppEvents } from '../core/EventBus'

// Short hints per section — informative, not cluttering.
// These complement the section's main content (title + body) with a
// micro-interaction label. Keys match `data-section` attribute in DOM
// (see src/sections/_shared/constants.ts SectionId type).
const HINTS: Record<string, string> = {
  lab: 'Experiments & R&D',
  intro: 'Scroll to explore',
  about: 'Studio philosophy',
  challenge: 'Drag · Click to open',
  contact: "Let's build together",
  process: 'How we work',
}

export class Subtitles {
  private container: HTMLElement
  private text: HTMLElement
  private hideTimer: ReturnType<typeof setTimeout> | null = null
  private readonly sectionChangeHandler: (payload: AppEvents['jlz:section-change']) => void

  constructor() {
    this.container = document.createElement('div')
    this.container.className = 'jlz-hint'
    this.container.setAttribute('aria-live', 'polite')
    this.container.setAttribute('aria-atomic', 'true')

    this.text = document.createElement('span')
    this.text.className = 'jlz-hint__text'
    this.container.appendChild(this.text)

    document.body.appendChild(this.container)

    this.sectionChangeHandler = (payload) => {
      if (payload?.sectionId) {
        this.show(payload.sectionId)
      }
    }
    eventBus.on('jlz:section-change', this.sectionChangeHandler)
  }

  private show(sectionId: string): void {
    const hint = HINTS[sectionId] ?? ''
    if (!hint) {
      this.hide()
      return
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.text.textContent = hint
    this.container.classList.add('is-visible')

    // Auto-hide after 4s — hint is ephemeral, not permanent
    this.hideTimer = setTimeout(() => {
      this.container.classList.remove('is-visible')
      this.hideTimer = null
    }, 4000)
  }

  hide(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
    this.container.classList.remove('is-visible')
  }

  dispose(): void {
    eventBus.off('jlz:section-change', this.sectionChangeHandler)
    if (this.hideTimer) clearTimeout(this.hideTimer)
    this.container.remove()
  }
}
