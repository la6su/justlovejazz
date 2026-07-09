// src/pages/content/services.ts — Services page (6 sections, Apple Watch layout)
// TOP (eyebrow+title) / 3D CENTER (glass cube) / BOTTOM (UI panel)
// TUI-like: terminal cursor eyebrows, monospace labels, compact

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs.' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces for depth and presence.' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI.' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, light, particles.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: Intro (light) -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-intro">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; SERVICES</span>
            <h1 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">What We Build</h1>
            <p class="uk-text-meta">From shader art to shipping product</p>
          </div>
        </div>
      </section>

      <!-- 1: Services list (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-list">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; SERVICES LIST</span>
          </div>
          <ul class="uk-list uk-margin-top" uk-scrollspy-class>
            ${services.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin">
                <span class="uk-h3 uk-text-muted uk-margin-right jlz-numeral">${s.num}</span>
                <div class="uk-flex-1 uk-text-left">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>

      <!-- 2: Stack (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-stack">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; STACK</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">The toolbox</h2>
          </div>
          <div class="uk-grid uk-child-width-1-2@m uk-margin-top" uk-grid uk-scrollspy-class>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-h5">3D & Shaders</h3>
              <p class="uk-text-meta">Three.js + TSL, WebGPU first with WebGL2 fallback.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-h5">UI & Engineering</h3>
              <p class="uk-text-meta">UIkit 3, TypeScript strict, Bun + Vite, Less.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-h5">Performance</h3>
              <p class="uk-text-meta">On-demand rendering, GPU instancing, chunked bundles.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-h5">Identity</h3>
              <p class="uk-text-meta">Typography, motion language, shader-driven hero.</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body">
              <h3 class="uk-h5">Audio Reactive</h3>
              <p class="uk-text-meta">Web Audio API analyser, frequency-driven visuals.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3: Process steps (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-process">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; HOW WE WORK</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">4 steps</h2>
          </div>
          <ul class="uk-list uk-list-divider uk-margin-top" uk-scrollspy-class>
            <li class="uk-flex uk-flex-middle"><span class="uk-h3 uk-margin-right jlz-numeral">01</span><div class="uk-flex-1 uk-text-left"><h3 class="uk-h4 uk-margin-remove">Discover</h3><p class="uk-text-meta">Research, audit, define the problem.</p></div></li>
            <li class="uk-flex uk-flex-middle"><span class="uk-h3 uk-margin-right jlz-numeral">02</span><div class="uk-flex-1 uk-text-left"><h3 class="uk-h4 uk-margin-remove">Design</h3><p class="uk-text-meta">Art direction, 3D, interaction prototypes.</p></div></li>
            <li class="uk-flex uk-flex-middle"><span class="uk-h3 uk-margin-right jlz-numeral">03</span><div class="uk-flex-1 uk-text-left"><h3 class="uk-h4 uk-margin-remove">Develop</h3><p class="uk-text-meta">WebGPU, TSL shaders, performance budgets.</p></div></li>
            <li class="uk-flex uk-flex-middle"><span class="uk-h3 uk-margin-right jlz-numeral">04</span><div class="uk-flex-1 uk-text-left"><h3 class="uk-h4 uk-margin-remove">Ship</h3><p class="uk-text-meta">Launch, measure, evolve.</p></div></li>
          </ul>
        </div>
      </section>

      <!-- 4: Contact (light) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-contact">
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
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-values">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow">&gt; VALUES</span>
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
