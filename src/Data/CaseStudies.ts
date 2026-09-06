import type { CaseStudy } from '../core/caseStudies'

/**
 * Editorial anchor cases. These are intentionally review-state entries until
 * the proof sources are approved for public publication.
 */
export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    projectId: 'ebb-vibes',
    status: 'review',
    disclosure: 'self-initiated',
    outcome: 'A realtime visual music interface for an immersive listening session.',
    context: 'A studio experiment exploring how sound can become a navigable visual state.',
    problem: 'A linear player did not communicate the changing texture of the music.',
    role: 'Creative direction, interaction design and realtime implementation.',
    constraints: ['One canvas', 'Progressive loading', 'Reduced-motion support'],
    response: 'A demand-driven WebGPU scene ties visual response to the listening state.',
    stack: ['Vue', 'Three.js', 'WebGPU', 'TSL'],
    result: 'The experience makes the transition from sound to visual state legible.',
    proof: [
      {
        label: 'Runtime',
        value: 'WebGPUBackend with TSL post graph',
        source: 'docs/evidence/phase7-live-gate/2026-09-06T09-01-40-525Z-report.json',
      },
    ],
    media: [
      {
        src: '/assets/projects/ebb-vibes/detail.webp',
        alt: 'Abstract white waveform in a dark realtime music scene',
        width: 1600,
        height: 900,
        kind: 'image',
      },
    ],
    ctaLabel: 'Start a similar project',
  },
  {
    projectId: 'mono-sunday',
    status: 'review',
    disclosure: 'experimental',
    outcome: 'A quiet interface study built around texture, rhythm and absence.',
    context: 'An experimental visual system for a minimal ambient release.',
    problem: 'A sparse composition needed enough movement to feel alive without becoming noisy.',
    role: 'Art direction, visual system and interaction design.',
    constraints: ['Minimal palette', 'Readable type', 'No continuous decorative motion'],
    response: 'A restrained composition uses contrast, space and one responsive visual anchor.',
    stack: ['Vue', 'Three.js', 'UIkit'],
    result: 'The interface leaves room for the content while keeping the listening state visible.',
    proof: [
      {
        label: 'Artifact',
        value: 'Interactive visual prototype',
        source: 'studio review required before publication',
      },
    ],
    media: [
      {
        src: '/assets/projects/mono-sunday/detail.webp',
        alt: 'Soft monochrome abstract texture for an ambient interface study',
        width: 1600,
        height: 900,
        kind: 'image',
      },
    ],
    ctaLabel: 'Discuss a visual system',
  },
  {
    projectId: 'nocturne-blue',
    status: 'review',
    disclosure: 'self-initiated',
    outcome: 'A particle-led visual language for late-hour ambient frequencies.',
    context: 'A self-initiated study in translating low-frequency atmosphere into motion.',
    problem: 'A static cover could not carry the depth and drift of the underlying sound.',
    role: 'Concept, motion direction and realtime scene implementation.',
    constraints: ['Stable frame pacing', 'Accessible semantic layer', 'WebGPU/WebGL parity'],
    response:
      'Layered particles and liquid light create depth while the DOM keeps the story readable.',
    stack: ['Vue', 'Three.js', 'WebGPU', 'Particles'],
    result:
      'The visual system gives ambient material a spatial rhythm without adding interface noise.',
    proof: [
      {
        label: 'Review state',
        value: 'Prototype evidence pending approval',
        source: 'studio review required before publication',
      },
    ],
    media: [
      {
        src: '/assets/projects/nocturne-blue/detail.webp',
        alt: 'Blue and violet particle field dissolving into darkness',
        width: 1600,
        height: 900,
        kind: 'image',
      },
    ],
    ctaLabel: 'Build an atmospheric interface',
  },
]

export const CASE_STUDY_BY_PROJECT = new Map(
  CASE_STUDIES.map((caseStudy) => [caseStudy.projectId, caseStudy]),
)
