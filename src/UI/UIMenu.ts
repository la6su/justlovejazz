// UIMenu.ts — Modal navigation menu using UIkit modal component.
//
// A hamburger button (fixed top-right) opens a UIkit modal (`uk-modal`)
// with a list of all sections. Clicking a section navigates to it (via
// SwipeNav.goToSection) and closes the modal.
//
// Uses UIkit's modal component (UIkit.modal) for show/hide/focus-trap/esc
// behavior — no custom overlay code, no custom CSS for the dialog shell.
// Only the hamburger button + section links have bespoke Less styles.
//
// The menu is the SOLE entry point for jump navigation — the SwipeNav
// itself is a one-section-at-a-time swiper (drag 0→100% to move to a
// neighbor), while the menu lets the user leap to a specific section.

import UIkit from 'uikit'

export interface UIMenuOptions {
  sectionLabels: string[]
  sectionSubtitles?: string[]
}

export class UIMenu {
  /** Public so Experience can place it in #jlz-dock. */
  public button: HTMLButtonElement
  private modalEl: HTMLDivElement
  private links: HTMLButtonElement[] = []
  private _activeIndex = 0
  private _onNavigate: ((index: number) => void) | null = null
  private _sectionLabels: string[]
  private _sectionSubtitles: string[]

  constructor(opts: UIMenuOptions) {
    this._sectionLabels = opts.sectionLabels
    this._sectionSubtitles = opts.sectionSubtitles ?? []

    // ── Hamburger button (placed in the bottom dock by Experience) ──
    // No position:fixed — the button is appended to #jlz-dock so it sits
    // visually next to the SwipeNav track in a unified bottom bar.
    this.button = document.createElement('button')
    this.button.id = 'jlz-menu-toggle'
    this.button.className = 'jlz-menu-toggle uk-flex uk-flex-middle uk-flex-center'
    this.button.type = 'button'
    this.button.setAttribute('aria-label', 'Open navigation menu')
    this.button.setAttribute('uk-toggle', 'target: #jlz-menu-modal')
    this.button.innerHTML = this.hamburgerSvg()

    // ── UIkit modal markup ──
    // UIkit modal structure: <div id uk-modal> <div class="uk-modal-dialog"> ... </div> </div>
    // NOTE: do NOT add `uk-flex uk-flex-top` to the modal element className —
    // `uk-flex` sets `display:flex !important` which overrides `.uk-modal {
    // display:none }`, so the modal stays visible (blocking pointer events
    // across the whole viewport) even when closed. UIkit adds/removes
    // `uk-flex` dynamically on show/hide (see modal.js `show`/`hidden`
    // handlers). The dialog uses `uk-margin-auto-vertical` for centering,
    // which triggers UIkit to add `uk-flex` on the modal when it opens.
    this.modalEl = document.createElement('div')
    this.modalEl.id = 'jlz-menu-modal'
    this.modalEl.className = 'jlz-menu-modal uk-modal'
    this.modalEl.setAttribute('uk-modal', 'stack: true; bg-close: true; esc-close: true')

    const dialog = document.createElement('div')
    dialog.className =
      'jlz-menu-dialog uk-modal-dialog uk-modal-body uk-margin-auto-vertical'

    // Close button (UIkit close — top-right of dialog)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'jlz-menu-close uk-modal-close-outside uk-flex uk-flex-middle uk-flex-center'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', 'Close menu')
    closeBtn.innerHTML = this.closeSvg()
    dialog.appendChild(closeBtn)

    // Title
    const title = document.createElement('h2')
    title.className = 'jlz-menu-title uk-modal-title uk-margin-remove-bottom'
    title.textContent = 'Sections'
    dialog.appendChild(title)

    // Section links nav
    const nav = document.createElement('nav')
    nav.className = 'jlz-menu-nav uk-flex uk-flex-column uk-margin-top'

    this._sectionLabels.forEach((label, i) => {
      const link = document.createElement('button')
      link.type = 'button'
      link.className = 'jlz-menu-link uk-flex uk-flex-middle uk-width-1-1 uk-text-left'
      link.dataset.section = String(i)
      link.setAttribute('aria-label', `Go to section ${i + 1}: ${label}`)
      const num = String(i + 1).padStart(2, '0')
      const subtitle = this._sectionSubtitles[i] ?? ''
      link.innerHTML =
        `<span class="jlz-menu-link__num">${num}</span>` +
        `<span class="jlz-menu-link__body">` +
        `<span class="jlz-menu-link__label">${label}</span>` +
        (subtitle ? `<span class="jlz-menu-link__sub">${subtitle}</span>` : '') +
        `</span>`
      link.addEventListener('click', () => {
        this._onNavigate?.(i)
        // Hide the UIkit modal — UIkit handles the transition + focus restore
        UIkit.modal(this.modalEl).hide()
      })
      nav.appendChild(link)
      this.links.push(link)
    })

    dialog.appendChild(nav)
    this.modalEl.appendChild(dialog)

    // NOTE: the button is NOT appended to body here — Experience places it
    // into #jlz-dock so it sits next to the SwipeNav track. The modal is
    // appended to body (UIkit modal needs to be a direct child of body).
    document.body.appendChild(this.modalEl)

    // Initialize UIkit modal on the element (parses uk-modal attributes)
    UIkit.modal(this.modalEl)

    this.updateActive()
  }

  /** Set callback for section navigation. */
  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  /** Update which section is shown as active. */
  setActive(index: number): void {
    this._activeIndex = index
    this.updateActive()
  }

  private updateActive(): void {
    this.links.forEach((link, i) => {
      link.classList.toggle('is-active', i === this._activeIndex)
    })
  }

  private hamburgerSvg(): string {
    return (
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>'
    )
  }

  private closeSvg(): string {
    return (
      '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>'
    )
  }

  dispose(): void {
    UIkit.modal(this.modalEl).$destroy()
    this.button.remove()
    this.modalEl.remove()
  }
}
