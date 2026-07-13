// src/pages/content/manifesto.ts — Manifesto page (4 main sections + 2 overlays)
//
// PLAN-v3: section 0 = Lab overlay, section 5 = Navigation overlay.
// Main sections (1-4): Purpose, Clarity, Emotion, Simplicity.

import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
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

function principleDesc(key: string, desc: readonly string[]): string {
  if (desc.length === 0) return ''
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line, i) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`)
    .join('')}</div>`
}

function principleReadMore(href: string): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="common.readMore">Read more</span>
  </a>`
}

export function manifestoPage(): string {
  const [p1, p2, p3, p4] = PRINCIPLES
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: LAB OVERLAY (joystick left) -->
      ${labOverlaySection('content')}
      <!-- 1: Purpose (start, active) -->
      ${sectionShell('manifesto-01',
        contentTop(p1!.num, p1!.title, p1!.lead, 'large', p1!.key + '.title', p1!.key + '.lead'),
        contentBottom(`${principleDesc(p1!.key, p1!.desc)}${principleReadMore(p1!.href)}`),
        'content', true
      )}
      <!-- 2: Clarity -->
      ${sectionShell('manifesto-02',
        contentTop(p2!.num, p2!.title, p2!.lead, 'large', p2!.key + '.title', p2!.key + '.lead'),
        contentBottom(`${principleDesc(p2!.key, p2!.desc)}${principleReadMore(p2!.href)}`)
      )}
      <!-- 3: Emotion -->
      ${sectionShell('manifesto-03',
        contentTop(p3!.num, p3!.title, p3!.lead, 'large', p3!.key + '.title', p3!.key + '.lead'),
        contentBottom(`${principleDesc(p3!.key, p3!.desc)}${principleReadMore(p3!.href)}`)
      )}
      <!-- 4: Simplicity -->
      ${sectionShell('manifesto-04',
        contentTop(p4!.num, p4!.title, p4!.lead, 'large', p4!.key + '.title', p4!.key + '.lead'),
        contentBottom(`${principleDesc(p4!.key, p4!.desc)}${principleReadMore(p4!.href)}`)
      )}
      <!-- 5: NAVIGATION OVERLAY (joystick right) -->
      ${navOverlaySection('content')}
    </article>
  `
}
