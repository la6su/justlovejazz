// UIMenu.ts — UIKit slider nav in sticky header.
//
// Structure (per user request — UIKit3 components only):
//   <header class="tm-header">
//     <div uk-sticky="show-on-up; animation: uk-animation-slide-top">
//       <div class="uk-navbar-container uk-navbar-transparent">
//         <div class="uk-container uk-container-xlarge">
//           <nav class="uk-navbar" uk-navbar>
//             <div class="uk-navbar-left uk-width-1-1">
//               <div id="slider-nav" class="uk-slider" uk-slider="center: true; active: first">
//                 <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto">
//                   <li class="jlz-nav-item"><a class="jlz-nav-link">Intro</a></li>
//                   ...
//
// Slider provides infinite scroll on mobile (swipe through sections).
// 6 MAIN sections only (no Lab/Process).
// Active slide syncs with JoystickNav.

import UIkit from 'uikit'

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

const MAIN_SECTION_INDICES = [1, 2, 3, 4, 5, 6]

export class UIMenu {
  public button: HTMLButtonElement
  private navEl: HTMLElement
  private slider: HTMLElement
  private items: HTMLElement[] = []
  private _activeIndex = 1
  private _onNavigate: ((index: number) => void) | null = null
  private _sliderComponent: { show: (idx: number) => void } | null = null

  constructor(opts: UIMenuOptions) {
    const labels = opts.sectionLabels

    // Dummy button (hidden — nav is always visible)
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle'
    this.button.style.display = 'none'

    // ── UIKit header with sticky + navbar + slider ──
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = `
      <div uk-sticky="show-on-up: true; animation: uk-animation-slide-top; cls-active: uk-navbar-sticky" class="uk-sticky">
        <div class="uk-navbar-container uk-navbar-transparent jlz-navbar">
          <div class="uk-container uk-container-xlarge">
            <nav class="uk-navbar" uk-navbar>
              <div class="uk-navbar-center uk-width-1-1">
                <div id="slider-nav" class="uk-slider-container uk-margin uk-slider" uk-slider="center: true; active: first" role="region" aria-roledescription="carousel">
                  <div class="uk-position-relative">
                    <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto" aria-live="polite" role="presentation">
                    </ul>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    `

    // Build slider items
    const ul = this.navEl.querySelector('.uk-slider-items')!
    MAIN_SECTION_INDICES.forEach((sectionIdx) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'group')
      li.setAttribute('aria-roledescription', 'slide')
      li.className = 'jlz-nav-item'

      const a = document.createElement('a')
      a.href = '#'
      a.className = 'uk-link-reset jlz-nav-link'
      a.textContent = labels[sectionIdx] ?? `Section ${sectionIdx}`
      a.setAttribute('aria-label', `Go to ${labels[sectionIdx]}`)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        this._onNavigate?.(sectionIdx)
      })

      li.appendChild(a)
      ul.appendChild(li)
      this.items.push(li)
    })

    this.slider = this.navEl.querySelector('#slider-nav')!

    // Append to body (before section-studio)
    document.body.insertBefore(this.navEl, document.body.firstChild)

    // Init UIKit slider
    this._sliderComponent = UIkit.slider(this.slider)

    this.updateActive()
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
    // Scroll slider to active item
    if (mainIdx >= 0 && this._sliderComponent) {
      this._sliderComponent.show(mainIdx)
    }
  }

  dispose(): void {
    try { UIkit.slider(this.slider).$destroy() } catch { /* ignore */ }
    this.button.remove()
    this.navEl.remove()
  }
}
