// src/sections/nav/template.ts — responsive cinematic Menu (section 5)
//
// UNIQUE template — does NOT use sectionShell(). Editorial 2-column grid.
// It is a full-screen desktop scene and a compact top sheet on mobile. The
// same UIkit Nav markup owns expansion, keyboard state and ARIA in both modes.
//
// UIkit Nav keeps one expandable item open and owns its ARIA state. The layout
// reveals subsections beside the navigation on desktop and inline on mobile.
// CinematicNav owns visibility through body[data-cinematic-sheet="menu"].
//
// Exit (close menu):
//   - `jlz:close-nav` → return to the previous main section.
//   - Subsection click → navigate to target section (menu auto-closes).

import { eventBus } from '../../core/EventBus'

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
  direct?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    num: '01',
    label: 'Studio',
    labelKey: 'nav.studio',
    href: '/',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      {
        num: '04',
        title: 'Manifesto',
        titleKey: 'dropbar.home.s4.title',
        href: '/#section-contact',
      },
    ],
  },
  {
    num: '02',
    label: 'Services',
    labelKey: 'nav.services',
    href: '/services',
    subs: [
      {
        num: '01',
        title: 'Creative Direction',
        titleKey: 'dropbar.services.s1.title',
        href: '/services#section-services-01',
      },
      {
        num: '02',
        title: 'Realtime build',
        titleKey: 'dropbar.services.s2.title',
        href: '/services#section-services-02',
      },
      {
        num: '03',
        title: 'Motion',
        titleKey: 'dropbar.services.s3.title',
        href: '/services#section-services-03',
      },
      {
        num: '04',
        title: 'AI',
        titleKey: 'dropbar.services.s4.title',
        href: '/services#section-services-04',
      },
    ],
  },
  {
    num: '03',
    label: 'Works',
    labelKey: 'nav.works',
    href: '/works',
    subs: [
      {
        num: '01',
        title: 'Selected Works',
        titleKey: 'works.section1.title',
        href: '/works#section-works-01',
      },
      {
        num: '02',
        title: 'Case Studies',
        titleKey: 'works.section2.title',
        href: '/works#section-works-02',
      },
      {
        num: '03',
        title: 'Interactive Systems',
        titleKey: 'works.section3.title',
        href: '/works#section-works-03',
      },
      {
        num: '04',
        title: 'Recent',
        titleKey: 'works.section4.title',
        href: '/works#section-works-04',
      },
    ],
  },
  {
    num: '04',
    label: 'Manifesto',
    labelKey: 'nav.manifesto',
    href: '/manifesto',
    subs: [
      {
        num: '01',
        title: 'Purpose',
        titleKey: 'dropbar.manifesto.s1.title',
        href: '/manifesto#section-manifesto-01',
      },
      {
        num: '02',
        title: 'Clarity',
        titleKey: 'dropbar.manifesto.s2.title',
        href: '/manifesto#section-manifesto-02',
      },
      {
        num: '03',
        title: 'Emotion',
        titleKey: 'dropbar.manifesto.s3.title',
        href: '/manifesto#section-manifesto-03',
      },
      {
        num: '04',
        title: 'Simplicity',
        titleKey: 'dropbar.manifesto.s4.title',
        href: '/manifesto#section-manifesto-04',
      },
    ],
  },
  {
    num: '05',
    label: 'Lab',
    labelKey: 'nav.lab',
    href: '/lab',
    subs: [
      {
        num: '01',
        title: 'Shader Lab',
        titleKey: 'lab.shaderLab.title',
        href: '/lab#section-lab-01',
      },
      {
        num: '02',
        title: 'Audio Reactive',
        titleKey: 'lab.audioReactive.title',
        href: '/lab#section-lab-02',
      },
      {
        num: '03',
        title: 'Generative',
        titleKey: 'lab.generative.title',
        href: '/lab#section-lab-03',
      },
      {
        num: '04',
        title: 'GPU Particles',
        titleKey: 'lab.gpuParticles.title',
        href: '/lab#section-lab-04',
      },
    ],
  },
  {
    num: '06',
    label: 'Blog',
    labelKey: 'nav.blog',
    href: '/blog',
    direct: true,
    subs: [
      { num: '01', title: 'Journal', titleKey: 'nav.blog', href: '/blog' },
      {
        num: '02',
        title: 'Undercurrent',
        titleKey: 'blog.undercurrent.title',
        href: '/blog/undercurrent-webgpu-fluid',
      },
      {
        num: '03',
        title: 'Glassmorphism',
        titleKey: 'blog.glass.title',
        href: '/blog/glassmorphism-webgpu',
      },
      {
        num: '04',
        title: 'On-demand Rendering',
        titleKey: 'blog.rendering.title',
        href: '/blog/on-demand-rendering',
      },
    ],
  },
  {
    num: '07',
    label: 'Contact',
    labelKey: 'nav.contact',
    href: '/contact',
    subs: [
      {
        num: '01',
        title: 'Email',
        titleKey: 'dropbar.contact.s1.title',
        href: '/contact#section-contact-01',
      },
      {
        num: '02',
        title: 'Social',
        titleKey: 'dropbar.contact.s2.title',
        href: '/contact#section-contact-02',
      },
      {
        num: '03',
        title: 'Location',
        titleKey: 'dropbar.contact.s3.title',
        href: '/contact#section-contact-03',
      },
      {
        num: '04',
        title: 'Form',
        titleKey: 'dropbar.contact.s4.title',
        href: '/contact#section-contact-04',
      },
    ],
  },
]

