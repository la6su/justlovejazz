// src/pages/content/services.ts — Services page (6 sections, Apple Watch layout)
// Rich content using UIkit 3 builder elements + QF theme classes.
// Each section has distinct visual identity — not just text on transparent bg.

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs. 60fps on mid-range hardware.', icon: 'cube' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces for depth and presence. Apple Watch-inspired layouts.', icon: 'album' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI, custom cursor effects.', icon: 'move' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, iridescence, particles, fluid simulation.', icon: 'bolt' },
    { num: '05', title: 'Performance', desc: 'On-demand rendering, GPU instancing, zero idle draw calls.', icon: 'bolt' },
    { num: '06', title: 'Identity', desc: 'Typography, motion language, shader-driven hero sections.', icon: 'tag' },
  ]
  const stack = [
    { title: '3D & Shaders', items: ['Three.js + TSL', 'WebGPU first, WebGL2 fallback', 'Compute shaders', 'CubeCamera + PMREM'] },
    { title: 'UI & Engineering', items: ['UIkit 3 + YooTheme Pro', 'TypeScript strict', 'Bun + Vite 8', 'Less + design tokens'] },
    { title: 'Performance', items: ['On-demand rendering', 'GPU instancing', 'Chunked bundles', 'Lighthouse CI'] },
    { title: 'Identity', items: ['Typography systems', 'Motion language', 'Shader-driven hero', 'Glassmorphism'] },
  ]
  const steps = [
    { num: '01', title: 'Discover', desc: 'Research, audit, define the problem. Performance budget established.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D prototypes, interaction design. No static mockups.' },
    { num: '03', title: 'Develop', desc: 'WebGPU, TSL shaders, TypeScript strict. Tests + Lighthouse CI.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve. On-demand rendering keeps it fast.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: Intro (light) -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-intro">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; SERVICES</span>
            <h1 class="uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom">What We Build</h1>
            <p class="uk-text-lead uk-margin-small-top">From shader art to shipping product — real-time 3D, spatial design, and WebGPU expertise.</p>
          </div>
          <div uk-scrollspy-class class="uk-margin-large-top">
            <a href="/app/#section-contact" class="uk-button uk-button-primary uk-button-large">Start a project</a>
          </div>
        </div>
      </section>

      <!-- 1: Services list (dark) — 6 service cards with icons -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-list">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class class="uk-text-center">
            <span class="jlz-eyebrow">&gt; CAPABILITIES</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Six disciplines</h2>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-3@m uk-margin-large-top" uk-grid uk-scrollspy-class>
            ${services.map((s) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover jlz-service-card">
                <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
                  <span class="uk-h3 jlz-numeral">${s.num}</span>
                  <span uk-icon="icon: ${s.icon}; ratio: 1.2" class="uk-text-muted" aria-hidden="true"></span>
                </div>
                <h3 class="uk-card-title uk-margin-remove">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2: Stack (dark) — 4 stack cards with item lists -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-stack">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class class="uk-text-center">
            <span class="jlz-eyebrow">&gt; STACK</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">The toolbox</h2>
            <p class="uk-text-meta uk-margin-small-top">Production-grade tools, not experiments</p>
          </div>
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-large-top" uk-grid uk-scrollspy-class>
            ${stack.map((s) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover">
                <h3 class="uk-h5 uk-margin-small-bottom">${s.title}</h3>
                <ul class="uk-list uk-list-divider uk-text-meta">
                  ${s.items.map((item) => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 3: Process steps (dark) — timeline with numbered steps -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-process">
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
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-contact">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; LET'S TALK</span>
            <h2 class="uk-heading-xlarge uk-margin-small-top uk-margin-remove-bottom">Start a project</h2>
            <p class="uk-text-lead uk-margin-small-top">We're open for new projects. Tell us what you're building.</p>
          </div>
          <div uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large uk-margin-small-right">Get in touch</a>
            <a href="/blog" class="uk-button uk-button-default uk-button-large">Read blog</a>
          </div>
        </div>
      </section>

      <!-- 5: Values (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-values">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; VALUES</span>
            <h2 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Craft over speed.</h2>
          </div>
          <div uk-scrollspy-class>
            <p class="uk-text-lead">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
            <div class="uk-grid uk-child-width-1-3@m uk-margin-large-top" uk-grid>
              <div><span uk-icon="icon: bolt; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Real-time, not canned</p></div>
              <div><span uk-icon="icon: copy; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Parity, not compromise</p></div>
              <div><span uk-icon="icon: heart; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Craft over speed</p></div>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
