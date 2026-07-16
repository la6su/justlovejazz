// src/sections/nav/template.ts — Menu section (section 5, joystick right)
//
// UNIQUE template — does NOT use sectionShell(). VOSK-inspired 2-column grid.
// This is a FULL SECTION (not an overlay): hidden by default via
// section[data-section] { display: none }, shown via .section-active.
// Same visibility pattern as Lab (section 0) and all main sections.
//
// Joystick right or ArrowRight → JoystickNav switches to section 5.
// Joystick left, ArrowLeft or jlz:close-nav → returns to the previous main section.
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
//   - Shown when .section-active is added (joystick right / ArrowRight).
//   - backdrop-filter: blur(20px) on overlay for glass-morphism separation
//     from the 3D canvas behind.
//
// Exit (close menu):
//   - `jlz:close-nav` → return to the previous main section.
//   - Joystick or keyboard arrow left → same behavior.
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
//  controls moved to UIMenu.ts fixed top bar. Menu section is
//  navigation-only now.)

// ── Left column: stat / studio identity ──
function statColumn(): string {
  return `
    <div class="jlz-menu-col jlz-menu-col--stat">
      <div class="jlz-menu-stat">
        <span class="jlz-menu-stat__num">06</span>
        <span class="jlz-menu-stat__label" data-i18n="menu.stat.sections">SECTIONS</span>
      </div>
    </div>
  `
}

// ── Center column: nav list with subsections ──
// Uses UIKit3 native uk-nav (extends Accordion) for expand/collapse behavior.
// uk-nav handles: toggle on click, uk-open class (authoritative state),
// accordion (only one open at a time via multiple:false default),
// aria-expanded + aria-controls (accessibility), keyboard (Space).
// UIKit auto-initializes on DOM insertion — UIkit.update(el) in router.ts.
// See: https://getuikit.com/docs/nav
function navColumn(): string {
  const items = NAV_ITEMS.map((item) => `
    <li class="jlz-menu-nav__item uk-parent">
      <a href="#" class="jlz-menu-nav__toggle" data-magnetic>
        <span class="jlz-menu-nav__num">${item.num}</span>
        <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
        <span class="jlz-menu-nav__arrow uk-nav-parent-icon" aria-hidden="true"></span>
      </a>
      <ul class="jlz-menu-nav__subs uk-nav-sub">
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
      <ul class="jlz-menu-nav uk-nav uk-nav-default" uk-nav>${items}</ul>
    </div>
  `
}

// (contactsColumn removed — contact info lives in the Contact page section,
//  not in the menu. Dropdown submenu expands into the free space.)

/**
 * Menu section — UNIQUE template (not sectionShell).
 *
 * This is a FULL SECTION (not an overlay). Visibility is controlled by the
 * same CSS as all other sections:
 *   - Hidden: section[data-section] { display: none } (home) / .jlz-page-section { display: none } (content)
 *   - Shown: .section-active { display: flex !important }
 *
 * Joystick right or ArrowRight → JoystickNav.goToSection(5) →
 * ContentReveal adds .section-active to [data-section="menu"].
 *
 * @param mode 'home' = data-section (3D cube face sync) | 'content' = data-page-section
 */
export function navOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const sectionAttr = mode === 'home' ? 'data-section="menu"' : 'data-page-section="page-menu"'
  // On content pages, add jlz-page-section class so the standard hiding rule
  // (.jlz-page-section { display: none }) applies. Without it, the menu section
  // only has the jlz-menu-overlay class (which has no display:none) and stays
  // visible (display:block) on content pages even when not active — the menu
  // overlay appears stuck after cross-page subnav navigation. On home, the
  // data-section attribute already triggers #spa-content section[data-section]
  // { display: none }, so the class is not needed there.
  const pageClass = mode === 'content' ? 'jlz-page-section' : ''
  return `
    <section class="jlz-menu-overlay ${pageClass} uk-section uk-section-xsmall" id="section-menu" ${sectionAttr}>
      <div class="uk-container uk-container-expand jlz-menu-container">
        <!-- (Top bar removed — config controls (lang/sound/theme) live in the
             fixed UIMenu.ts top bar. Menu section is now
             navigation-only: stat + nav accordion.) -->
        <!-- Main 2-column grid: stat | nav accordion -->
        <div class="jlz-menu-grid">
          ${statColumn()}
          ${navColumn()}
        </div>
      </div>
    </section>
  `
}

// ── Nav item toggle (accordion at every viewport) ──

/**
 * Initialize nav item click handlers.
 * Called by router.ts after every renderView().
 *
 * UIKit3 uk-nav (extends Accordion) handles expand/collapse natively:
 *   - Click .uk-parent > a toggles .uk-open on the parent <li>
 *   - Accordion behavior: only one .uk-parent open at a time (multiple:false)
 *   - aria-expanded + aria-controls set automatically by UIKit
 *   - Keyboard: Space toggles (handled by UIKit)
 *   - Auto-initialized on DOM insertion (UIkit.update in router.ts)
 *
 * We ONLY wire the subsection link click for SPA navigation — that's app-specific
 * (intercept the link, dispatch jlz:navigate + jlz:close-nav). UIKit handles the
 * rest. No custom .is-expanded class, no manual toggle listeners.
 */
export function initMenuNav(): void {
  const nav = document.querySelector('.jlz-menu-nav')
  if (!nav) return

  // Subsection links — intercept for SPA navigation.
  // Click → dispatch jlz:navigate (router listens → navigateToPage).
  // renderView() replaces #spa-content innerHTML entirely, removing the menu
  // section from DOM. No overlap possible.
  const subLinks = nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__sub-link')
  subLinks.forEach((link) => {
    // Skip already-bound links (initMenuNav is called on every renderView)
    if (link.dataset.jlzBound === '1') return
    link.dataset.jlzBound = '1'
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
        // Cross-page: close menu FIRST (reset JoystickNav to center), then
        // dispatch jlz:navigate — router listens and calls navigateToPage
        // (pushState + renderView). Without close-nav, JoystickNav stays in
        // side='menu' state and the cube face doesn't reset.
        window.dispatchEvent(new CustomEvent('jlz:close-nav'))
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
