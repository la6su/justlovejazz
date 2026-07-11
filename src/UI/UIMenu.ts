// UIMenu.ts — Header dropbar navbar (Balou-inspired, tech-savvy, minimal).
//
// Layout (full-width, fixed top):
//   [l@6]  Studio  Services  Manifesto  Blog  Contact        [theme]
//          └─ dropbar (full-width stretch on hover) shows page sections
//
// Dropbar behavior: UIKit uk-drop with stretch:x — full-width panel slides
// down on hover/focus, showing the sections of that page. Clicking a section:
//   - current page → calls _onNavigate(idx) (joystick cube-face jump)
//   - other page → navigates to page URL (section deep-link via hash)

import { themeManager } from '../core/ThemeManager'

export interface UIMenuOptions {
  sectionLabels: string[]
}

// Page → sections shown in its dropbar (idx = cube-face index on that page)
// Balou-inspired: each section has a title + subtitle (short descriptor).
interface DropSection {
  num: string
  title: string
  subtitle: string
  idx: number
}
interface NavItem {
  label: string
  href: string
  page: string
  sections?: DropSection[]
  /** Featured block — promotional CTA in the dropbar (Balou pattern). */
  featured?: { title: string; subtitle: string; href: string }
}
interface ContactLink {
  label: string
  href: string
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Studio',
    href: '/app',
    page: 'home',
    sections: [
      { num: '01', title: 'Studio', subtitle: 'Remote · EU · since 2019', idx: 1 },
      { num: '02', title: 'Works', subtitle: 'Selected projects', idx: 2 },
      { num: '03', title: 'Services', subtitle: 'Strategy to implementation', idx: 3 },
      { num: '04', title: 'Manifesto', subtitle: 'What guides us', idx: 4 },
    ],
    featured: { title: 'Lab', subtitle: 'Experiments · always in progress', href: '/app' },
  },
  {
    label: 'Services',
    href: '/app/services',
    page: 'services',
    sections: [
      { num: '01', title: 'Creative Direction', subtitle: 'Concept → visual identity', idx: 1 },
      { num: '02', title: 'Interactive Development', subtitle: 'Realtime · performance-first', idx: 2 },
      { num: '03', title: 'Motion & Realtime', subtitle: 'Motion as interface', idx: 3 },
      { num: '04', title: 'AI Systems', subtitle: 'Generation · automation', idx: 4 },
    ],
    featured: { title: 'Start a project', subtitle: 'Open for new work', href: 'mailto:hello@justlovejazz.com?subject=New%20project' },
  },
  {
    label: 'Manifesto',
    href: '/app/manifesto',
    page: 'manifesto',
    sections: [
      { num: '01', title: 'Purpose', subtitle: 'We don\'t build what everyone builds', idx: 1 },
      { num: '02', title: 'Clarity', subtitle: 'Clean structure · no noise', idx: 2 },
      { num: '03', title: 'Emotion', subtitle: 'Motion, light, sound', idx: 3 },
      { num: '04', title: 'Simplicity', subtitle: 'Minimalism, not emptiness', idx: 4 },
    ],
    featured: { title: 'Process', subtitle: 'Explore · prototype · test · fail · improve', href: '/app/services' },
  },
  { label: 'Blog', href: '/blog', page: 'blog' },
  {
    label: 'Contact',
    href: 'mailto:hello@justlovejazz.com',
    page: 'contact',
  },
]

const CONTACT_LINKS: ContactLink[] = [
  { label: 'Email', href: 'mailto:hello@justlovejazz.com' },
  { label: 'Telegram', href: 'https://t.me/justlovejazz', external: true },
  { label: 'GitHub', href: 'https://github.com/la6su', external: true },
]

export class UIMenu {
  private navEl: HTMLElement
  private navLinks: HTMLAnchorElement[] = []
  private _onNavigate: ((index: number) => void) | null = null
  private _routeHandler: ((event: Event) => void) | null = null
  private _themeHandler: ((event: Event) => void) | null = null
  private _themeBtn: HTMLButtonElement | null = null

