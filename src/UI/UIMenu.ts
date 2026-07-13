// UIMenu.ts — Header navbar with logo, language switch, sound toggle.
//
// Layout (full-width, fixed top):
//   [l@6]  Studio  Services  Works  Manifesto  Lab  Contact   [EN] [🔊] [theme]
//
// Phase 6: logo left, nav center-left, controls right (lang + sound + theme).
// Dropbar: works page shows project cover thumbnails; others show num+title.

import { themeManager } from '../core/ThemeManager'
import { toggleLang, getLang } from '../core/i18n'
import { PROJECTS } from '../Data/Projects'

interface DropSection {
  num: string
  title: string
  subtitle: string
  idx: number
  titleKey?: string
  subtitleKey?: string
  /** Optional cover image URL for dropbar preview (works page). */
  cover?: string
}
interface NavItem {
  label: string
  labelKey: string
  href: string
  page: string
  sections?: DropSection[]
  featured?: { title: string; subtitle: string; href: string; titleKey?: string; subtitleKey?: string }
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Studio',
    labelKey: 'nav.studio',
    href: '/',
    page: 'home',
    sections: [
      { num: '01', title: 'Studio', subtitle: 'Remote · EU · since 2019', idx: 1, titleKey: 'dropbar.home.s1.title', subtitleKey: 'dropbar.home.s1.subtitle' },
      { num: '02', title: 'Services', subtitle: 'Strategy to implementation', idx: 2, titleKey: 'dropbar.home.s2.title', subtitleKey: 'dropbar.home.s2.subtitle' },
      { num: '03', title: 'Works', subtitle: 'Selected projects · gallery', idx: 3, titleKey: 'dropbar.home.s3.title', subtitleKey: 'dropbar.home.s3.subtitle' },
      { num: '04', title: 'Manifesto', subtitle: 'What guides us', idx: 4, titleKey: 'dropbar.home.s4.title', subtitleKey: 'dropbar.home.s4.subtitle' },
    ],
    featured: { title: 'Lab', subtitle: 'Experiments · always in progress', href: '/lab', titleKey: 'dropbar.home.featured.title', subtitleKey: 'dropbar.home.featured.subtitle' },
  },
  {
    label: 'Services',
    labelKey: 'nav.services',
    href: '/services',
    page: 'services',
    sections: [
      { num: '01', title: 'Creative Direction', subtitle: 'Concept → visual identity', idx: 1, titleKey: 'dropbar.services.s1.title', subtitleKey: 'dropbar.services.s1.subtitle' },
      { num: '02', title: 'Interactive Development', subtitle: 'Realtime · performance-first', idx: 2, titleKey: 'dropbar.services.s2.title', subtitleKey: 'dropbar.services.s2.subtitle' },
      { num: '03', title: 'Motion & Realtime', subtitle: 'Motion as interface', idx: 3, titleKey: 'dropbar.services.s3.title', subtitleKey: 'dropbar.services.s3.subtitle' },
      { num: '04', title: 'AI Systems', subtitle: 'Generation · automation', idx: 4, titleKey: 'dropbar.services.s4.title', subtitleKey: 'dropbar.services.s4.subtitle' },
    ],
    featured: { title: 'Start a project', subtitle: 'Open for new work', href: '/contact', titleKey: 'dropbar.services.featured.title', subtitleKey: 'dropbar.services.featured.subtitle' },
  },
  {
    label: 'Works',
    labelKey: 'nav.works',
    href: '/works',
    page: 'works',
    sections: [
      // Phase 6: works dropbar shows project cover thumbnails
      { num: '01', title: 'Undercurrent', subtitle: 'WebGPU fluid simulation', idx: 1, subtitleKey: 'dropbar.works.s1.subtitle', cover: PROJECTS[0]?.textureUrl },
      { num: '02', title: 'Mono Sunday', subtitle: 'Minimal portfolio', idx: 2, subtitleKey: 'dropbar.works.s2.subtitle', cover: PROJECTS[1]?.textureUrl },
      { num: '03', title: 'Till at Night', subtitle: 'Audio-reactive 3D', idx: 3, subtitleKey: 'dropbar.works.s3.subtitle', cover: PROJECTS[2]?.textureUrl },
      { num: '04', title: 'Ebb Vibes', subtitle: 'Generative typography', idx: 4, subtitleKey: 'dropbar.works.s4.subtitle', cover: PROJECTS[3]?.textureUrl },
    ],
    featured: { title: 'Blog', subtitle: 'Process notes + case studies', href: '/blog', titleKey: 'dropbar.works.featured.title', subtitleKey: 'dropbar.works.featured.subtitle' },
  },
  {
    label: 'Manifesto',
    labelKey: 'nav.manifesto',
    href: '/manifesto',
    page: 'manifesto',
    sections: [
      { num: '01', title: 'Purpose', subtitle: 'We don\'t build what everyone builds', idx: 1, titleKey: 'dropbar.manifesto.s1.title', subtitleKey: 'dropbar.manifesto.s1.subtitle' },
      { num: '02', title: 'Clarity', subtitle: 'Clean structure · no noise', idx: 2, titleKey: 'dropbar.manifesto.s2.title', subtitleKey: 'dropbar.manifesto.s2.subtitle' },
      { num: '03', title: 'Emotion', subtitle: 'Motion, light, sound', idx: 3, titleKey: 'dropbar.manifesto.s3.title', subtitleKey: 'dropbar.manifesto.s3.subtitle' },
      { num: '04', title: 'Simplicity', subtitle: 'Minimalism, not emptiness', idx: 4, titleKey: 'dropbar.manifesto.s4.title', subtitleKey: 'dropbar.manifesto.s4.subtitle' },
    ],
    featured: { title: 'Process', subtitle: 'Explore · prototype · test · fail · improve', href: '/services', titleKey: 'dropbar.manifesto.featured.title', subtitleKey: 'dropbar.manifesto.featured.subtitle' },
  },
  {
    label: 'Lab',
    labelKey: 'nav.lab',
    href: '/lab',
    page: 'lab',
    sections: [
      { num: '01', title: 'Shader Lab', subtitle: 'GLSL & TSL fragments', idx: 1, titleKey: 'dropbar.lab.s1.title', subtitleKey: 'dropbar.lab.s1.subtitle' },
      { num: '02', title: 'Audio Reactive', subtitle: 'Web Audio → visuals', idx: 2, titleKey: 'dropbar.lab.s2.title', subtitleKey: 'dropbar.lab.s2.subtitle' },
      { num: '03', title: 'Generative', subtitle: 'Procedural worlds', idx: 3, titleKey: 'dropbar.lab.s3.title', subtitleKey: 'dropbar.lab.s3.subtitle' },
      { num: '04', title: 'GPU Particles', subtitle: '10k instanced points', idx: 4, titleKey: 'dropbar.lab.s4.title', subtitleKey: 'dropbar.lab.s4.subtitle' },
    ],
    featured: { title: 'Open source', subtitle: 'GitHub · experiments + demos', href: 'https://github.com/la6su', titleKey: 'dropbar.lab.featured.title', subtitleKey: 'dropbar.lab.featured.subtitle' },
  },
  {
    label: 'Contact',
    labelKey: 'nav.contact',
    href: '/contact',
    page: 'contact',
    sections: [
      { num: '01', title: 'Email', subtitle: 'Direct line', idx: 1, titleKey: 'dropbar.contact.s1.title', subtitleKey: 'dropbar.contact.s1.subtitle' },
      { num: '02', title: 'Social', subtitle: 'Telegram + GitHub', idx: 2, titleKey: 'dropbar.contact.s2.title', subtitleKey: 'dropbar.contact.s2.subtitle' },
      { num: '03', title: 'Location', subtitle: 'Remote · EU', idx: 3, titleKey: 'dropbar.contact.s3.title', subtitleKey: 'dropbar.contact.s3.subtitle' },
      { num: '04', title: 'Form', subtitle: 'Tell us about your project', idx: 4, titleKey: 'dropbar.contact.s4.title', subtitleKey: 'dropbar.contact.s4.subtitle' },
    ],
    featured: { title: 'Start a project', subtitle: 'Open for new work', href: 'mailto:hello@justlovejazz.com?subject=New%20project', titleKey: 'dropbar.contact.featured.title', subtitleKey: 'dropbar.contact.featured.subtitle' },
  },
]

