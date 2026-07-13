// src/sections/nav/template.ts — Menu overlay (secret right section on all pages)
//
// Fullscreen navigation overlay with centered menu + blur backdrop.
// Uses UIKit3 native uk-accordion — click a nav item to expand sub-sections.
// initNavAccordion() must be called after DOM insertion to init UIKit3 accordion.
//
// Layout (top → bottom):
//   1. Eyebrow + title + lead
//   2. Config toolbar (theme toggle sun/moon + sound toggle EQ-bars)
//   3. Nav accordion (6 top items, each expands to 4 sub-sections)
//
// Config toolbar lives HERE (not in the header) per project decision:
//   - Header stays minimal: lang (left) + logo (center) + hamburger (right)
//   - Theme + sound controls are part of the "menu" overlay

import { sectionShell } from '../_shared/constants'
import UIkit from 'uikit'

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
  desc: string
  descKey: string
  subs: SubSection[]
}

const NAV_ITEMS: NavItem[] = [
  {
    num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/', desc: 'Home · cube experience', descKey: 'navOverlay.studio.desc',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      { num: '04', title: 'Manifesto', titleKey: 'dropbar.home.s4.title', href: '/#section-contact' },
    ],
  },
  {
    num: '02', label: 'Services', labelKey: 'nav.services', href: '/services', desc: 'What we do', descKey: 'navOverlay.services.desc',
    subs: [
      { num: '01', title: 'Creative Direction', titleKey: 'dropbar.services.s1.title', href: '/services#section-services-01' },
      { num: '02', title: 'Interactive Development', titleKey: 'dropbar.services.s2.title', href: '/services#section-services-02' },
      { num: '03', title: 'Motion & Realtime', titleKey: 'dropbar.services.s3.title', href: '/services#section-services-03' },
      { num: '04', title: 'AI Systems', titleKey: 'dropbar.services.s4.title', href: '/services#section-services-04' },
    ],
  },
  {
    num: '03', label: 'Works', labelKey: 'nav.works', href: '/works', desc: 'Selected projects', descKey: 'navOverlay.works.desc',
    subs: [
      { num: '01', title: 'Selected Works', titleKey: 'works.section1.title', href: '/works#section-works-01' },
      { num: '02', title: 'Case Studies', titleKey: 'works.section2.title', href: '/works#section-works-02' },
      { num: '03', title: 'Experiments', titleKey: 'works.section3.title', href: '/works#section-works-03' },
      { num: '04', title: 'Recent', titleKey: 'works.section4.title', href: '/works#section-works-04' },
    ],
  },
  {
    num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto', desc: 'Principles', descKey: 'navOverlay.manifesto.desc',
    subs: [
      { num: '01', title: 'Purpose', titleKey: 'dropbar.manifesto.s1.title', href: '/manifesto#section-manifesto-01' },
      { num: '02', title: 'Clarity', titleKey: 'dropbar.manifesto.s2.title', href: '/manifesto#section-manifesto-02' },
      { num: '03', title: 'Emotion', titleKey: 'dropbar.manifesto.s3.title', href: '/manifesto#section-manifesto-03' },
      { num: '04', title: 'Simplicity', titleKey: 'dropbar.manifesto.s4.title', href: '/manifesto#section-manifesto-04' },
    ],
  },
  {
    num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab', desc: 'Experiments', descKey: 'navOverlay.lab.desc',
    subs: [
      { num: '01', title: 'Shader Lab', titleKey: 'dropbar.lab.s1.title', href: '/lab#section-lab-01' },
      { num: '02', title: 'Audio Reactive', titleKey: 'dropbar.lab.s2.title', href: '/lab#section-lab-02' },
      { num: '03', title: 'Generative', titleKey: 'dropbar.lab.s3.title', href: '/lab#section-lab-03' },
      { num: '04', title: 'GPU Particles', titleKey: 'dropbar.lab.s4.title', href: '/lab#section-lab-04' },
    ],
  },
  {
    num: '06', label: 'Contact', labelKey: 'nav.contact', href: '/contact', desc: 'Start a project', descKey: 'navOverlay.contact.desc',
    subs: [
      { num: '01', title: 'Email', titleKey: 'dropbar.contact.s1.title', href: '/contact#section-contact-01' },
      { num: '02', title: 'Social', titleKey: 'dropbar.contact.s2.title', href: '/contact#section-contact-02' },
      { num: '03', title: 'Location', titleKey: 'dropbar.contact.s3.title', href: '/contact#section-contact-03' },
      { num: '04', title: 'Form', titleKey: 'dropbar.contact.s4.title', href: '/contact#section-contact-04' },
    ],
  },
]

