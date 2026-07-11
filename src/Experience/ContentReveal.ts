// src/Experience/ContentReveal.ts
// Section sync: toggles .section-active + applies per-section theme.
//
// PER-SECTION THEME (KISS):
//   Each section has sectionTheme: 'light' | 'dark' in WorldConfig.
//   On section change, toggle uk-light on <html> + <body>:
//     auto:    light → uk-light, dark → no uk-light
//     inverse: FLIPPED — light → no uk-light, dark → uk-light
//   EnvSphere syncs via jlz:theme-applied event.

import { eventBus, type AppEvents } from '../core/EventBus'
import { themeManager } from '../core/ThemeManager'
import { getWorldConfigForPage, type PhaseConfig } from '../core/WorldConfig'
import UIkit from 'uikit'

export class ContentReveal {
  private sectionHandler: ((payload: AppEvents['jlz:section-change']) => void) | null = null
  private pageSectionHandler: ((e: Event) => void) | null = null
  private themeHandler: ((e: Event) => void) | null = null
  private currentSectionId: string | null = null
  private currentSectionIndex: number = -1
  private cachedConfigs: readonly PhaseConfig[] | null = null

  constructor() {
    this.setupSectionSync()
    this.setupThemeSync()
  }

  private getConfigs(): readonly PhaseConfig[] {
    if (!this.cachedConfigs) {
      const pageKey = document.body.dataset.page ?? 'home'
      this.cachedConfigs = getWorldConfigForPage(pageKey)
    }
    return this.cachedConfigs
  }

  private setupSectionSync() {
    // Home: jlz:section-change (data-section)
    this.sectionHandler = (payload) => {
      if (!payload?.sectionId) return
      const matching = document.querySelector<HTMLElement>(`[data-section="${payload.sectionId}"]`)
      if (!matching) return
      this.currentSectionId = payload.sectionId
      this.activateSection(`[data-section="${payload.sectionId}"]`)
    }
    eventBus.on('jlz:section-change', this.sectionHandler)

    // Content pages: jlz:page-section-change (data-page-section)
    this.pageSectionHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail
      if (!detail) return
      const sections = document.querySelectorAll<HTMLElement>('[data-page-section]')
      const el = sections[detail.index]
      if (el) {
        const id = el.getAttribute('data-page-section') ?? ''
        this.currentSectionId = id
        this.currentSectionIndex = detail.index
        this.activateSection(`[data-page-section="${id}"]`)
      }
    }
    window.addEventListener('jlz:page-section-change', this.pageSectionHandler)
  }

  private activateSection(selector: string): void {
    const matching = document.querySelector<HTMLElement>(selector)
    if (!matching) return

    document.querySelectorAll<HTMLElement>('[data-section], [data-page-section]').forEach((el) => {
      el.classList.remove('section-active')
    })
    matching.classList.add('section-active')
    this.applyTheme(this.currentSectionId ?? '')
    requestAnimationFrame(() => {
      try { (UIkit as unknown as { update: () => void }).update() } catch { /* not ready */ }
    })
  }

  private applyTheme(sectionId: string): void {
    const configs = this.getConfigs()
    let cfg = configs.find((c) => c.domSection === sectionId || c.id === sectionId)
    if (!cfg && this.currentSectionIndex >= 0) {
      cfg = configs[this.currentSectionIndex]
    }
    const sectionIsLight = cfg?.theme === 'light' || !cfg
    const isInverse = themeManager.isInverse
    const shouldUseLight = isInverse ? !sectionIsLight : sectionIsLight

    document.documentElement.classList.toggle('uk-light', shouldUseLight)
    document.body.classList.toggle('uk-light', shouldUseLight)

    window.dispatchEvent(
      new CustomEvent('jlz:theme-applied', {
        detail: { isLight: shouldUseLight, mode: isInverse ? 'inverse' : 'auto' },
      }),
    )
  }

  private setupThemeSync() {
    // Single handler for both theme-change + route-change
    this.themeHandler = (e: Event) => {
      const type = e.type
      if (type === 'jlz:route-change') {
        // Invalidate cache on page switch
        this.cachedConfigs = null
        this.currentSectionId = null
        this.currentSectionIndex = -1
        return
      }
      // jlz:theme-change — re-apply current section theme
      if (this.currentSectionId) this.applyTheme(this.currentSectionId)
    }
    window.addEventListener('jlz:theme-change', this.themeHandler)
    window.addEventListener('jlz:route-change', this.themeHandler)
  }

  destroy() {
    if (this.sectionHandler) eventBus.off('jlz:section-change', this.sectionHandler)
    if (this.pageSectionHandler) window.removeEventListener('jlz:page-section-change', this.pageSectionHandler)
    if (this.themeHandler) {
      window.removeEventListener('jlz:theme-change', this.themeHandler)
      window.removeEventListener('jlz:route-change', this.themeHandler)
    }
  }
}
