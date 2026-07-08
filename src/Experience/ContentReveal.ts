// src/Experience/ContentReveal.ts
// Section sync: listens for jlz:section-change events from Experience
// and toggles .section-active on the matching DOM section.
//
// UIKit scrollspy (uk-scrollspy) handles the fade-in/fade-out animation.
// This class ONLY toggles pointer-events via .section-active class —
// it does NOT manage opacity or transform (that's UIKit's job).

import { eventBus, type AppEvents } from '../core/EventBus'
import UIkit from 'uikit'

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
      // Trigger UIkit scrollspy re-evaluation on the active section.
      // Using UIkit.update() instead of dispatching a synthetic scroll event —
      // the synthetic scroll caused infinite rAF loops in some browsers
      // (scroll → scrollspy → rAF → scroll → ...) and "ResizeObserver loop"
      // errors. UIkit.update() re-evaluates scrollspy without side effects.
      requestAnimationFrame(() => {
        try {
          ;(UIkit as unknown as { update: () => void }).update()
        } catch {
          /* UIkit not ready yet */
        }
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
