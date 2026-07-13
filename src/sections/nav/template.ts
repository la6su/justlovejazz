// src/sections/nav/template.ts — Menu section (section 5, joystick right)
//
// UNIQUE template — does NOT use sectionShell(). VOSK-inspired 2-column grid.
// This is a FULL SECTION (not an overlay): hidden by default via
// section[data-section] { display: none }, shown via .section-active.
// Same visibility pattern as Lab (section 0) and all main sections.
//
// Joystick right OR hamburger click → JoystickNav switches to section 5.
// Hamburger X click OR joystick left → returns to previous main section.
// Menu section is SHARED across all pages (same as Lab section 0).
//
// Nav item click behavior:
//   - Desktop (≥640px): dropdown panel appears to the RIGHT of nav list,
//     showing subsections. Click subsection → navigate to that section.
//   - Mobile (<640px): accordion unfold — subsections appear INLINE below
//     the nav item. Click subsection → navigate.
//   - Only ONE nav item expanded at a time (clicking another closes the first).
//
// Visibility:
//   - Hidden by default (section[data-section] { display: none }).
//   - Shown when .section-active is added (joystick right / hamburger click).
//   - backdrop-filter: blur(20px) on overlay for glass-morphism separation
//     from the 3D canvas behind.
//
// Exit (close menu):
//   - Hamburger X click → jlz:close-nav → return to previous main section.
//   - Joystick arrow left → same behavior.
//   - Subsection click → navigate to target section (menu auto-closes).

// (themeManager + getLang imports removed — UIMenu.ts owns all config controls now.)

// ── Navigation items with subsections ──
interface SubSection {
  num: string
  title: string
  titleKey: string
  href: string
}

interface NavItem {
  num: string
  label: string
  labelKey: string
  href: string
  subs: SubSection[]
}

const NAV_ITEMS: NavItem[] = [
  {
    num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      { num: '04', title: 'Manifesto', titleKey: 'dropbar.home.s4.title', href: '/#section-contact' },
    ],
  },
  {
    num: '02', label: 'Services', labelKey: 'nav.services', href: '/services',
    subs: [
      { num: '01', title: 'Creative Direction', titleKey: 'dropbar.services.s1.title', href: '/services#section-services-01' },
      { num: '02', title: 'Interactive Development', titleKey: 'dropbar.services.s2.title', href: '/services#section-services-02' },
      { num: '03', title: 'Motion & Realtime', titleKey: 'dropbar.services.s3.title', href: '/services#section-services-03' },
      { num: '04', title: 'AI Systems', titleKey: 'dropbar.services.s4.title', href: '/services#section-services-04' },
    ],
  },
  {
    num: '03', label: 'Works', labelKey: 'nav.works', href: '/works',
    subs: [
      { num: '01', title: 'Selected Works', titleKey: 'works.section1.title', href: '/works#section-works-01' },
      { num: '02', title: 'Case Studies', titleKey: 'works.section2.title', href: '/works#section-works-02' },
      { num: '03', title: 'Experiments', titleKey: 'works.section3.title', href: '/works#section-works-03' },
      { num: '04', title: 'Recent', titleKey: 'works.section4.title', href: '/works#section-works-04' },
    ],
  },
  {
    num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto',
    subs: [
      { num: '01', title: 'Purpose', titleKey: 'dropbar.manifesto.s1.title', href: '/manifesto#section-manifesto-01' },
      { num: '02', title: 'Clarity', titleKey: 'dropbar.manifesto.s2.title', href: '/manifesto#section-manifesto-02' },
      { num: '03', title: 'Emotion', titleKey: 'dropbar.manifesto.s3.title', href: '/manifesto#section-manifesto-03' },
      { num: '04', title: 'Simplicity', titleKey: 'dropbar.manifesto.s4.title', href: '/manifesto#section-manifesto-04' },
    ],
  },
  {
    num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab',
    subs: [
      { num: '01', title: 'Shader Lab', titleKey: 'dropbar.lab.s1.title', href: '/lab#section-lab-01' },
      { num: '02', title: 'Audio Reactive', titleKey: 'dropbar.lab.s2.title', href: '/lab#section-lab-02' },
      { num: '03', title: 'Generative', titleKey: 'dropbar.lab.s3.title', href: '/lab#section-lab-03' },
      { num: '04', title: 'GPU Particles', titleKey: 'dropbar.lab.s4.title', href: '/lab#section-lab-04' },
    ],
  },
  {
    num: '06', label: 'Contact', labelKey: 'nav.contact', href: '/contact',
    subs: [
      { num: '01', title: 'Email', titleKey: 'dropbar.contact.s1.title', href: '/contact#section-contact-01' },
      { num: '02', title: 'Social', titleKey: 'dropbar.contact.s2.title', href: '/contact#section-contact-02' },
      { num: '03', title: 'Location', titleKey: 'dropbar.contact.s3.title', href: '/contact#section-contact-03' },
      { num: '04', title: 'Form', titleKey: 'dropbar.contact.s4.title', href: '/contact#section-contact-04' },
    ],
  },
]

