// UIMenu.ts — Simple centered UIKit slider nav.
//
// <header class="tm-header">
//   <div class="uk-navbar-container uk-navbar-transparent">
//     <div class="uk-container uk-container-expand">
//       <nav uk-navbar>
//         <div class="uk-navbar-center">
//           <div id="slider-nav" class="uk-slider" uk-slider="center: true">
//             <ul class="uk-slider-items uk-child-width-auto">
//               <li><a class="jlz-nav-link">Intro</a></li>

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

    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.style.display = 'none'

    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = `
      <div id="slider-nav" class="uk-slider-container uk-margin uk-slider" uk-slider="center: 1; active: first" role="region" aria-roledescription="carousel">
        <div class="uk-position-relative">
          <ul class="uk-slider-items uk-grid uk-grid-match uk-child-width-auto" aria-live="polite" role="presentation">
          </ul>
        </div>
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

    this.slider = this.navEl.querySelector('#slider-nav')!
    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)
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
