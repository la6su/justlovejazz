// src/pages/content/lab.ts — Lab page (4 experiments + 2 overlays)
//
// Sections 0 (Lab) and 5 (Navigation) are shared across all SPA pages.
// Main sections (1-4): Shader Lab, Audio Reactive, Generative, GPU Particles.

import {
  sectionShell,
  contentTop,
  storyBottom,
  i18nDesc,
  serviceExplore,
} from '../../sections/_shared/constants'
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

function experimentSection(exp: Experiment, isActive: boolean = false): string {
  const footer = `
    <div class="jlz-experiment-footer uk-flex uk-flex-wrap uk-flex-middle uk-width-1-1 uk-margin-remove-top">
      <span class="jlz-experiment-footer__mode uk-text-uppercase" data-i18n="${exp.modeKey}">${exp.mode}</span>
      <span class="jlz-experiment-footer__state uk-text-uppercase uk-text-muted" data-i18n="lab.sceneState">Isolated scene · in development</span>
      ${serviceExplore(exp.noteHref, 'lab.readNote', 'Read development note', 'uk-margin-auto-left')}
    </div>
  `
  return sectionShell(
    `${exp.key.replace('lab.', 'lab-')}`,
    contentTop(exp.num, exp.title, exp.lead, 'large', exp.key + '.title', exp.key + '.lead'),
    storyBottom(`${i18nDesc(exp.key, exp.desc)}${footer}`),
    'content',
    isActive,
  )
}

export function labPage(): string {
  const [e1, e2, e3, e4] = EXPERIMENTS
  return `
    <article class="jlz-page" data-page-view="lab">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      ${labOverlaySection('content')}
      <!-- 1: Shader Lab (start, active) -->
      ${experimentSection(e1!, true)}
      <!-- 2: Audio Reactive -->
      ${experimentSection(e2!)}
      <!-- 3: Generative -->
      ${experimentSection(e3!)}
      <!-- 4: GPU Particles -->
      ${experimentSection(e4!)}
      <!-- 5: MENU SHEET -->
      ${navOverlaySection('content')}
    </article>
  `
}