// (Inline SVG icons (SUN_SVG/MOON_SVG) + configToolbar removed —
//  controls moved to UIMenu.ts header help dropdown. Menu overlay is
//  navigation-only now.)

// ── Left column: stat / studio identity ──
function statColumn(): string {
  return `
    <div class="jlz-menu-col jlz-menu-col--stat">
      <div class="jlz-menu-stat">
        <span class="jlz-menu-stat__num">06</span>
        <span class="jlz-menu-stat__label" data-i18n="menu.stat.sections">SECTIONS</span>
      </div>
      <div class="jlz-menu-stat-meta">
        <span class="jlz-menu-eyebrow">EST 2019</span>
        <span class="jlz-menu-eyebrow">REMOTE · EU</span>
      </div>
    </div>
  `
}

// ── Center column: nav list with subsections ──
function navColumn(): string {
  const items = NAV_ITEMS.map((item) => `
    <li class="jlz-menu-nav__item" data-nav-item="${item.num}">
      <button class="jlz-menu-nav__toggle" type="button" aria-expanded="false" data-magnetic>
        <span class="jlz-menu-nav__num">${item.num}</span>
        <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
        <span class="jlz-menu-nav__arrow" aria-hidden="true">▸</span>
      </button>
      <ul class="jlz-menu-nav__subs">
        ${item.subs.map(sub => `
          <li class="jlz-menu-nav__sub-item">
            <a href="${sub.href}" class="jlz-menu-nav__sub-link" data-magnetic data-nav-href="${sub.href}">
              <span class="jlz-menu-nav__sub-num">${sub.num}</span>
              <span class="jlz-menu-nav__sub-title" data-i18n="${sub.titleKey}">${sub.title}</span>
              <span class="jlz-menu-nav__sub-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </li>
  `).join('')
  return `
    <div class="jlz-menu-col jlz-menu-col--nav">
      <span class="jlz-menu-col-title" data-i18n="menu.navigate">NAVIGATE</span>
      <ul class="jlz-menu-nav">${items}</ul>
    </div>
  `
}

// (contactsColumn removed — contact info lives in the Contact page section,
//  not in the menu. Dropdown submenu expands into the free space.)

// ── Footer ──
function menuFooter(): string {
  return `
    <footer class="jlz-menu-footer">
      <span class="jlz-menu-footer__text">© 2026 JUSTLOVEJAZZ</span>
      <span class="jlz-menu-footer__sep" aria-hidden="true">·</span>
      <span class="jlz-menu-footer__text">WEBGPU · TSL · UIKIT</span>
    </footer>
  `
}

/**
 * Menu section — UNIQUE template (not sectionShell).
 *
 * This is a FULL SECTION (not an overlay). Visibility is controlled by the
 * same CSS as all other sections:
 *   - Hidden: section[data-section] { display: none } (home) / .jlz-page-section { display: none } (content)
 *   - Shown: .section-active { display: flex !important }
 *
 * Joystick right OR hamburger click → JoystickNav.goToSection(5) →
 * ContentReveal adds .section-active to [data-section="menu"].
 *
 * @param mode 'home' = data-section (3D cube face sync) | 'content' = data-page-section
 */
export function navOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const sectionAttr = mode === 'home' ? 'data-section="menu"' : 'data-page-section="page-menu"'
  return `
    <section class="jlz-menu-overlay uk-section uk-section-xsmall" id="section-menu" ${sectionAttr}>
      <div class="uk-container uk-container-expand jlz-menu-container">
        <!-- (Top bar removed — config controls (lang/sound/theme) moved to
             the header help dropdown in UIMenu.ts. Menu section is now
             navigation-only: stat + nav list + footer.) -->
        <!-- Main 2-column grid: stat | nav (contact column removed — dropdown
             submenu expands into the free space on the right) -->
        <div class="jlz-menu-grid">
          ${statColumn()}
          ${navColumn()}
        </div>
        <!-- Footer -->
        ${menuFooter()}
      </div>
    </section>
  `
}

// ── Nav item toggle (desktop dropdown / mobile accordion) ──

/**
 * Initialize nav item click handlers.
 * Called by router.ts after every renderView().
 *
 * Behavior:
 *   - Click nav item toggle → expand/collapse subsections.
 *   - Only ONE item expanded at a time (clicking another closes the first).
 *   - Subsection click → navigate via SPA router (intercepted, no full reload).
 *   - After subsection navigation → auto-close menu (dispatch jlz:close-nav).
 */
export function initMenuNav(): void {
  const nav = document.querySelector('.jlz-menu-nav')
  if (!nav) return

  // Nav item toggles
  const toggles = nav.querySelectorAll<HTMLButtonElement>('.jlz-menu-nav__toggle')
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault()
      const item = toggle.closest('.jlz-menu-nav__item')
      if (!item) return
      const isExpanded = item.classList.contains('is-expanded')

      // Close all other items (only one open at a time)
      nav.querySelectorAll('.jlz-menu-nav__item.is-expanded').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-expanded')
          other.querySelector<HTMLButtonElement>('.jlz-menu-nav__toggle')?.setAttribute('aria-expanded', 'false')
        }
      })

      // Toggle current item
      item.classList.toggle('is-expanded', !isExpanded)
      toggle.setAttribute('aria-expanded', String(!isExpanded))
    })
  })

  // Subsection links — intercept for SPA navigation.
  // Click → dispatch jlz:navigate (router listens → navigateToPage).
  // renderView() replaces #spa-content innerHTML entirely, removing the menu
  // section from DOM. No overlap possible.
  const subLinks = nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__sub-link')
  subLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('data-nav-href') || link.getAttribute('href') || ''
      if (!href) return

      // Parse path + hash (e.g. "/services#section-services-02")
      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return // external link, let it pass

      e.preventDefault()

      const path = url.pathname
      const hash = url.hash

      if (path !== window.location.pathname) {
        // Cross-page: dispatch jlz:navigate — router.ts listens and calls
        // navigateToPage (pushState + renderView). Menu section is removed
        // from DOM by renderView. No overlap possible.
        window.dispatchEvent(new CustomEvent('jlz:navigate', {
          detail: { path: path + (hash || '') },
        }))
      } else {
        // Same-page: scroll to hash + close menu (return to previous section)
        if (hash) {
          const target = document.querySelector(hash)
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        window.dispatchEvent(new CustomEvent('jlz:close-nav'))
      }
    })
  })
}

// (Theme + sound toggle wiring removed — UIMenu.ts owns all config controls now.
//  readSoundMuted/writeSoundMuted/syncThemeButton/syncSoundButton/_soundMuted
//  all moved to UIMenu.ts.)

/**
 * Initialize nav item click handlers ONLY (config controls are in UIMenu).
 * Called by router.ts after every renderView().
 */
export function initMenuToolbar(): void {
  initMenuNav()
}

/**
 * Wire global listeners ONCE (not per renderView). Called by main-app.ts
 * after UIManager.init().
 * (Config control listeners removed — UIMenu.ts owns them now. This function
 *  is kept as a no-op for backward compat with UIManager.ts call site.)
 */
let _wired = false
export function wireMenuToolbarGlobals(): void {
  if (_wired) return
  _wired = true
  // (theme-change + sound-toggle + lang-change listeners removed —
  //  UIMenu.ts handles all config control wiring now.)
}