  constructor(_opts: UIMenuOptions) {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this.navLinks = Array.from(this.navEl.querySelectorAll<HTMLAnchorElement>('[data-nav-item]'))
    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')

    // Wire section clicks (current page → goToSection, other page → navigate)
    this.navEl.querySelectorAll<HTMLAnchorElement>('[data-section-idx]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const targetPage = a.dataset.page ?? 'home'
        const idx = Number(a.dataset.sectionIdx)
        const currentPage = document.body.dataset.page ?? 'home'
        if (targetPage === currentPage && idx >= 0) {
          e.preventDefault()
          this._onNavigate?.(idx)
          // Close any open dropbar
          this.navEl.querySelectorAll('.uk-open').forEach((el) => el.classList.remove('uk-open', 'uk-drop-open'))
        }
        // else: let the default href navigation proceed
      })
    })

    // Theme toggle
    this._themeBtn?.addEventListener('click', () => themeManager.toggle())

    this._routeHandler = (event: Event) => {
      const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? 'home'
      this.updatePageActive(page)
    }
    window.addEventListener('jlz:route-change', this._routeHandler)

    this._themeHandler = () => this.updateThemeLabel()
    window.addEventListener('jlz:theme-change', this._themeHandler)

    this.updatePageActive(document.body.dataset.page ?? 'home')
    this.updateThemeLabel()
  }

  /** Build the navbar HTML with dropbars. */
  private buildNavbar(): string {
    const navItemsHtml = NAV_ITEMS.map((item) => {
      // Contact item — special dropbar with contact links (not sections)
      if (item.label === 'Contact') {
        return `
          <li>
            <a href="${item.href}" data-nav-item="${item.page}">${item.label}</a>
            <div class="uk-dropbar uk-dropbar-top" uk-drop="stretch: x; offset: 0; mode: hover; animation: uk-animation-slide-top">
              <div class="uk-container uk-container-expand">
                <ul class="uk-nav uk-navbar-dropdown-nav uk-flex uk-flex-center uk-flex-wrap jlz-dropbar-contact">
                  ${CONTACT_LINKS.map((c) => `
                    <li><a href="${c.href}"${c.external ? ' target="_blank" rel="noopener"' : ''}>${c.label}</a></li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </li>
        `
      }
      // Items with section dropbars — Balou-style 2-column: sections + featured
      if (item.sections) {
        return `
          <li>
            <a href="${item.href}" data-nav-item="${item.page}">${item.label}</a>
            <div class="uk-dropbar uk-dropbar-top" uk-drop="stretch: x; offset: 0; mode: hover; animation: uk-animation-slide-top">
              <div class="uk-container uk-container-expand">
                <div class="uk-grid jlz-dropbar-grid" uk-grid>
                  <!-- Left: sections list (title + subtitle) -->
                  <div class="uk-width-2-3@m">
                    <ul class="uk-nav jlz-dropbar-sections">
                      ${item.sections.map((s) => `
                        <li>
                          <a href="${item.href}#sec-${s.idx}" data-section-idx="${s.idx}" data-page="${item.page}">
                            <span class="jlz-dropbar__num">${s.num}</span>
                            <span class="jlz-dropbar__title">${s.title}</span>
                            <span class="jlz-dropbar__subtitle">${s.subtitle}</span>
                          </a>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                  <!-- Right: featured CTA (Balou pattern) -->
                  ${item.featured ? `
                    <div class="uk-width-1-3@m">
                      <a href="${item.featured.href}" class="jlz-dropbar-featured">
                        <span class="jlz-dropbar-featured__label">Featured</span>
                        <span class="jlz-dropbar-featured__title">${item.featured.title}</span>
                        <span class="jlz-dropbar-featured__subtitle">${item.featured.subtitle}</span>
                        <span class="jlz-dropbar-featured__arrow" aria-hidden="true">→</span>
                      </a>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </li>
        `
      }
      // Simple link (Blog)
      return `<li><a href="${item.href}" data-nav-item="${item.page}">${item.label}</a></li>`
    }).join('')

    return `
      <nav class="uk-navbar-container uk-navbar-transparent" uk-navbar>
        <div class="uk-container uk-container-expand uk-flex uk-flex-between uk-flex-middle">
          <div class="uk-navbar-left">
            <a class="uk-navbar-item uk-logo jlz-brand" href="/app" aria-label="JUSTLOVEJAZZ home">l@6</a>
          </div>
          <div class="uk-navbar-center uk-visible@s">
            <ul class="uk-navbar-nav jlz-navbar-nav">
              ${navItemsHtml}
            </ul>
          </div>
          <div class="uk-navbar-right">
            <button class="jlz-theme-btn" type="button" id="jlz-theme-toggle" aria-pressed="false" aria-label="Toggle theme">
              <span uk-icon="icon: paint-bucket; ratio: 0.8" aria-hidden="true"></span>
            </button>
            <button class="jlz-menu-btn uk-hidden@s" type="button" uk-toggle="target: #jlz-mobile-nav" aria-label="Open menu">
              <span uk-icon="icon: menu; ratio: 1.1" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </nav>
      <!-- Mobile nav (off-canvas, shown on <640px) -->
      <div id="jlz-mobile-nav" uk-offcanvas="flip: true; overlay: true">
        <div class="uk-offcanvas-bar">
          <button class="uk-offcanvas-close" type="button" uk-close aria-label="Close menu"></button>
          <ul class="uk-nav uk-nav-default jlz-mobile-nav">
            ${NAV_ITEMS.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('')}
            <li class="uk-nav-divider"></li>
            ${CONTACT_LINKS.map((c) => `<li><a href="${c.href}"${c.external ? ' target="_blank" rel="noopener"' : ''}>${c.label}</a></li>`).join('')}
          </ul>
          <button class="uk-button uk-button-default uk-button-small uk-margin-top" type="button" id="jlz-mobile-theme" aria-pressed="false">
            <span uk-icon="icon: paint-bucket; ratio: 0.8" aria-hidden="true"></span>
            <span class="uk-margin-small-left" id="jlz-mobile-theme-label">Auto</span>
          </button>
        </div>
      </div>
    `
  }

  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  setActive(_index: number): void {
    // Kept for Experience.ts API compat — dropbar nav doesn't track active
    // section the same way the slider did (each page's sections are in its
    // own dropbar, not a shared slider).
  }

  private updatePageActive(page: string): void {
    this.navLinks.forEach((link) => {
      const linkPage = link.dataset.navItem ?? ''
      link.parentElement?.classList.toggle('uk-active', linkPage === page)
    })
  }

  private updateThemeLabel(): void {
    const pressed = themeManager.isInverse
    this._themeBtn?.setAttribute('aria-pressed', String(pressed))
    this._themeBtn?.classList.toggle('jlz-theme-btn--active', pressed)
    const mobileBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-mobile-theme')
    const mobileLabel = this.navEl.querySelector<HTMLElement>('#jlz-mobile-theme-label')
    if (mobileBtn) mobileBtn.setAttribute('aria-pressed', String(pressed))
    if (mobileLabel) mobileLabel.textContent = pressed ? 'Inverse' : 'Auto'
  }

  dispose(): void {
    if (this._routeHandler) {
      window.removeEventListener('jlz:route-change', this._routeHandler)
    }
    if (this._themeHandler) {
      window.removeEventListener('jlz:theme-change', this._themeHandler)
    }
    this.navEl.remove()
  }
}