export class UIMenu {
  private navEl: HTMLElement
  private navLinks: HTMLAnchorElement[] = []
  private _onNavigate: ((index: number) => void) | null = null
  private _routeHandler: ((event: Event) => void) | null = null
  private _themeHandler: ((event: Event) => void) | null = null
  private _langHandler: ((event: Event) => void) | null = null
  private _themeBtn: HTMLButtonElement | null = null
  private _langBtn: HTMLButtonElement | null = null
  private _soundBtn: HTMLButtonElement | null = null

  constructor() {
    this.navEl = document.createElement('header')
    this.navEl.className = 'tm-header'
    this.navEl.innerHTML = this.buildNavbar()

    const app = document.getElementById('app') ?? document.body
    app.appendChild(this.navEl)

    this.navLinks = Array.from(this.navEl.querySelectorAll<HTMLAnchorElement>('[data-nav-item]'))
    this._themeBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-theme-toggle')
    this._langBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-lang-toggle')
    this._soundBtn = this.navEl.querySelector<HTMLButtonElement>('#jlz-navbar-sound')

    // Wire section clicks
    this.navEl.querySelectorAll<HTMLAnchorElement>('[data-section-idx]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const targetPage = a.dataset.page ?? 'home'
        const idx = Number(a.dataset.sectionIdx)
        const currentPage = document.body.dataset.page ?? 'home'
        if (targetPage === currentPage && idx >= 0) {
          e.preventDefault()
          this._onNavigate?.(idx)
          this.navEl.querySelectorAll('.uk-open').forEach((el) => el.classList.remove('uk-open', 'uk-drop-open'))
        }
      })
    })

    // Theme toggle
    this._themeBtn?.addEventListener('click', () => themeManager.toggle())

    // Phase 6: Language toggle
    this._langBtn?.addEventListener('click', () => toggleLang())

    // Phase 6: Sound toggle (syncs with SoundPanel via jlz:sound-toggle event)
    let soundMuted = true // default off
    this._soundBtn?.addEventListener('click', () => {
      soundMuted = !soundMuted
      this.updateSoundLabel(soundMuted)
      window.dispatchEvent(new CustomEvent('jlz:sound-toggle', { detail: { muted: soundMuted } }))
    })

    this._routeHandler = (event: Event) => {
      const page = (event as CustomEvent<{ page?: string }>).detail?.page ?? 'home'
      this.updatePageActive(page)
    }
    window.addEventListener('jlz:route-change', this._routeHandler)

    this._themeHandler = () => this.updateThemeLabel()
    window.addEventListener('jlz:theme-change', this._themeHandler)

    // Phase 6: update lang label on language change
    this._langHandler = () => this.updateLangLabel()
    window.addEventListener('jlz:lang-change', this._langHandler)

    // Phase 6: listen for external sound toggles (from SoundPanel)
    window.addEventListener('jlz:sound-toggle', (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail
      if (detail) {
        soundMuted = detail.muted
        this.updateSoundLabel(soundMuted)
      }
    })

    this.updatePageActive(document.body.dataset.page ?? 'home')
    this.updateThemeLabel()
    this.updateLangLabel()
    this.updateSoundLabel(soundMuted)
  }

  /** Build the navbar HTML — logo left, nav center, controls right. */
  private buildNavbar(): string {
    return `
      <nav class="uk-navbar-container uk-navbar-transparent jlz-navbar" uk-navbar>
        <div class="uk-container uk-container-expand">
          <!-- Left: Logo -->
          <div class="uk-navbar-left">
            <a href="/" class="jlz-navbar-logo uk-navbar-item" aria-label="JUSTLOVEJAZZ home">
              <span class="jlz-logo-text">l@6</span>
            </a>
          </div>
          <!-- Center: Nav items -->
          <div class="uk-navbar-center jlz-navbar-nav-wrap">
            <ul class="uk-navbar-nav jlz-navbar-nav">
              ${this.renderNavItems(NAV_ITEMS)}
            </ul>
          </div>
          <!-- Right: Controls (lang + sound + theme) -->
          <div class="uk-navbar-right jlz-navbar-controls">
            <button class="jlz-navbar-btn jlz-lang-toggle" type="button" id="jlz-lang-toggle" aria-label="Switch language">
              <span class="jlz-lang-label">EN</span>
            </button>
            <button class="jlz-navbar-btn jlz-sound-toggle" type="button" id="jlz-navbar-sound" aria-label="Toggle sound" aria-pressed="true">
              <span uk-icon="icon: muted; ratio: 0.9" aria-hidden="true"></span>
            </button>
            <button class="jlz-navbar-btn jlz-theme-toggle" type="button" id="jlz-theme-toggle" aria-pressed="false" aria-label="Toggle theme">
              <span uk-icon="icon: paint-bucket; ratio: 0.9" aria-hidden="true"></span>
            </button>
            <!-- Mobile hamburger -->
            <button class="jlz-navbar-btn jlz-mobile-toggle" type="button" uk-toggle="target: #jlz-mobile-menu" aria-label="Menu">
              <span uk-icon="icon: menu; ratio: 1.1" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </nav>
      <!-- Mobile offcanvas menu -->
      <div id="jlz-mobile-menu" uk-offcanvas="overlay: true; mode: slide">
        <div class="uk-offcanvas-bar jlz-mobile-menu-bar">
          <button class="uk-offcanvas-close" type="button" uk-close></button>
          <ul class="uk-nav uk-nav-default jlz-mobile-nav">
            ${NAV_ITEMS.map(item => `<li><a href="${item.href}" data-i18n="${item.labelKey}">${item.label}</a></li>`).join('')}
          </ul>
          <div class="jlz-mobile-controls">
            <button class="jlz-navbar-btn" type="button" id="jlz-mobile-lang" aria-label="Language">
              <span class="jlz-lang-label">${getLang()}</span>
            </button>
            <button class="jlz-navbar-btn" type="button" id="jlz-mobile-theme" aria-pressed="false" aria-label="Theme">
              <span id="jlz-mobile-theme-label">Auto</span>
            </button>
          </div>
        </div>
      </div>
    `
  }

  /** Render nav items with dropbars. Works page shows cover thumbnails. */
  private renderNavItems(items: NavItem[]): string {
    return items.map((item) => {
      if (item.sections) {
        const hasCovers = item.sections.some(s => s.cover)
        return `
          <li>
            <a href="${item.href}" data-nav-item="${item.page}" data-i18n="${item.labelKey}">${item.label}</a>
            <div class="uk-navbar-dropdown jlz-navbar-dropdown--wide ${hasCovers ? 'jlz-dropbar--covers' : ''}" uk-drop="mode: hover; animation: uk-animation-slide-top; offset: 0">
              <div class="uk-grid jlz-dropbar-grid uk-grid-small" uk-grid>
                <div class="uk-width-expand">
                  <ul class="uk-nav uk-navbar-dropdown-nav jlz-dropbar-sections ${hasCovers ? 'jlz-dropbar-sections--covers' : ''}">
                    ${item.sections.map((s) => `
                      <li>
                        <a href="${item.href}#sec-${s.idx}" data-section-idx="${s.idx}" data-page="${item.page}">
                          ${s.cover ? `<span class="jlz-dropbar__cover" style="background-image: url('${s.cover}')"></span>` : ''}
                          <span class="jlz-dropbar__num">${s.num}</span>
                          <span class="jlz-dropbar__title"${s.titleKey ? ` data-i18n="${s.titleKey}"` : ''}>${s.title}</span>
                          <span class="jlz-dropbar__subtitle"${s.subtitleKey ? ` data-i18n="${s.subtitleKey}"` : ''}>${s.subtitle}</span>
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>
                ${item.featured ? `
                  <div class="uk-width-1-3 jlz-dropbar-featured-col">
                    <a href="${item.featured.href}" class="jlz-dropbar-featured">
                      <span class="jlz-dropbar-featured__title"${item.featured.titleKey ? ` data-i18n="${item.featured.titleKey}"` : ''}>${item.featured.title}</span>
                      <span class="jlz-dropbar-featured__subtitle"${item.featured.subtitleKey ? ` data-i18n="${item.featured.subtitleKey}"` : ''}>${item.featured.subtitle}</span>
                      <span class="jlz-dropbar-featured__arrow" aria-hidden="true">→</span>
                    </a>
                  </div>
                ` : ''}
              </div>
            </div>
          </li>
        `
      }
      return `<li><a href="${item.href}" data-nav-item="${item.page}" data-i18n="${item.labelKey}">${item.label}</a></li>`
    }).join('')
  }

  onNavigate(cb: (index: number) => void): void {
    this._onNavigate = cb
  }

  setActive(_index: number): void { /* API compat */ }

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

  /** Phase 6: update language label (EN/RU). */
  private updateLangLabel(): void {
    const lang = getLang()
    this._langBtn?.querySelector('.jlz-lang-label')?.setAttribute('data-lang', lang)
    if (this._langBtn) {
      const label = this._langBtn.querySelector('.jlz-lang-label')
      if (label) label.textContent = lang
    }
    const mobileLang = this.navEl.querySelector<HTMLElement>('#jlz-mobile-lang .jlz-lang-label')
    if (mobileLang) mobileLang.textContent = lang
  }

  /** Phase 6: update sound button label. */
  private updateSoundLabel(muted: boolean): void {
    this._soundBtn?.setAttribute('aria-pressed', String(muted))
    const icon = this._soundBtn?.querySelector('[uk-icon]')
    icon?.setAttribute('uk-icon', `icon: ${muted ? 'muted' : 'sound'}; ratio: 0.9`)
  }

  dispose(): void {
    if (this._routeHandler) window.removeEventListener('jlz:route-change', this._routeHandler)
    if (this._themeHandler) window.removeEventListener('jlz:theme-change', this._themeHandler)
    if (this._langHandler) window.removeEventListener('jlz:lang-change', this._langHandler)
    this.navEl.remove()
  }
}
