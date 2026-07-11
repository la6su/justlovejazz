// src/pages/content/services.ts — Services page (6 sections, cube-map layout)
// Apple Watch layout: each cube face = one service.
//   TOP: eyebrow (num) + title
//   BOTTOM: description fragments + EXPLORE link
// Left/right cube faces (0/5) are "secret" — LAB + PLAYGROUND experiments.
//
// Cube mapping:
//   0 (secret left)  → 05 LAB
//   1 (intro/start)  → 01 Creative Direction (active on load)
//   2                → 02 Interactive Development
//   3                → 03 Motion & Realtime
//   4                → 04 AI Systems
//   5 (secret right) → 06 PLAYGROUND

import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

interface Service {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
  /** i18n key prefix — e.g. 'services.creativeDirection' → title/lead/descN keys. */
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
    title: 'Interactive Development',
    lead: 'Realtime experiences built with modern web technologies.',
    desc: ['Performance comes first.', 'Motion follows purpose.'],
    href: '/blog/on-demand-rendering',
    key: 'services.interactiveDev',
  },
  {
    num: '03',
    title: 'Motion & Realtime',
    lead: 'Motion is part of the interface. Not decoration.',
    desc: ['Navigation.', 'Feedback.', 'Emotion.'],
    href: '/blog/tsl-changes-everything',
    key: 'services.motionRealtime',
  },
  {
    num: '04',
    title: 'AI Systems',
    lead: 'Creative workflows powered by AI.',
    desc: ['Generation.', 'Automation.', 'Iteration.'],
    href: '/blog/undercurrent-webgpu-fluid',
    key: 'services.aiSystems',
  },
  {
    num: '05',
    title: 'LAB',
    lead: 'Experiments. Always in progress.',
    desc: ['A sandbox for shader, audio, and procedural R&D.'],
    href: '/',
    key: 'services.lab',
  },
  {
    num: '06',
    title: 'PLAYGROUND',
    lead: 'Nothing to sell. Just play.',
    desc: ['Open experiments, half-broken demos, things we build for joy.'],
    href: '/',
    key: 'services.playground',
  },
] as const

/** Description fragments — each line a short sentence, stacked vertically.
 *  Mobile-first: concise copy, generous line-height, muted color.
 *  key: i18n prefix — generates data-i18n="${key}.desc${i+1}" per line.
 *  English text stays as the no-JS fallback default content. */
function serviceDesc(key: string, desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line, i) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`)
    .join('')}</div>`
}

/** EXPLORE link — pill button with accent dot. UIKit3 button base + custom.
 *  key: i18n key for the CTA label (defaults to 'common.explore'). */
function serviceExplore(href: string, key: string = 'common.explore'): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="${key}">Explore</span>
  </a>`
}

/** Secret-section hint — which way to drag to return. */
function secretHint(direction: 'left' | 'right'): string {
  const arrow = direction === 'left' ? '← Drag right to return to services' : 'Drag left to return to services →'
  const key = direction === 'left' ? 'hint.returnLeft' : 'hint.returnRight'
  return `<p class="uk-text-meta uk-margin-top jlz-text-subtle" data-i18n="${key}">${arrow}</p>`
}

export function servicesPage(): string {
  const [s1, s2, s3, s4, s5, s6] = SERVICES
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: SECRET LEFT → 05 LAB -->
      ${sectionShell('services-lab',
        contentTop(s5!.num, s5!.title, s5!.lead, 'large', s5!.key + '.title', s5!.key + '.lead'),
        contentBottom(`${serviceDesc(s5!.key, s5!.desc)}${serviceExplore(s5!.href)}${secretHint('left')}`)
      )}
      <!-- 1: INTRO (start, active) → 01 Creative Direction -->
      ${sectionShell('services-01',
        contentTop(s1!.num, s1!.title, s1!.lead, 'large', s1!.key + '.title', s1!.key + '.lead'),
        contentBottom(`${serviceDesc(s1!.key, s1!.desc)}${serviceExplore(s1!.href)}`),
        'content', true
      )}
      <!-- 2: → 02 Interactive Development -->
      ${sectionShell('services-02',
        contentTop(s2!.num, s2!.title, s2!.lead, 'large', s2!.key + '.title', s2!.key + '.lead'),
        contentBottom(`${serviceDesc(s2!.key, s2!.desc)}${serviceExplore(s2!.href)}`)
      )}
      <!-- 3: → 03 Motion & Realtime -->
      ${sectionShell('services-03',
        contentTop(s3!.num, s3!.title, s3!.lead, 'large', s3!.key + '.title', s3!.key + '.lead'),
        contentBottom(`${serviceDesc(s3!.key, s3!.desc)}${serviceExplore(s3!.href)}`)
      )}
      <!-- 4: → 04 AI Systems -->
      ${sectionShell('services-04',
        contentTop(s4!.num, s4!.title, s4!.lead, 'large', s4!.key + '.title', s4!.key + '.lead'),
        contentBottom(`${serviceDesc(s4!.key, s4!.desc)}${serviceExplore(s4!.href)}`)
      )}
      <!-- 5: SECRET RIGHT → 06 PLAYGROUND -->
      ${sectionShell('services-playground',
        contentTop(s6!.num, s6!.title, s6!.lead, 'large', s6!.key + '.title', s6!.key + '.lead'),
        contentBottom(`${serviceDesc(s6!.key, s6!.desc)}${serviceExplore(s6!.href)}${secretHint('right')}`)
      )}
    </article>
    ${FOOTER}
  `
}