// (Inline SVG icons (SUN_SVG/MOON_SVG) + configToolbar removed —
//  controls moved to UIMenu.ts fixed top bar. Menu section is
//  navigation-only now.)

// ── Left column: responsive destination preview ──
function statColumn(): string {
  return `
    <div class="jlz-menu-col jlz-menu-col--stat uk-flex uk-flex-column uk-width-1-1 uk-width-2-5@m uk-visible@m">
      <div class="jlz-menu-preview" aria-hidden="true">
        <span class="jlz-menu-preview__number">01</span>
        <span class="jlz-menu-preview__label">Studio</span>
        <span class="jlz-menu-preview__cursor"></span>
        <span class="jlz-menu-preview__echo">ENTER THE WORLD</span>
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
  const items = NAV_ITEMS.map((item) => {
    if (item.direct) {
      return `
        <li class="jlz-menu-nav__item jlz-menu-nav__item--direct">
          <a href="${item.href}" class="jlz-menu-nav__toggle jlz-menu-nav__direct-link uk-flex uk-width-1-1" data-magnetic data-page-transition>
            <span class="jlz-menu-nav__num">${item.num}</span>
            <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
            <span class="jlz-menu-nav__arrow" aria-hidden="true">→</span>
          </a>
        </li>
      `
    }
    return `
    <li class="jlz-menu-nav__item uk-parent">
      <a href="#" class="jlz-menu-nav__toggle uk-flex uk-width-1-1" data-magnetic>
        <span class="jlz-menu-nav__num">${item.num}</span>
        <span class="jlz-menu-nav__label" data-i18n="${item.labelKey}">${item.label}</span>
        <span class="jlz-menu-nav__arrow uk-nav-parent-icon" aria-hidden="true"></span>
      </a>
      <ul class="jlz-menu-nav__subs uk-nav-sub">
        ${item.subs
          .map(
            (sub) => `
          <li class="jlz-menu-nav__sub-item">
            <a href="${sub.href}" class="jlz-menu-nav__sub-link uk-flex uk-flex-middle" data-magnetic data-nav-href="${sub.href}">
              <span class="jlz-menu-nav__sub-num">${sub.num}</span>
              <span class="jlz-menu-nav__sub-title uk-flex-1" data-i18n="${sub.titleKey}">${sub.title}</span>
              <span class="jlz-menu-nav__sub-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        `,
          )
          .join('')}
      </ul>
    </li>
  `
  }).join('')
  return `
    <div class="jlz-menu-col jlz-menu-col--nav uk-flex uk-flex-column uk-width-1-1 uk-width-expand@m">
      <ul class="jlz-menu-nav uk-nav uk-nav-default" uk-nav="animation: false">${items}</ul>
    </div>
  `
}

// (contactsColumn removed — contact info lives in the Contact page section,
//  not in the menu. Dropdown submenu expands into the free space.)

/**
 * Menu section — UNIQUE template (not sectionShell).
 *
 * This is a responsive top sheet backed by canonical runtime section 5.
 * CinematicNav exposes its state on body[data-cinematic-sheet="menu"], while
 * ContentReveal continues synchronizing the 3D section configuration.
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
    <section class="jlz-menu-overlay ${pageClass} uk-section uk-section-xsmall uk-flex uk-flex-column" id="section-menu" ${sectionAttr} data-cinematic-menu>
      <div class="jlz-menu-field" aria-hidden="true">
        <span class="jlz-menu-field__horizon"></span>
        <span class="jlz-menu-field__pulse"></span>
      </div>
      <div class="uk-container uk-container-expand jlz-menu-container uk-flex uk-flex-column uk-flex-center">
        <div class="jlz-menu-sheet__header uk-flex uk-flex-between uk-margin-bottom">
          <span class="jlz-menu-sheet__eyebrow uk-text-meta uk-text-uppercase" data-i18n="menu.navigate">Menu</span>
          <span class="jlz-menu-sheet__index uk-text-meta uk-text-uppercase" aria-hidden="true">Index / 07</span>
        </div>
        <!-- Main 2-column grid: stat | nav accordion -->
        <div class="jlz-menu-grid uk-grid uk-grid-medium uk-flex uk-flex-middle" uk-grid>
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
export function initMenuNav(): () => void {
  const contentRoot = document.getElementById('spa-content') ?? document
  const nav = contentRoot.querySelector('.jlz-menu-nav')
  const abortController = new AbortController()
  let disposed = false
  if (!nav)
    return () => {
      disposed = true
      abortController.abort()
    }

  // UIkit owns `aria-expanded` and `hidden`. When the sheet itself was hidden
  // during its initial update, UIkit can retain `hidden` after it has already
  // announced the parent as expanded. Reconcile only that native state on the
  // next frame; no app-level accordion state is introduced.
  const toggles = nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__toggle')
  const pendingVisibilityFrames = new Map<HTMLAnchorElement, [number, number?]>()
  const cancelPendingFrames = (toggle: HTMLAnchorElement): void => {
    const pending = pendingVisibilityFrames.get(toggle)
    if (!pending) return
    cancelAnimationFrame(pending[0])
    if (pending[1] !== undefined) cancelAnimationFrame(pending[1])
    pendingVisibilityFrames.delete(toggle)
  }
  toggles.forEach((toggle) => {
    if (toggle.dataset.jlzVisibilityBound === '1') return
    toggle.dataset.jlzVisibilityBound = '1'
    toggle.addEventListener(
      'click',
      () => {
        cancelPendingFrames(toggle)
        const routeRoot = toggle.closest('#spa-content')
        const first = requestAnimationFrame(() => {
          if (disposed) return
          // UIkit may reconcile an initially hidden sheet on the first frame.
          // Read its authoritative aria state on the following frame, after that
          // update has settled, then mirror only the native `hidden` attribute.
          const second = requestAnimationFrame(() => {
            pendingVisibilityFrames.delete(toggle)
            if (disposed) return
            if (!toggle.isConnected || !routeRoot?.contains(toggle)) return
            const content = toggle.nextElementSibling
            if (!(content instanceof HTMLElement) || toggle.ariaExpanded !== 'true') return
            content.hidden = false
          })
          pendingVisibilityFrames.set(toggle, [first, second])
        })
        pendingVisibilityFrames.set(toggle, [first])
      },
      { signal: abortController.signal },
    )

    const syncPreview = () => {
      const previewNumber = contentRoot.querySelector<HTMLElement>('.jlz-menu-preview__number')
      const previewLabel = contentRoot.querySelector<HTMLElement>('.jlz-menu-preview__label')
      const number = toggle.querySelector<HTMLElement>('.jlz-menu-nav__num')?.textContent
      const label = toggle.querySelector<HTMLElement>('.jlz-menu-nav__label')?.textContent
      if (previewNumber && number) previewNumber.textContent = number
      if (previewLabel && label) previewLabel.textContent = label
    }
    toggle.addEventListener('pointerenter', syncPreview, { signal: abortController.signal })
    toggle.addEventListener('focus', syncPreview, { signal: abortController.signal })
  })

  // Subsection links — intercept for SPA navigation.
  // Click → dispatch jlz:navigate (router listens → navigateToPage).
  // renderView() replaces #spa-content innerHTML entirely, removing the menu
  // section from DOM. No overlap possible.
  const subLinks = nav.querySelectorAll<HTMLAnchorElement>('.jlz-menu-nav__sub-link')
  subLinks.forEach((link) => {
    // Skip already-bound links (initMenuNav is called on every renderView)
    if (link.dataset.jlzBound === '1') return
    link.dataset.jlzBound = '1'
    link.addEventListener(
      'click',
      (e) => {
        const href = link.getAttribute('data-nav-href') || link.getAttribute('href') || ''
        if (!href) return

        // Parse path + hash (e.g. "/services#section-services-02")
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return // external link, let it pass

        e.preventDefault()

        const path = url.pathname
        const hash = url.hash

        if (path !== window.location.pathname) {
          // Cross-page: close Menu first (restore the current story frame), then
          // dispatch jlz:navigate so the router can run the page transition.
          eventBus.emit('jlz:close-nav')
          eventBus.emit('jlz:navigate', { path: path + (hash || '') })
        } else {
          // Same-page: scroll to hash + close menu (return to previous section)
          if (hash) {
            const target = contentRoot.querySelector(hash)
            target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
          }
          eventBus.emit('jlz:close-nav')
        }
      },
      { signal: abortController.signal },
    )
  })

  return () => {
    if (disposed) return
    disposed = true
    pendingVisibilityFrames.forEach((_pending, toggle) => cancelPendingFrames(toggle))
    abortController.abort()
  }
}

// (Theme + sound toggle wiring removed — UIMenu.ts owns all config controls now.
//  readSoundMuted/writeSoundMuted/syncThemeButton/syncSoundButton/_soundMuted
//  all moved to UIMenu.ts.)

/**
 * Initialize nav item click handlers ONLY (config controls are in UIMenu).
 * Called by router.ts after every renderView().
 */
export function initMenuToolbar(): () => void {
  const disposeMenuNav = initMenuNav()
  // Note: [data-close-cinematic-sheet] clicks are already handled by
  // CinematicNav's capture-phase document listener (_sheetClickHandler).
  // The previous duplicate binding here dispatched jlz:close-nav which
  // CinematicNav also listened to — both fired on the same click (Bug F).
  return disposeMenuNav
}

// wireMenuToolbarGlobals removed — was a no-op after config controls
// moved to UIMenu.ts. Call site in UIManager.ts deleted.
