// src/pages/content/manifesto.ts — Manifesto page (6 sections, cube-map layout)
// Apple Watch layout: each cube face = one principle.
//   TOP: eyebrow (num) + title + lead
//   BOTTOM: description fragments + READ MORE link
// Same rhythm as services page — consistent cube-face experience.
//
// Cube mapping:
//   0 (secret left)  → 06 Future
//   1 (intro/start)  → 01 Purpose (active on load)
//   2                → 02 Clarity
//   3                → 03 Emotion
//   4                → 04 Simplicity
//   5 (secret right) → 05 Process

import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

interface Principle {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
  /** i18n key prefix — e.g. 'manifesto.purpose' → title/lead/descN keys. */
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
  {
    num: '05',
    title: 'Process',
    lead: 'We explore. We prototype. We test. We fail. We improve.',
    desc: [],
    href: '/services',
    key: 'manifesto.process',
  },
  {
    num: '06',
    title: 'Future',
    lead: 'Technologies change. Principles remain.',
    desc: [],
    href: '/',
    key: 'manifesto.future',
  },
] as const

/** Description fragments — each line a short sentence, stacked vertically.
 *  Reuses .jlz-service-desc from services page (same Apple Watch rhythm).
 *  key: i18n prefix — generates data-i18n="${key}.desc${i+1}" per line. */
function principleDesc(key: string, desc: readonly string[]): string {
  if (desc.length === 0) return ''
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line, i) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`)
    .join('')}</div>`
}

/** READ MORE link — pill button with accent dot. Reuses .jlz-service-explore. */
function principleReadMore(href: string): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="common.readMore">Read more</span>
  </a>`
}

/** Secret-section hint — which way to drag to return. */
function secretHint(direction: 'left' | 'right'): string {
  const arrow = direction === 'left' ? '← Drag right to return to manifesto' : 'Drag left to return to manifesto →'
  const key = direction === 'left' ? 'hint.returnLeft' : 'hint.returnRight'
  return `<p class="uk-text-meta uk-margin-top jlz-text-subtle" data-i18n="${key}">${arrow}</p>`
}

export function manifestoPage(): string {
  const [p1, p2, p3, p4, p5, p6] = PRINCIPLES
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: SECRET LEFT → 06 Future -->
      ${sectionShell('manifesto-future',
        contentTop(p6!.num, p6!.title, p6!.lead, 'large', p6!.key + '.title', p6!.key + '.lead'),
        contentBottom(`${principleDesc(p6!.key, p6!.desc)}${principleReadMore(p6!.href)}${secretHint('left')}`)
      )}
      <!-- 1: INTRO (start, active) → 01 Purpose -->
      ${sectionShell('manifesto-01',
        contentTop(p1!.num, p1!.title, p1!.lead, 'large', p1!.key + '.title', p1!.key + '.lead'),
        contentBottom(`${principleDesc(p1!.key, p1!.desc)}${principleReadMore(p1!.href)}`),
        'content', true
      )}
      <!-- 2: → 02 Clarity -->
      ${sectionShell('manifesto-02',
        contentTop(p2!.num, p2!.title, p2!.lead, 'large', p2!.key + '.title', p2!.key + '.lead'),
        contentBottom(`${principleDesc(p2!.key, p2!.desc)}${principleReadMore(p2!.href)}`)
      )}
      <!-- 3: → 03 Emotion -->
      ${sectionShell('manifesto-03',
        contentTop(p3!.num, p3!.title, p3!.lead, 'large', p3!.key + '.title', p3!.key + '.lead'),
        contentBottom(`${principleDesc(p3!.key, p3!.desc)}${principleReadMore(p3!.href)}`)
      )}
      <!-- 4: → 04 Simplicity -->
      ${sectionShell('manifesto-04',
        contentTop(p4!.num, p4!.title, p4!.lead, 'large', p4!.key + '.title', p4!.key + '.lead'),
        contentBottom(`${principleDesc(p4!.key, p4!.desc)}${principleReadMore(p4!.href)}`)
      )}
      <!-- 5: SECRET RIGHT → 05 Process -->
      ${sectionShell('manifesto-05',
        contentTop(p5!.num, p5!.title, p5!.lead, 'large', p5!.key + '.title', p5!.key + '.lead'),
        contentBottom(`${principleDesc(p5!.key, p5!.desc)}${principleReadMore(p5!.href)}${secretHint('right')}`)
      )}
    </article>
    ${FOOTER}
  `
}
