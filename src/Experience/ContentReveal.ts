// src/Experience/ContentReveal.ts
// Section sync: listens for jlz:section-change events from Experience
// and toggles .section-active on the matching DOM section.
//
// UIKit scrollspy (uk-scrollspy) handles the fade-in/fade-out animation.
// This class ONLY toggles pointer-events via .section-active class —
// it does NOT manage opacity or transform (that's UIKit's job).
//
// Because sections are stacked (position:absolute, display:none/flex),
// scrollspy doesn't re-evaluate on display change. We dispatch a
// window scroll event after the section swap so scrollspy's check()
// runs and fades in the newly-active section's [uk-scrollspy] children.

import { eventBus, type AppEvents } from '../core/EventBus'

export class ContentReveal {
  private sectionHandler: ((payload: AppEvents['jlz:section-change']) => void) | null = null

  constructor() {
    this.setupSectionSync()
  }

  /**
   * Listen for 3D section changes from Experience.
   * Toggles .section-active for pointer-events (UIKit scrollspy handles
   * the visual fade-in/fade-out via uk-animation-fade).
   */
  private setupSectionSync() {
    this.sectionHandler = (payload) => {
      if (!payload?.sectionId) return
      // Remove 'section-active' from all sections
      document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
        el.classList.remove('section-active')
      })
      // Add to matching section
      const matching = document.querySelector<HTMLElement>(`[data-section="${payload.sectionId}"]`)
      if (matching) {
        matching.classList.add('section-active')
      }
      // Sections are display:none → display:flex on activation, but scrollspy
      // only re-evaluates on scroll/resize events. Dispatch a synthetic scroll
      // event so scrollspy's check() runs and the newly-visible [uk-scrollspy]
      // children fade in. (No app code listens to window scroll — only UIkit.)
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('scroll'))
      })
    }
    eventBus.on('jlz:section-change', this.sectionHandler)
  }

  destroy() {
    if (this.sectionHandler) {
      eventBus.off('jlz:section-change', this.sectionHandler)
    }
  }
}
