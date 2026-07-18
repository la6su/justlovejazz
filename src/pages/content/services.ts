// src/pages/content/services.ts — Services page (4 main sections + 2 overlays)
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.
// Main sections (1-4): Creative Direction, Realtime build, Motion, AI.

import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

interface Service {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
  key: string
}

const SERVICES: readonly Service[] = [
  {
    num: '01',
    title: 'Creative Direction',
    lead: 'From concept to visual identity.',
    desc: [
      'We design interfaces that feel like digital products, not websites.',
      'Every interaction has purpose.',
      'Every transition tells a story.',
    ],
    href: '/blog/glassmorphism-webgpu',
    key: 'services.creativeDirection',
  },
  {
    num: '02',
    title: 'Realtime build',
    lead: 'Realtime experiences built with modern web technologies.',
    desc: ['Performance comes first.', 'Motion follows purpose.'],
    href: '/blog/on-demand-rendering',
    key: 'services.interactiveDev',
  },
  {
    num: '03',
    title: 'Motion',
    lead: 'Motion is part of the interface. Not decoration.',
    desc: ['Navigation.', 'Feedback.', 'Emotion.'],
    href: '/blog/tsl-changes-everything',
    key: 'services.motionRealtime',
  },
  {
    num: '04',
    title: 'AI',
    lead: 'Creative workflows powered by AI.',
    desc: ['Generation.', 'Automation.', 'Iteration.'],
    href: '/blog/undercurrent-webgpu-fluid',
    key: 'services.aiSystems',
  },
] as const

function serviceDesc(key: string, desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map(
      (line, i) =>
        `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`,
    )
    .join('')}</div>`
}

function serviceExplore(href: string, key: string = 'common.explore'): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="${key}">Explore</span>
  </a>`
}

export function servicesPage(): string {
  const [s1, s2, s3, s4] = SERVICES
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      ${labOverlaySection('content')}
      <!-- 1: Creative Direction (start, active) -->
      ${sectionShell(
        'services-01',
        contentTop(s1!.num, s1!.title, s1!.lead, 'large', s1!.key + '.title', s1!.key + '.lead'),
        contentBottom(`${serviceDesc(s1!.key, s1!.desc)}${serviceExplore(s1!.href)}`),
        'content',
        true,
      )}
      <!-- 2: Realtime build -->
      ${sectionShell(
        'services-02',
        contentTop(s2!.num, s2!.title, s2!.lead, 'large', s2!.key + '.title', s2!.key + '.lead'),
        contentBottom(`${serviceDesc(s2!.key, s2!.desc)}${serviceExplore(s2!.href)}`),
      )}
      <!-- 3: Motion -->
      ${sectionShell(
        'services-03',
        contentTop(s3!.num, s3!.title, s3!.lead, 'large', s3!.key + '.title', s3!.key + '.lead'),
        contentBottom(`${serviceDesc(s3!.key, s3!.desc)}${serviceExplore(s3!.href)}`),
      )}
      <!-- 4: AI -->
      ${sectionShell(
        'services-04',
        contentTop(s4!.num, s4!.title, s4!.lead, 'large', s4!.key + '.title', s4!.key + '.lead'),
        contentBottom(`${serviceDesc(s4!.key, s4!.desc)}${serviceExplore(s4!.href)}`),
      )}
      <!-- 5: MENU SHEET -->
      ${navOverlaySection('content')}
    </article>
  `
}
