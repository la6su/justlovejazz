// src/pages/content/manifesto.ts — Manifesto page (4 main sections + 2 overlays)
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.
// Main sections (1-4): Purpose, Clarity, Emotion, Simplicity.

import {
  sectionShell,
  contentTop,
  storyBottom,
  i18nDesc,
  serviceExplore,
} from '../../sections/_shared/constants'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

interface Principle {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
  key: string
}

const PRINCIPLES: readonly Principle[] = [
  {
    num: '01',
    title: 'Purpose',
    lead: "We don't build what everyone builds.",
    desc: ['We solve different problems.', 'We improve experience and understand the pain.'],
    href: '/blog/tsl-changes-everything',
    key: 'manifesto.purpose',
  },
  {
    num: '02',
    title: 'Clarity',
    lead: 'Clean structure.',
    desc: ['Clear logic.', 'No noise.'],
    href: '/blog/on-demand-rendering',
    key: 'manifesto.clarity',
  },
  {
    num: '03',
    title: 'Emotion',
    lead: 'We use motion, light, and sound to evoke a sense of presence.',
    desc: [],
    href: '/blog/undercurrent-webgpu-fluid',
    key: 'manifesto.emotion',
  },
  {
    num: '04',
    title: 'Simplicity',
    lead: 'We strive for minimalism — but not emptiness.',
    desc: [],
    href: '/blog/glassmorphism-webgpu',
    key: 'manifesto.simplicity',
  },
] as const

function principleSection(p: Principle, isActive: boolean = false): string {
  return sectionShell(
    `${p.key.replace('manifesto.', 'manifesto-')}`,
    contentTop(p.num, p.title, p.lead, 'large', p.key + '.title', p.key + '.lead'),
    storyBottom(
      `${i18nDesc(p.key, p.desc)}${serviceExplore(p.href, 'common.readMore', 'Read more')}`,
    ),
    'content',
    isActive,
  )
}

export function manifestoPage(): string {
  const [p1, p2, p3, p4] = PRINCIPLES
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      ${labOverlaySection('content')}
      <!-- 1: Purpose (start, active) -->
      ${principleSection(p1!, true)}
      <!-- 2: Clarity -->
      ${principleSection(p2!)}
      <!-- 3: Emotion -->
      ${principleSection(p3!)}
      <!-- 4: Simplicity -->
      ${principleSection(p4!)}
      <!-- 5: MENU SHEET -->
      ${navOverlaySection('content')}
    </article>
  `
}
