// src/pages/content/services.ts — Services page (4 main sections + 2 overlays)
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.
// Main sections (1-4): Creative Direction, Realtime build, Motion, AI.

import {
  sectionShell,
  contentTop,
  storyBottom,
  i18nDesc,
  serviceExplore,
} from '../../sections/_shared/constants'
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

function serviceSection(s: Service, isActive: boolean = false): string {
  return sectionShell(
    `${s.key.replace('services.', 'services-')}`,
    contentTop(s.num, s.title, s.lead, 'large', s.key + '.title', s.key + '.lead'),
    storyBottom(`${i18nDesc(s.key, s.desc)}${serviceExplore(s.href, 'common.explore', 'Explore')}`),
    'content',
    isActive,
  )
}

export function servicesPage(): string {
  const [s1, s2, s3, s4] = SERVICES
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      ${labOverlaySection('content')}
      <!-- 1: Creative Direction (start, active) -->
      ${serviceSection(s1!, true)}
      <!-- 2: Realtime build -->
      ${serviceSection(s2!)}
      <!-- 3: Motion -->
      ${serviceSection(s3!)}
      <!-- 4: AI -->
      ${serviceSection(s4!)}
      <!-- 5: MENU SHEET -->
      ${navOverlaySection('content')}
    </article>
  `
}