/** Config toolbar — theme toggle (sun/moon) + sound toggle (EQ-bars).
 *  Uses UIKit3 uk-icon-button. Theme icon swaps via inline SVG (UIKit3 does
 *  not ship sun/moon icons — we inline them and toggle visibility by class).
 *  Sound icon is custom EQ-bars (4 animated spans) — kept per project decision. */
function configToolbar(): string {
  // Inline SVGs (Material Design Icons, Apache 2.0) — UIKit3 has no sun/moon.
  // Both live in the button; syncThemeButton() toggles .is-inverse on the
  // button to swap which SVG is visible (CSS in main.less).
  const sunSvg = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--sun"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm9-9a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM6 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm13.07-6.07a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 1 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zM7.76 16.24a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.42-1.42a1 1 0 0 1 1.41 0zm10.48 0a1 1 0 0 1 1.42 1.41l-1.42 1.42a1 1 0 0 1-1.41-1.41l1.41-1.42zM7.76 7.76a1 1 0 0 1-1.41 0L4.93 6.34a1 1 0 0 1 1.41-1.41l1.42 1.42a1 1 0 0 1 0 1.41z"/></svg>`
  const moonSvg = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="jlz-theme-svg jlz-theme-svg--moon"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"/></svg>`
  return `
    <div class="jlz-menu-toolbar uk-flex uk-flex-center uk-flex-middle uk-margin-medium-bottom" role="toolbar" aria-label="Settings">
      <button class="uk-icon-button jlz-theme-toggle" type="button" id="jlz-theme-toggle"
              aria-label="Toggle inverse theme" aria-pressed="false" title="Theme: auto"
              uk-tooltip="pos: bottom; delay: 200">
        ${sunSvg}${moonSvg}
      </button>
      <button class="uk-icon-button jlz-sound-toggle" type="button" id="jlz-menu-sound"
              aria-label="Toggle sound" aria-pressed="true" title="Sound: off"
              uk-tooltip="pos: bottom; delay: 200">
        <span class="jlz-sound-bars" aria-hidden="true">
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
          <span class="jlz-sound-bar"></span>
        </span>
      </button>
    </div>
  `
}

/** Menu overlay section — fullscreen centered menu with blur backdrop.
 *  Uses UIKit3 uk-accordion for expand/collapse.
 *  Shown as section 5 (joystick right) on ALL pages. */
export function navOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const top = `
    <div class="jlz-section-top jlz-nav-overlay-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="→">→</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="navOverlay.title">Navigate</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="navOverlay.lead">Choose your destination.</p>
      ${configToolbar()}
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom jlz-nav-overlay-bottom">
      <ul class="jlz-nav-accordion uk-accordion" id="jlz-nav-accordion" uk-accordion="collapsible: true; multiple: false; active: -1">
        ${NAV_ITEMS.map(item => `
          <li class="jlz-nav-accordion__item">
            <a class="jlz-nav-accordion__header uk-accordion-title" href="#" data-magnetic>
              <span class="jlz-nav-accordion__num">${item.num}</span>
              <span class="jlz-nav-accordion__label" data-i18n="${item.labelKey}">${item.label}</span>
              <span class="jlz-nav-accordion__desc" data-i18n="${item.descKey}">${item.desc}</span>
            </a>
            <div class="jlz-nav-accordion__panel uk-accordion-content">
              <ul class="jlz-nav-accordion__subs">
                ${item.subs.map(sub => `
                  <li>
                    <a href="${sub.href}" class="jlz-nav-accordion__sub" data-magnetic>
                      <span class="jlz-nav-accordion__sub-num">${sub.num}</span>
                      <span class="jlz-nav-accordion__sub-title" data-i18n="${sub.titleKey}">${sub.title}</span>
                      <span class="jlz-nav-accordion__sub-arrow" aria-hidden="true">→</span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `
  if (mode === 'home') {
    return sectionShell('menu', top, bottom, 'home')
  }
  return sectionShell('page-menu', top, bottom, 'content')
}

/** Initialize UIKit3 accordion on dynamically inserted nav content.
 *  Must be called AFTER DOM insertion (router.ts calls this after innerHTML). */
export function initNavAccordion(): void {
  const el = document.getElementById('jlz-nav-accordion')
  if (!el) return
  // UIKit3 needs explicit init on dynamically inserted content
  try {
    ;(UIkit as unknown as { accordion: (el: Element, opts?: Record<string, unknown>) => void }).accordion(el, {
      collapsible: true,
      multiple: false,
      active: -1,
    })
  } catch {
    // Already initialized or UIKit not ready — try update
    try { ;(UIkit as unknown as { update: (el: Element) => void }).update(el) } catch { /* ignore */ }
  }
}
