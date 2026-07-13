// src/sections/nav/template.ts — Navigation overlay (secret right section on all pages)
//
// This is the "hamburger menu" — fullscreen navigation overlay shown when
// user drags joystick RIGHT (section 5 on all pages) or clicks hamburger button.
//
// ACCORDION: uses UIKit3 native uk-accordion (no custom JS needed).
// Click a nav item to expand its sub-sections. Only one open at a time.
// Clicking a sub-section navigates to that page + section (via hash).

import { sectionShell } from '../_shared/constants'

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
    num: '01',
    label: 'Studio',
    labelKey: 'nav.studio',
    href: '/',
    desc: 'Home · cube experience',
    descKey: 'navOverlay.studio.desc',
    subs: [
      { num: '01', title: 'Studio', titleKey: 'dropbar.home.s1.title', href: '/#section-intro' },
      { num: '02', title: 'Services', titleKey: 'dropbar.home.s2.title', href: '/#section-about' },
      { num: '03', title: 'Works', titleKey: 'dropbar.home.s3.title', href: '/#section-works' },
      { num: '04', title: 'Manifesto', titleKey: 'dropbar.home.s4.title', href: '/#section-contact' },
    ],
  },
  {
    num: '02',
    label: 'Services',
    labelKey: 'nav.services',
    href: '/services',
    desc: 'What we do',
    descKey: 'navOverlay.services.desc',
    subs: [
      { num: '01', title: 'Creative Direction', titleKey: 'dropbar.services.s1.title', href: '/services#section-services-01' },
      { num: '02', title: 'Interactive Development', titleKey: 'dropbar.services.s2.title', href: '/services#section-services-02' },
      { num: '03', title: 'Motion & Realtime', titleKey: 'dropbar.services.s3.title', href: '/services#section-services-03' },
      { num: '04', title: 'AI Systems', titleKey: 'dropbar.services.s4.title', href: '/services#section-services-04' },
    ],
  },
  {
    num: '03',
    label: 'Works',
    labelKey: 'nav.works',
    href: '/works',
    desc: 'Selected projects',
    descKey: 'navOverlay.works.desc',
    subs: [
      { num: '01', title: 'Selected Works', titleKey: 'works.section1.title', href: '/works#section-works-01' },
      { num: '02', title: 'Case Studies', titleKey: 'works.section2.title', href: '/works#section-works-02' },
      { num: '03', title: 'Experiments', titleKey: 'works.section3.title', href: '/works#section-works-03' },
      { num: '04', title: 'Recent', titleKey: 'works.section4.title', href: '/works#section-works-04' },
    ],
  },
  {
    num: '04',
    label: 'Manifesto',
    labelKey: 'nav.manifesto',
    href: '/manifesto',
    desc: 'Principles',
    descKey: 'navOverlay.manifesto.desc',
    subs: [
      { num: '01', title: 'Purpose', titleKey: 'dropbar.manifesto.s1.title', href: '/manifesto#section-manifesto-01' },
      { num: '02', title: 'Clarity', titleKey: 'dropbar.manifesto.s2.title', href: '/manifesto#section-manifesto-02' },
      { num: '03', title: 'Emotion', titleKey: 'dropbar.manifesto.s3.title', href: '/manifesto#section-manifesto-03' },
      { num: '04', title: 'Simplicity', titleKey: 'dropbar.manifesto.s4.title', href: '/manifesto#section-manifesto-04' },
    ],
  },
  {
    num: '05',
    label: 'Lab',
    labelKey: 'nav.lab',
    href: '/lab',
    desc: 'Experiments',
    descKey: 'navOverlay.lab.desc',
    subs: [
      { num: '01', title: 'Shader Lab', titleKey: 'dropbar.lab.s1.title', href: '/lab#section-lab-01' },
      { num: '02', title: 'Audio Reactive', titleKey: 'dropbar.lab.s2.title', href: '/lab#section-lab-02' },
      { num: '03', title: 'Generative', titleKey: 'dropbar.lab.s3.title', href: '/lab#section-lab-03' },
      { num: '04', title: 'GPU Particles', titleKey: 'dropbar.lab.s4.title', href: '/lab#section-lab-04' },
    ],
  },
  {
    num: '06',
    label: 'Contact',
    labelKey: 'nav.contact',
    href: '/contact',
    desc: 'Start a project',
    descKey: 'navOverlay.contact.desc',
    subs: [
      { num: '01', title: 'Email', titleKey: 'dropbar.contact.s1.title', href: '/contact#section-contact-01' },
      { num: '02', title: 'Social', titleKey: 'dropbar.contact.s2.title', href: '/contact#section-contact-02' },
      { num: '03', title: 'Location', titleKey: 'dropbar.contact.s3.title', href: '/contact#section-contact-03' },
      { num: '04', title: 'Form', titleKey: 'dropbar.contact.s4.title', href: '/contact#section-contact-04' },
    ],
  },
]

/** Navigation overlay section — shown as section 5 (joystick right) on ALL pages.
 *  Uses UIKit3 native uk-accordion for expand/collapse behavior.
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
      <ul class="jlz-nav-accordion uk-accordion" uk-accordion="collapsible: true; multiple: false; animation: true; duration: 300">
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
    return sectionShell('process', top, bottom, 'home')
  }
  return sectionShell('page-nav', top, bottom, 'content')
}

/** No-op — UIKit3 accordion is initialized automatically via uk-accordion attribute.
 *  Kept for backward compat (router.ts imports it). */
export function initNavAccordion(): void {
  // UIKit3 handles accordion via uk-accordion attribute + UIkit.update()
  // No custom JS needed.
}
