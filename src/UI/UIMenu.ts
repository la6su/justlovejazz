// UIMenu.ts — Main site header plus the home section slider.

import UIkit from 'uikit'
import { themeManager } from '../core/ThemeManager'

export interface UIMenuOptions {
  sectionLabels: string[]
}

// 4 main sections shown in the slider (Lab=0 and Process=5 are secret side sections)
const MAIN_SECTION_INDICES = [1, 2, 3, 4]

// Per-page slider labels (idx 1-4 = 4 main sections)
const PAGE_SLIDER_LABELS: Record<string, string[]> = {
  home: ['Studio', 'Works', 'Services', 'Manifesto'],
  services: ['Creative Direction', 'Interactive Dev', 'Motion & Realtime', 'AI Systems'],
  manifesto: ['Purpose', 'Clarity', 'Emotion', 'Simplicity'],
}
const DEFAULT_LABELS = PAGE_SLIDER_LABELS['home']!
const PAGE_LINKS = [
  ['/app', 'Home'],
  ['/app/services', 'Services'],
  ['/app/manifesto', 'Manifesto'],
  ['/blog', 'Blog'],
] as const

export class UIMenu {
  private navEl: HTMLElement
  private modalEl: HTMLElement
  private slider: HTMLElement
  private items: HTMLElement[] = []
  private pageLinks: HTMLAnchorElement[] = []
  private _activeIndex = 1
  private _onNavigate: ((index: number) => void) | null = null
  private _sliderComponent: { show: (idx: number) => void } | null = null
  private _routeHandler: ((event: Event) => void) | null = null
  private _themeHandler: ((event: Event) => void) | null = null

  constructor(_opts: UIMenuOptions) {
    // sectionLabels no longer used — slider labels are page-specific
    // (PAGE_SLIDER_LABELS), updated on route change.

    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = `
      <div class="uk-container uk-container-expand uk-padding-small">
        <div id="slider-nav" class="uk-slider-container uk-slider jlz-section-slider" uk-slider="center: 1; active: first" role="region" aria-roledescription="carousel">
          <div class="uk-position-relative">
            <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto" aria-live="polite" role="presentation">
            </ul>
          </div>
        </div>
      </div>
    `

    this.modalEl = document.createElement('div')
    this.modalEl.id = 'jlz-menu-modal'
    this.modalEl.setAttribute('uk-modal', '')
    this.modalEl.innerHTML = `
      <div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical">
        <button class="uk-modal-close-default" type="button" uk-close aria-label="Close main menu"></button>
        <p class="uk-text-meta uk-text-uppercase">Main Menu</p>
        <ul class="uk-nav uk-nav-default jlz-main-menu-nav">
          ${PAGE_LINKS.map(([href, label]) => `
            <li><a href="${href}" data-page-link="${href}">${label}</a></li>
          `).join('')}
        </ul>
        <div class="uk-margin-large-top">
          <p class="uk-text-meta uk-text-uppercase">Contact</p>
          <ul class="uk-nav uk-nav-default jlz-main-menu-nav uk-margin-small-top">
            <li><a href="mailto:hello@justlovejazz.com">Email</a></li>
            <li><a href="https://t.me/justlovejazz" target="_blank" rel="noopener">Telegram</a></li>
            <li><a href="https://github.com/la6su" target="_blank" rel="noopener">GitHub</a></li>
          </ul>
        </div>
        <div class="uk-margin-large-top jlz-theme-toggle">
          <p class="uk-text-meta uk-text-uppercase">Theme</p>
          <button class="uk-button uk-button-default uk-button-small uk-margin-small-top" id="jlz-theme-toggle-btn" type="button" aria-pressed="false">
            <span uk-icon="icon: paint-bucket; ratio: 0.8" aria-hidden="true"></span>
            <span class="uk-margin-small-left" id="jlz-theme-mode-label">Auto</span>
          </button>
          <p class="uk-text-meta uk-margin-small-top jlz-text-subtle" style="font-size: 0.65rem;">Auto = preset · Inverse = flip light↔dark</p>
        </div>
      </div>
    `

    const ul = this.navEl.querySelector('.uk-slider-items')!
    MAIN_SECTION_INDICES.forEach((sectionIdx, i) => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = '#'
      a.className = 'jlz-nav-link'
      a.textContent = DEFAULT_LABELS[i] ?? `S${sectionIdx}`
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this._onNavigate?.(sectionIdx)
      })
      li.appendChild(a)
      ul.appendChild(li)
      this.items.push(li)
    })

    this.slider = this.navEl.querySelector('#slider-nav')!
    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)
    app.appendChild(this.modalEl)
    this.pageLinks = Array.from(this.modalEl.querySelectorAll<HTMLAnchorElement>('[data-page-link]'))
    this._sliderComponent = UIkit.slider(this.slider)
    this._routeHandler = (event: Event) => {
      const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? 'home'
      this.updatePageActive(page)
      this.updateSliderLabels(page)
    }
    window.addEventListener('jlz:route-change', this._routeHandler)

    // Theme toggle — single button, toggles auto ↔ inverse.
    const themeBtn = this.modalEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle-btn')
    themeBtn?.addEventListener('click', () => {
      themeManager.toggle()
    })
    this._themeHandler = () => this.updateThemeLabel()
    window.addEventListener('jlz:theme-change', this._themeHandler)

    this.updateActive()
    this.updatePageActive(document.body.dataset.page ?? 'home')
    this.updateSliderLabels(document.body.dataset.page ?? 'home')
    this.updateThemeLabel()
  }

  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  setActive(index: number): void {
    this._activeIndex = index
    this.updateActive()
  }

  private updateActive(): void {
    const mainIdx = MAIN_SECTION_INDICES.indexOf(this._activeIndex)
    this.items.forEach((item, i) => {
      item.classList.toggle('uk-active', i === mainIdx)
    })
    if (mainIdx >= 0 && this._sliderComponent) {
      this._sliderComponent.show(mainIdx)
    }
  }

  /** Update slider nav labels for the current page. */
  private updateSliderLabels(page: string): void {
    const labels = PAGE_SLIDER_LABELS[page] ?? DEFAULT_LABELS
    this.items.forEach((li, i) => {
      const a = li.querySelector('.jlz-nav-link')
      if (a) a.textContent = labels[i] ?? `S${i}`
    })
  }

  /** Update the theme toggle button label + aria-pressed. */
  private updateThemeLabel(): void {
    const label = this.modalEl.querySelector<HTMLElement>('#jlz-theme-mode-label')
    const btn = this.modalEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle-btn')
    if (label) {
      label.textContent = themeManager.isInverse ? 'Inverse' : 'Auto'
    }
    if (btn) {
      btn.setAttribute('aria-pressed', String(themeManager.isInverse))
      btn.classList.toggle('uk-active', themeManager.isInverse)
    }
  }

  dispose(): void {
    if (this._routeHandler) {
      window.removeEventListener('jlz:route-change', this._routeHandler)
    }
    if (this._themeHandler) {
      window.removeEventListener('jlz:theme-change', this._themeHandler)
    }
    try { UIkit.modal(this.modalEl).$destroy() } catch { /* ignore */ }
    try { UIkit.slider(this.slider).$destroy() } catch { /* ignore */ }
    this.modalEl.remove()
    this.navEl.remove()
  }

  private updatePageActive(page: string): void {
    const activeHref = page === 'home' ? '/' : `/${page}`
    this.pageLinks.forEach((link) => {
      link.parentElement?.classList.toggle('uk-active', link.dataset.pageLink === activeHref)
    })
  }
}
