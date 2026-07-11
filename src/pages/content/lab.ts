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
  /** i18n key prefix — e.g. 'lab.shaderLab' → title/lead/descN keys. */
  key: string
}

const EXPERIMENTS: readonly Experiment[] = [
  {
    num: '01',
    title: 'Shader Lab',
    lead: 'GLSL & TSL fragments.',
    desc: ['Glass, iridescence, fluid simulation.', 'Every visual effect starts here.'],
    href: '/blog/glassmorphism-webgpu',
    key: 'lab.shaderLab',
  },
  {
    num: '02',
    title: 'Audio Reactive',
    lead: 'Web Audio → visuals.',
    desc: ['Frequency-driven visuals.', 'Real-time analyser pipeline.'],
    href: '/blog/tsl-changes-everything',
    key: 'lab.audioReactive',
  },
  {
    num: '03',
    title: 'Generative',
    lead: 'Procedural worlds.',
    desc: ['Noise and math.', 'Infinite variation from code.'],
    href: '/blog/undercurrent-webgpu-fluid',
    key: 'lab.generative',
  },
  {
    num: '04',
    title: 'GPU Particles',
    lead: '10k instanced points.',
    desc: ['On-demand rendering.', 'Zero idle draw calls.'],
    href: '/blog/on-demand-rendering',
    key: 'lab.gpuParticles',
  },
] as const

/** Description fragments — each line a short sentence, stacked vertically.
 *  key: i18n prefix — generates data-i18n="${key}.desc${i+1}" per line. */
function expDesc(key: string, desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map((line, i) => `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`)
    .join('')}</div>`
}

/** EXPLORE link — pill button with accent dot. key defaults to 'common.explore'. */
function expExplore(href: string, key: string = 'common.explore'): string {
  return `<a href="${href}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
    <span class="jlz-service-explore__dot" aria-hidden="true"></span>
    <span data-i18n="${key}">Explore</span>
  </a>`
}

export function labPage(): string {
  const [e1, e2, e3, e4] = EXPERIMENTS
  return `
    <article class="jlz-page" data-page-view="lab">
      ${sectionShell('lab-01',
        contentTop(e1!.num, e1!.title, e1!.lead, 'large', e1!.key + '.title', e1!.key + '.lead'),
        contentBottom(`${expDesc(e1!.key, e1!.desc)}${expExplore(e1!.href)}`),
        'content', true
      )}
      ${sectionShell('lab-02',
        contentTop(e2!.num, e2!.title, e2!.lead, 'large', e2!.key + '.title', e2!.key + '.lead'),
        contentBottom(`${expDesc(e2!.key, e2!.desc)}${expExplore(e2!.href)}`)
      )}
      ${sectionShell('lab-03',
        contentTop(e3!.num, e3!.title, e3!.lead, 'large', e3!.key + '.title', e3!.key + '.lead'),
        contentBottom(`${expDesc(e3!.key, e3!.desc)}${expExplore(e3!.href)}`)
      )}
      ${sectionShell('lab-04',
        contentTop(e4!.num, e4!.title, e4!.lead, 'large', e4!.key + '.title', e4!.key + '.lead'),
        contentBottom(`${expDesc(e4!.key, e4!.desc)}${expExplore(e4!.href)}`)
      )}
    </article>
    ${FOOTER}
  `
}
