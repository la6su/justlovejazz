// UIMenu.ts — Main site header plus the home section slider.

import UIkit from 'uikit'

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

const MAIN_SECTION_INDICES = [1, 2, 3, 4, 5, 6]
const PAGE_LINKS = [
  ['/', 'Home'],
  ['/music', 'Music'],
  ['/videos', 'Videos'],
  ['/shows', 'Shows'],
  ['/news', 'News'],
  ['/about', 'About'],
  ['/gallery', 'Gallery'],
] as const

export class UIMenu {
  public button: HTMLButtonElement
  private navEl: HTMLElement
  private modalEl: HTMLElement
  private slider: HTMLElement
  private items: HTMLElement[] = []
  private pageLinks: HTMLAnchorElement[] = []
  private _activeIndex = 1
  private _onNavigate: ((index: number) => void) | null = null
  private _sliderComponent: { show: (idx: number) => void } | null = null
  private _routeHandler: ((event: Event) => void) | null = null

  constructor(opts: UIMenuOptions) {
    const labels = opts.sectionLabels

    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = `
      <nav class="uk-navbar-container uk-navbar-transparent uk-container uk-container-expand" uk-navbar>
        <div class="uk-navbar-left">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
        </div>
        <div class="uk-navbar-center">
          <div id="slider-nav" class="uk-slider-container uk-slider jlz-section-slider" uk-slider="center: 1; active: first" role="region" aria-roledescription="carousel">
            <div class="uk-position-relative">
              <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto" aria-live="polite" role="presentation">
              </ul>
            </div>
          </div>
        </div>
        <div class="uk-navbar-right">
          <button id="jlz-menu-toggle" class="uk-navbar-toggle" type="button" uk-toggle="target: #jlz-menu-modal" aria-label="Open main menu">
            <span uk-navbar-toggle-icon aria-hidden="true"></span>
          </button>
        </div>
      </nav>
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
      </div>
    `

    const ul = this.navEl.querySelector('.uk-slider-items')!
    MAIN_SECTION_INDICES.forEach((sectionIdx) => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = '#'
      a.className = 'jlz-nav-link'
      a.textContent = labels[sectionIdx] ?? `S${sectionIdx}`
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this._onNavigate?.(sectionIdx)
      })
      li.appendChild(a)
      ul.appendChild(li)
      this.items.push(li)
    })

    this.button = this.navEl.querySelector<HTMLButtonElement>('#jlz-menu-toggle')!
    this.slider = this.navEl.querySelector('#slider-nav')!
    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)
    app.appendChild(this.modalEl)
    this.pageLinks = Array.from(this.modalEl.querySelectorAll<HTMLAnchorElement>('[data-page-link]'))
    this._sliderComponent = UIkit.slider(this.slider)
    this._routeHandler = (event: Event) => {
      const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? 'home'
      this.updatePageActive(page)
    }
    window.addEventListener('jlz:route-change', this._routeHandler)
    this.updateActive()
    this.updatePageActive(document.body.dataset.page ?? 'home')
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

  dispose(): void {
    if (this._routeHandler) {
      window.removeEventListener('jlz:route-change', this._routeHandler)
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
