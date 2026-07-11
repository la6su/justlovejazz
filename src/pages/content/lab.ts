// src/pages/content/lab.ts — Lab page (4 experiments)
// Each section = one R&D area.
import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

interface Experiment {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
}

const EXPERIMENTS: readonly Experiment[] = [
  {
    num: '01',
    title: 'Shader Lab',
    lead: 'GLSL & TSL fragments.',
    desc: ['Glass, iridescence, fluid simulation.', 'Every visual effect starts here.'],
    href: '/blog/glassmorphism-webgpu',
  },
  {
    num: '02',
    title: 'Audio Reactive',
    lead: 'Web Audio → visuals.',
    desc: ['Frequency-driven visuals.', 'Real-time analyser pipeline.'],
    href: '/blog/tsl-changes-everything',
  },
  {
    num: '03',
    title: 'Generative',
    lead: 'Procedural worlds.',
    desc: ['Noise and math.', 'Infinite variation from code.'],
    href: '/blog/undercurrent-webgpu-fluid',
  },
  {
    num: '04',
    title: 'GPU Particles',
    lead: '10k instanced points.',
    desc: ['On-demand rendering.', 'Zero idle draw calls.'],
    href: '/blog/on-demand-rendering',
  },
] as const

function expDesc(desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line) => `<p class="uk-text-meta uk-margin-remove">${line}</p>`)
    .join('')}</div>`
}

function expExplore(href: string): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    Explore
  </a>`
}

export function labPage(): string {
  const [e1, e2, e3, e4] = EXPERIMENTS
  return `
    <article class="jlz-page" data-page-view="lab">
      ${sectionShell('lab-01',
        contentTop(e1!.num, e1!.title, e1!.lead, 'large'),
        contentBottom(`${expDesc(e1!.desc)}${expExplore(e1!.href)}`),
        'content', true
      )}
      ${sectionShell('lab-02',
        contentTop(e2!.num, e2!.title, e2!.lead, 'large'),
        contentBottom(`${expDesc(e2!.desc)}${expExplore(e2!.href)}`)
      )}
      ${sectionShell('lab-03',
        contentTop(e3!.num, e3!.title, e3!.lead, 'large'),
        contentBottom(`${expDesc(e3!.desc)}${expExplore(e3!.href)}`)
      )}
      ${sectionShell('lab-04',
        contentTop(e4!.num, e4!.title, e4!.lead, 'large'),
        contentBottom(`${expDesc(e4!.desc)}${expExplore(e4!.href)}`)
      )}
    </article>
    ${FOOTER}
  `
}
