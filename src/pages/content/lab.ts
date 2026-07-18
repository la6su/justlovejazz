// src/pages/content/lab.ts — Lab page (4 experiments + 2 overlays)
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.
// Main sections (1-4): Shader Lab, Audio Reactive, Generative, GPU Particles.

import { sectionShell, contentTop, contentBottom } from '../../sections/_shared/constants'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

interface Experiment {
  num: string
  title: string
  lead: string
  desc: string[]
  noteHref: string
  mode: string
  modeKey: string
  key: string
}

const EXPERIMENTS: readonly Experiment[] = [
  {
    num: '01',
    title: 'Shader Lab',
    lead: 'Materials that carry light.',
    desc: [
      'Transmission, iridescence and fluid fields.',
      'A scene starts with one controllable visual rule.',
    ],
    noteHref: '/blog/glassmorphism-webgpu',
    mode: 'TSL material study',
    modeKey: 'lab.shaderLab.mode',
    key: 'lab.shaderLab',
  },
  {
    num: '02',
    title: 'Audio Reactive',
    lead: 'Sound becomes spatial input.',
    desc: [
      'Frequency data becomes movement, not decoration.',
      'The scene must also make sense in silence.',
    ],
    noteHref: '/blog/tsl-changes-everything',
    mode: 'Web Audio input',
    modeKey: 'lab.audioReactive.mode',
    key: 'lab.audioReactive',
  },
  {
    num: '03',
    title: 'Generative',
    lead: 'A system, not a loop.',
    desc: [
      'Noise, rules and controlled variation.',
      'Every parameter needs a visible consequence.',
    ],
    noteHref: '/blog/undercurrent-webgpu-fluid',
    mode: 'Procedural system',
    modeKey: 'lab.generative.mode',
    key: 'lab.generative',
  },
  {
    num: '04',
    title: 'GPU Particles',
    lead: 'Density without idle cost.',
    desc: [
      'Instancing, GPU state and restraint.',
      'No animation is worth an always-on render loop.',
    ],
    noteHref: '/blog/on-demand-rendering',
    mode: 'Performance study',
    modeKey: 'lab.gpuParticles.mode',
    key: 'lab.gpuParticles',
  },
] as const

function expDesc(key: string, desc: readonly string[]): string {
  return `<div class="jlz-service-desc uk-margin-small-top">${desc
    .map(
      (line, i) =>
        `<p class="uk-text-meta uk-margin-remove" data-i18n="${key}.desc${i + 1}">${line}</p>`,
    )
    .join('')}</div>`
}

function experimentFooter(experiment: Experiment): string {
  return `
    <div class="jlz-experiment-footer">
      <span class="jlz-experiment-footer__mode" data-i18n="${experiment.modeKey}">${experiment.mode}</span>
      <span class="jlz-experiment-footer__state" data-i18n="lab.sceneState">Isolated scene · in development</span>
      <a href="${experiment.noteHref}" class="jlz-service-explore uk-button uk-button-default uk-button-small">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        <span data-i18n="lab.readNote">Read development note</span>
      </a>
    </div>
  `
}

export function labPage(): string {
  const [e1, e2, e3, e4] = EXPERIMENTS
  return `
    <article class="jlz-page" data-page-view="lab">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      ${labOverlaySection('content')}
      <!-- 1: Shader Lab (start, active) -->
      ${sectionShell(
        'lab-01',
        contentTop(e1!.num, e1!.title, e1!.lead, 'large', e1!.key + '.title', e1!.key + '.lead'),
        contentBottom(`${expDesc(e1!.key, e1!.desc)}${experimentFooter(e1!)}`),
        'content',
        true,
      )}
      <!-- 2: Audio Reactive -->
      ${sectionShell(
        'lab-02',
        contentTop(e2!.num, e2!.title, e2!.lead, 'large', e2!.key + '.title', e2!.key + '.lead'),
        contentBottom(`${expDesc(e2!.key, e2!.desc)}${experimentFooter(e2!)}`),
      )}
      <!-- 3: Generative -->
      ${sectionShell(
        'lab-03',
        contentTop(e3!.num, e3!.title, e3!.lead, 'large', e3!.key + '.title', e3!.key + '.lead'),
        contentBottom(`${expDesc(e3!.key, e3!.desc)}${experimentFooter(e3!)}`),
      )}
      <!-- 4: GPU Particles -->
      ${sectionShell(
        'lab-04',
        contentTop(e4!.num, e4!.title, e4!.lead, 'large', e4!.key + '.title', e4!.key + '.lead'),
        contentBottom(`${expDesc(e4!.key, e4!.desc)}${experimentFooter(e4!)}`),
      )}
      <!-- 5: MENU SHEET -->
      ${navOverlaySection('content')}
    </article>
  `
}
