// src/Experience/ContentReveal.ts
// Section sync: listens for jlz:section-change events from Experience
// and toggles .section-active + per-section theme (uk-light/uk-dark).
//
// Per-section theme: each section has sectionTheme: 'light' | 'dark' in
// WorldConfig. When a section becomes active:
//   - auto mode: section gets uk-light if sectionTheme='light', nothing if 'dark'
//   - inverse mode: FLIPPED — section gets uk-light if sectionTheme='dark', nothing if 'light'
//
// This means inverse INVERTS the per-section palette:
//   auto:    light sections (white bg, dark text) + dark sections (dark bg, light text)
//   inverse: light sections → dark (dark bg, light text) + dark sections → light (light bg, dark text)

import { eventBus, type AppEvents } from '../core/EventBus'
import { themeManager } from '../core/ThemeManager'
import UIkit from 'uikit'
import { getWorldConfigForPage } from '../core/WorldConfig'

export class ContentReveal {
  private sectionHandler: ((payload: AppEvents['jlz:section-change']) => void) | null = null
  private themeHandler: (() => void) | null = null
  private currentSectionId: string | null = null

  constructor() {
    this.setupSectionSync()
    this.setupThemeSync()
  }

  private setupSectionSync() {
    this.sectionHandler = (payload) => {
      if (!payload?.sectionId) return
      this.currentSectionId = payload.sectionId

      // Remove 'section-active' from all sections
      document.querySelectorAll<HTMLElement>('[data-section]').forEach((el) => {
        el.classList.remove('section-active')
      })
      // Add to matching section
      const matching = document.querySelector<HTMLElement>(`[data-section="${payload.sectionId}"]`)
      if (matching) {
        matching.classList.add('section-active')
        // Apply per-section theme
        this.applySectionTheme(payload.sectionId)
      }

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

  /** Apply per-section theme (uk-light/uk-dark) based on config + global inverse.
   *  - auto mode: sectionTheme='light' → uk-light (light bg, dark text)
   *               sectionTheme='dark' → no uk-light (dark bg, light text)
   *  - inverse mode: FLIPPED — sectionTheme='light' → no uk-light (dark bg)
   *                  sectionTheme='dark' → uk-light (light bg, dark text) */
  private applySectionTheme(sectionId: string): void {
    const pageKey = document.body.dataset.page ?? 'home'
    const configs = getWorldConfigForPage(pageKey)
    const cfg = configs.find((c) => c.domSection === sectionId)
    if (!cfg) return

    const isInverse = themeManager.isInverse
    const sectionIsLight = cfg.theme === 'light'
    // Inverse flips: light section → dark, dark section → light
    const shouldUseLight = isInverse ? !sectionIsLight : sectionIsLight

    // Toggle uk-light on <body> for this section
    // (UIKit3 uses body.uk-light for global text color overrides)
    document.body.classList.toggle('uk-light', shouldUseLight)
    document.documentElement.classList.toggle('uk-light', shouldUseLight)

    // Dispatch theme-applied so EnvSphere syncs
    window.dispatchEvent(
      new CustomEvent('jlz:theme-applied', {
        detail: { isLight: shouldUseLight, mode: isInverse ? 'inverse' : 'auto' },
      }),
    )
  }

  /** Re-apply current section theme when global theme toggles. */
  private setupThemeSync() {
    this.themeHandler = () => {
      if (this.currentSectionId) {
        this.applySectionTheme(this.currentSectionId)
      }
    }
    window.addEventListener('jlz:theme-change', this.themeHandler)
  }

  destroy() {
    if (this.sectionHandler) {
      eventBus.off('jlz:section-change', this.sectionHandler)
    }
    if (this.themeHandler) {
      window.removeEventListener('jlz:theme-change', this.themeHandler)
    }
  }
}
