// src/sections/_shared/home-data.ts — Unified home section data + template
//
// All 6 home cube faces use the same Apple Watch template:
//   TOP: eyebrow (num) + title + lead
//   BOTTOM: description fragments + EXPLORE link (or custom content)
//
// Cube face → content mapping (face order is fixed by 3D SplashCube):
//   0 (secret left)  → 05 Lab
//   1 (intro/start)  → 01 Philosophy (active on load)
//   2                → 02 Works
//   3                → 03 Services
//   4                → 04 Manifesto
//   5 (secret right) → 06 Contact

import { REVEAL } from './constants'

export interface HomeSectionData {
  num: string
  title: string
  lead: string
  desc: string[]
  /** EXPLORE link href, or null for sections without one (e.g. Contact). */
  exploreHref: string | null
  /** Custom bottom content (overrides desc + explore). Used for Contact. */
  customBottom?: string
}

export const HOME_SECTIONS: readonly HomeSectionData[] = [
  {
    num: '05',
    title: 'Lab',
    lead: 'Always in progress.',
    desc: ['We explore.', 'We prototype.', 'We push boundaries.'],
    exploreHref: '/app',
  },
  {
    num: '01',
    title: 'Studio',
    lead: 'Remote · EU · since 2019.',
    desc: ['A small studio crafting expressive browser experiences.', 'Glass · motion · light — powered by WebGPU.'],
    exploreHref: '/app/services',
  },
  {
    num: '02',
    title: 'Works',
    lead: 'Selected projects that define our way.',
    desc: ['Case studies.', 'Process. Results.'],
    exploreHref: '/blog',
  },
  {
    num: '03',
    title: 'Services',
    lead: 'From strategy to implementation.',
    desc: ['We cover the full cycle of digital products.', 'Explore our capabilities.'],
    exploreHref: '/app/services',
  },
  {
    num: '04',
    title: 'Manifesto',
    lead: 'This is what guides us.',
    desc: ['Our principles.', 'Our way of thinking.', 'Our promises.'],
    exploreHref: '/app/manifesto',
  },
  {
    num: '06',
    title: 'Contact',
    lead: "Let's create something great together.",
    desc: [],
    exploreHref: null,
    customBottom: `
      <p class="uk-text-meta uk-margin-small-top jlz-text-subtle">@ justlovejazz</p>
      <div class="uk-flex uk-flex-center uk-flex-wrap uk-margin-top jlz-flex-gap-small">
        <a href="mailto:hello@justlovejazz.com" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          Email
        </a>
        <a href="https://t.me/justlovejazz" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          Telegram
        </a>
        <a href="https://github.com/la6su" target="_blank" rel="noopener" class="jlz-service-explore uk-button uk-button-default uk-button-small">
          <span class="jlz-service-explore__dot" aria-hidden="true"></span>
          GitHub
        </a>
      </div>
    `,
  },
] as const

/** Generate a unified home cube-face section.
 *  Uses data-section for 3D sync + Subtitles (glitch eyebrow on section change).
 *  headingTier: 'large' for main sections, 'xlarge' for the hero (Philosophy). */
export function homeSection(
  data: HomeSectionData,
  dataSection: string,
  headingTier: 'medium' | 'large' | 'xlarge' = 'large',
  extraBottomAttrs: string = '',
): string {
  const descHtml = data.desc.length > 0
    ? `<div class="jlz-service-desc uk-margin-small-top">${data.desc.map((line) => `<p class="uk-text-meta uk-margin-remove">${line}</p>`).join('')}</div>`
    : ''
  const exploreHtml = data.exploreHref
    ? `<a href="${data.exploreHref}" class="jlz-service-explore uk-button uk-button-default uk-button-small uk-margin-top">
        <span class="jlz-service-explore__dot" aria-hidden="true"></span>
        Explore
      </a>`
    : ''
  const bottomContent = data.customBottom ?? `${descHtml}${exploreHtml}`

  return `
    <section
             class="uk-section uk-section-small uk-section-large@m" id="section-${dataSection}" data-section="${dataSection}">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <!-- TOP -->
          <div ${REVEAL}>
            <span class="jlz-eyebrow" data-eyebrow>${data.num}</span>
            <h2 class="studio-title uk-heading-${headingTier} uk-margin-small-top uk-margin-remove-bottom">${data.title}</h2>
            <p class="uk-text-lead uk-margin-small-top">${data.lead}</p>
          </div>
          <!-- BOTTOM -->
          <div ${REVEAL} ${extraBottomAttrs}>
            ${bottomContent}
          </div>
        </div>
      </div>
    </section>
  `
}
