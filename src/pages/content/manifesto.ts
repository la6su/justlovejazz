// src/pages/content/manifesto.ts — Manifesto page (6 sections, Apple Watch layout)
// Rich content with UIkit 3 builder elements. Each principle gets visual weight.
// 3D content: WireframeTypography (3D wireframe text) + glass cube + particles.

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function manifestoPage(): string {
  const principles = [
    { num: '01', title: 'Depth over surface', desc: 'We would rather ship one thing that feels alive than ten that feel flat. Real-time 3D, not canned video. Shaders, not textures.', icon: 'cube' },
    { num: '02', title: 'Craft over speed', desc: 'Type-safe GPU programming. TSL node graphs, not raw GLSL strings. TypeScript strict, not stringly-typed. Every pixel computed.', icon: 'code' },
    { num: '03', title: 'Performance is a feature', desc: '60fps on mid-range hardware. Zero idle draw calls. On-demand rendering by default. The GPU sleeps when you read.', icon: 'bolt' },
    { num: '04', title: 'Parity, not compromise', desc: 'WebGPU today, WebGL2 fallback — bit-identical output. No user gets a worse experience. Same code, both backends.', icon: 'copy' },
  ]
  const craftPoints = [
    { title: 'Real-time', desc: 'Every frame is computed. No video, no sprites, no tricks.' },
    { title: 'Type-safe', desc: 'TSL node graphs compile to WGSL + GLSL from TypeScript.' },
    { title: 'On-demand', desc: 'Zero draw calls when idle. Ambient breathing every 2.5s.' },
    { title: 'Parity-guaranteed', desc: 'Portable integer hash. Exact sRGB. ACES with epsilon.' },
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
            <h1 class="uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom">What we believe</h1>
            <p class="uk-text-lead uk-margin-small-top">A studio philosophy in four principles. Built from shipping real work, not theory.</p>
          </div>
          <div uk-scrollspy-class class="uk-margin-large-top">
            <a href="/app/services" class="uk-button uk-button-primary uk-button-large">See services →</a>
          </div>
        </div>
      </section>

      <!-- 1: Principles (dark) — 4 large principle cards with icons -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-principles">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class class="uk-text-center">
            <span class="jlz-eyebrow">&gt; PRINCIPLES</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Four principles</h2>
            <p class="uk-text-meta uk-margin-small-top">Non-negotiable. Every project, every time.</p>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-margin-large-top" uk-grid uk-scrollspy-class>
            ${principles.map((p) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover jlz-principle-card">
                <div class="uk-flex uk-flex-between uk-flex-top uk-margin-small-bottom">
                  <span class="uk-heading-medium jlz-numeral">${p.num}</span>
                  <span uk-icon="icon: ${p.icon}; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
                </div>
                <h3 class="uk-card-title uk-margin-remove">${p.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${p.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2: Craft (dark) — 4 craft points with icons -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-craft">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class class="uk-text-center">
            <span class="jlz-eyebrow">&gt; CRAFT</span>
            <h2 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Real-time, not canned</h2>
            <p class="uk-text-lead uk-margin-small-top">Every pixel is computed. Every frame is alive. Every interaction responds in real time.</p>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-large-top" uk-grid uk-scrollspy-class>
            ${craftPoints.map((c) => `
              <div class="uk-text-center">
                <span uk-icon="icon: bolt; ratio: 2" class="uk-text-primary" aria-hidden="true"></span>
                <h3 class="uk-h5 uk-margin-small-top uk-margin-remove-bottom">${c.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${c.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 3: Process (dark) — numbered timeline -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="manifesto-process">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class class="uk-text-center">
            <span class="jlz-eyebrow">&gt; HOW WE WORK</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">4 steps</h2>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-large-top" uk-grid uk-scrollspy-class>
            ${steps.map((s) => `
              <div class="uk-text-center">
                <div class="uk-heading-large uk-margin-remove jlz-numeral">${s.num}</div>
                <h3 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 4: Contact (light) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="manifesto-contact">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; LET'S TALK</span>
            <h2 class="uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom">Start a project</h2>
            <p class="uk-text-lead uk-margin-small-top">If this resonates, we should talk.</p>
          </div>
          <div uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">Get in touch</a>
          </div>
        </div>
      </section>

      <!-- 5: Values (dark) — closing statement -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="manifesto-values">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; CLOSING</span>
            <h2 class="uk-heading-2xlarge uk-margin-small-top uk-margin-remove-bottom">Craft over speed.</h2>
          </div>
          <div uk-scrollspy-class>
            <p class="uk-text-lead">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
            <div class="uk-margin-large-top">
              <a href="/app" class="uk-button uk-button-default uk-button-large">Enter 3D experience →</a>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
