// src/sections/nav/template.ts — Navigation overlay (secret right section on all pages)
//
// This is the "hamburger menu" — fullscreen navigation overlay shown when
// user drags joystick RIGHT (section 5 on all pages) or clicks hamburger button.
//
// Content: large typography list of all pages + CTA. Accent-lime hover.
// Style: backdrop blur, centered, premium feel.

import { sectionShell } from '../_shared/constants'

interface NavLink {
  num: string
  label: string
  labelKey: string
  href: string
  desc: string
  descKey: string
}

const NAV_LINKS: NavLink[] = [
  { num: '01', label: 'Studio', labelKey: 'nav.studio', href: '/', desc: 'Home · cube experience', descKey: 'navOverlay.studio.desc' },
  { num: '02', label: 'Services', labelKey: 'nav.services', href: '/services', desc: 'What we do', descKey: 'navOverlay.services.desc' },
  { num: '03', label: 'Works', labelKey: 'nav.works', href: '/works', desc: 'Selected projects', descKey: 'navOverlay.works.desc' },
  { num: '04', label: 'Manifesto', labelKey: 'nav.manifesto', href: '/manifesto', desc: 'Principles', descKey: 'navOverlay.manifesto.desc' },
  { num: '05', label: 'Lab', labelKey: 'nav.lab', href: '/lab', desc: 'Experiments', descKey: 'navOverlay.lab.desc' },
  { num: '06', label: 'Contact', labelKey: 'nav.contact', href: '/contact', desc: 'Start a project', descKey: 'navOverlay.contact.desc' },
]

/** Navigation overlay section — shown as section 5 (joystick right) on ALL pages.
 *  On home page it replaces the old processSection. On content pages it replaces
 *  the old "secret right" section. */
export function navOverlaySection(mode: 'home' | 'content' = 'content'): string {
  const top = `
    <div class="jlz-section-top jlz-nav-overlay-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
      <span class="jlz-eyebrow" data-eyebrow data-eyebrow-text="→">→</span>
      <h2 class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom" data-i18n="navOverlay.title">Navigate</h2>
      <p class="uk-text-lead uk-margin-small-top" data-i18n="navOverlay.lead">Choose your destination.</p>
    </div>
  `
  const bottom = `
    <div class="jlz-section-bottom jlz-nav-overlay-bottom">
      <nav class="jlz-nav-overlay-list" aria-label="Site navigation">
        ${NAV_LINKS.map(link => `
          <a href="${link.href}" class="jlz-nav-overlay-link" data-magnetic>
            <span class="jlz-nav-overlay__num">${link.num}</span>
            <span class="jlz-nav-overlay__label" data-i18n="${link.labelKey}">${link.label}</span>
            <span class="jlz-nav-overlay__desc" data-i18n="${link.descKey}">${link.desc}</span>
            <span class="jlz-nav-overlay__arrow" aria-hidden="true">→</span>
          </a>
        `).join('')}
      </nav>
    </div>
  `
  // On home: data-section="process" (keeps 3D cube face sync)
  // On content: data-page-section (regular content section)
  if (mode === 'home') {
    return sectionShell('process', top, bottom, 'home')
  }
  return sectionShell('page-nav', top, bottom, 'content')
}
