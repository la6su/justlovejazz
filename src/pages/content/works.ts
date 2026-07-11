// src/pages/content/works.ts — Works page (4 case studies)
// Each section = one selected project.
import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

interface Work {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
}

const WORKS: readonly Work[] = [
  {
    num: '01',
    title: 'Undercurrent',
    lead: 'WebGPU fluid simulation.',
    desc: ['Real-time GPU fluid solver.', '60fps on mid-range hardware.'],
    href: '/blog/undercurrent-webgpu-fluid',
  },
  {
    num: '02',
    title: 'Mono Sunday',
    lead: 'Minimal portfolio.',
    desc: ['3D-first interface.', 'On-demand rendering.'],
    href: '/blog/on-demand-rendering',
  },
  {
    num: '03',
    title: 'Till at Night',
    lead: 'Audio-reactive 3D.',
    desc: ['Web Audio analyser.', 'Frequency-driven visuals.'],
    href: '/blog/tsl-changes-everything',
  },
  {
    num: '04',
    title: 'Ebb Vibes',
    lead: 'Generative typography.',
    desc: ['Procedural worlds from noise.', 'Shader-driven hero.'],
    href: '/blog/glassmorphism-webgpu',
  },
] as const

function workDesc(desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line) => `<p class="uk-text-meta uk-margin-remove">${line}</p>`)
    .join('')}</div>`
}

function workExplore(href: string): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    Read more
  </a>`
}

export function worksPage(): string {
  const [w1, w2, w3, w4] = WORKS
  return `
    <article class="jlz-page" data-page-view="works">
      ${sectionShell('works-01',
        contentTop(w1!.num, w1!.title, w1!.lead, 'large'),
        contentBottom(`${workDesc(w1!.desc)}${workExplore(w1!.href)}`),
        'content', true
      )}
      ${sectionShell('works-02',
        contentTop(w2!.num, w2!.title, w2!.lead, 'large'),
        contentBottom(`${workDesc(w2!.desc)}${workExplore(w2!.href)}`)
      )}
      ${sectionShell('works-03',
        contentTop(w3!.num, w3!.title, w3!.lead, 'large'),
        contentBottom(`${workDesc(w3!.desc)}${workExplore(w3!.href)}`)
      )}
      ${sectionShell('works-04',
        contentTop(w4!.num, w4!.title, w4!.lead, 'large'),
        contentBottom(`${workDesc(w4!.desc)}${workExplore(w4!.href)}`)
      )}
    </article>
    ${FOOTER}
  `
}
