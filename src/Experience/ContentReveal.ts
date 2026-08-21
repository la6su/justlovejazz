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
import { getCurrentPage } from '../core/routePage'
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
    // Apply theme for the already-active section on init. router.ts runs
    // renderView (→ jlz:route-change) BEFORE Experience.init() creates this
    // ContentReveal, so the route-change listener above misses the initial
    // render. Without this, uk-light from index.html's default stays on
    // <body> until the first section nav → wrong theme on boot (especially
    // visible when inverse mode is persisted in localStorage).
    this.applyInitialTheme()
  }

  private applyInitialTheme(): void {
    const active = document.querySelector<HTMLElement>(
      '[data-section].section-active, [data-page-section].section-active',
    )
    const sectionId =
      active?.getAttribute('data-section') ?? active?.getAttribute('data-page-section') ?? 'intro'
    this.currentSectionId = sectionId
    this.applyTheme(sectionId)
  }

  private getConfigs(): readonly PhaseConfig[] {
    if (!this.cachedConfigs) {
      const pageKey = getCurrentPage()
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
      // Derive the 6-section index from the sectionId so EnvSphere can show
      // the active section's own colour on every scroll step.
      const configs = this.getConfigs()
      const idx = configs.findIndex(
        (c) => c.domSection === payload.sectionId || c.id === payload.sectionId,
      )
      this.currentSectionIndex = idx >= 0 ? idx : -1
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
      try {
        ;(UIkit as unknown as { update: () => void }).update()
      } catch {
        /* not ready */
      }
    })
  }

  private applyTheme(sectionId: string, snap = false): void {
    const configs = this.getConfigs()
    let cfg = configs.find((c) => c.domSection === sectionId || c.id === sectionId)
    if (!cfg && this.currentSectionIndex >= 0) {
      cfg = configs[this.currentSectionIndex]
    }
    // Resolve the section index from the config so EnvSphere/3D sync gets
    // the correct per-section colour even on route-change (where
    // currentSectionIndex was just reset to -1).
    if (cfg) {
      const idx = configs.indexOf(cfg)
      if (idx >= 0) this.currentSectionIndex = idx
    }
    const sectionIsLight = cfg?.theme === 'light' || !cfg
    const isInverse = themeManager.isInverse
    const shouldUseLight = isInverse ? !sectionIsLight : sectionIsLight

    document.documentElement.classList.toggle('uk-light', shouldUseLight)
    document.body.classList.toggle('uk-light', shouldUseLight)

    // Always dispatch so EnvSphere can show the active section's own tone —
    // each section has a distinct colour, so even same-polarity scroll steps
    // must update the background. `themeChanged` lets consumers skip
    // theme-only work (ground, particles) when just the section moved.
    // We always send themeChanged=true so the 3D layer (ground, baku,
    // particles) re-syncs on every applyTheme call — the cost is negligible
    // and it prevents desync on route-change where currentIsLight matches.
    window.dispatchEvent(
      new CustomEvent('jlz:theme-applied', {
        detail: {
          isLight: shouldUseLight,
          sectionIndex: this.currentSectionIndex,
          sectionId,
          themeChanged: true,
          mode: isInverse ? 'inverse' : 'auto',
          snap,
        },
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
        // H13 fix: re-apply theme for the active section on the NEW page.
        // Without this, uk-light from the last active section on the PREVIOUS
        // page persists on <body> until the first section nav on the new page
        // → wrong-theme flash + EnvSphere desync. Find the active section in
        // the freshly-rendered DOM and apply its theme immediately.
        const active = document.querySelector<HTMLElement>(
          '[data-section].section-active, [data-page-section].section-active',
        )
        const sectionId =
          active?.getAttribute('data-section') ??
          active?.getAttribute('data-page-section') ??
          'intro'
        this.currentSectionId = sectionId
        this.applyTheme(sectionId)
        return
      }
      // jlz:theme-change — re-apply current section theme.
      // Fallback chain if currentSectionId was cleared (e.g. by a prior
      // route-change): 1) active DOM section (.section-active), 2) 'intro'.
      // Without this, toggling theme right after page load (before any
      // section navigation) would no-op — currentSectionId was null.
      let sectionId = this.currentSectionId
      if (!sectionId) {
        const active = document.querySelector<HTMLElement>(
          '[data-section].section-active, [data-page-section].section-active',
        )
        sectionId =
          active?.getAttribute('data-section') ??
          active?.getAttribute('data-page-section') ??
          'intro'
        this.currentSectionId = sectionId
      }
      // snap=true: theme toggle → EnvSphere must change instantly (no lerp)
      // to match the instant CSS uk-light flip.
      this.applyTheme(sectionId, true)
    }
    window.addEventListener('jlz:theme-change', this.themeHandler)
    window.addEventListener('jlz:route-change', this.themeHandler)
  }

  destroy() {
    if (this.sectionHandler) eventBus.off('jlz:section-change', this.sectionHandler)
    if (this.pageSectionHandler)
      window.removeEventListener('jlz:page-section-change', this.pageSectionHandler)
    if (this.themeHandler) {
      window.removeEventListener('jlz:theme-change', this.themeHandler)
      window.removeEventListener('jlz:route-change', this.themeHandler)
    }
  }
}
