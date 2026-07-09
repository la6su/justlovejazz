// src/pages/content/manifesto.ts — Manifesto page (6 sections, Apple Watch layout)
// Replaces the old posts page. 3D content: WireframeTypography (3D wireframe text
// with TSL noise displacement) + glass cube + minimal particles.
//
// Manifesto sections:
//   0: Intro (light) — "Manifesto" title + lead
//   1: Principles (dark) — 4 principle cards
//   2: Craft (dark) — what we believe about craft
//   3: Process (dark) — how we work (4 steps)
//   4: Contact (light) — CTA
//   5: Values (dark) — closing statement

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function manifestoPage(): string {
  const principles = [
    { num: '01', title: 'Depth over surface', desc: 'We would rather ship one thing that feels alive than ten that feel flat.' },
    { num: '02', title: 'Craft over speed', desc: 'Real-time 3D, not canned video. Shaders, not textures. Type-safe, not stringly-typed.' },
    { num: '03', title: 'Performance is a feature', desc: '60fps on mid-range hardware. Zero idle draw calls. On-demand rendering by default.' },
    { num: '04', title: 'Parity, not compromise', desc: 'WebGPU today, WebGL2 fallback — bit-identical output. No user gets a worse experience.' },
  ]
  const steps = [
    { num: '01', title: 'Discover', desc: 'Research, audit, define the problem.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D, interaction prototypes.' },
    { num: '03', title: 'Develop', desc: 'WebGPU, TSL shaders, performance budgets.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve.' },
  ]
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: Intro (light) -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-intro">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; MANIFESTO</span>
            <h1 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">What we believe</h1>
            <p class="uk-text-meta">A studio philosophy in four principles</p>
          </div>
        </div>
      </section>

      <!-- 1: Principles (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-principles">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; PRINCIPLES</span>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-margin-top" uk-grid uk-scrollspy-class>
            ${principles.map((p) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover">
                <span class="uk-h3 uk-margin-right jlz-numeral">${p.num}</span>
                <h2 class="uk-h4 uk-margin-remove uk-margin-small-top">${p.title}</h2>
                <p class="uk-text-meta uk-margin-small-top">${p.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2: Craft (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-craft">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; CRAFT</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Real-time, not canned</h2>
          </div>
          <div uk-scrollspy-class>
            <p class="uk-text-lead">Every pixel is computed. Every frame is alive. Every interaction responds in real time.</p>
            <p class="uk-text-meta uk-margin-small-top">WebGPU compute shaders. TSL node graphs. Type-safe GPU programming. No video, no sprites, no tricks.</p>
          </div>
        </div>
      </section>

      <!-- 3: Process (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-process">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; HOW WE WORK</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">4 steps</h2>
          </div>
          <ul class="uk-list uk-list-divider uk-margin-top" uk-scrollspy-class>
            ${steps.map((s) => `
              <li class="uk-flex uk-flex-middle"><span class="uk-h3 uk-margin-right jlz-numeral">${s.num}</span><div class="uk-flex-1 uk-text-left"><h3 class="uk-h4 uk-margin-remove">${s.title}</h3><p class="uk-text-meta">${s.desc}</p></div></li>
            `).join('')}
          </ul>
        </div>
      </section>

      <!-- 4: Contact (light) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="manifesto-contact">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; LET'S TALK</span>
            <h2 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Start a project</h2>
          </div>
          <div uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">Get in touch</a>
          </div>
        </div>
      </section>

      <!-- 5: Values (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="manifesto-values">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; CLOSING</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Craft over speed.</h2>
          </div>
          <div uk-scrollspy-class>
            <p class="uk-text-meta">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
