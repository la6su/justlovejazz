// src/pages/content/services.ts — Services page (6 sections, cube-face structure)
//
// 6 sections like home: Intro (light) → 4 unique services sections → Contact (light)
// + 2 secret side sections (Lab/Process) reachable via horizontal joystick.
//
// Intro and Contact (last) are light/inverse by default — matches home pattern.
// Footer is included.

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs. Native performance, zero plugins.' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces built for depth, parallax, and presence. Not flat pages — worlds.' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI, magnetic cursors, scroll-triggered sequences.' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, light, particles, audio-reactive visuals that feel alive.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: Lab (secret left, top face) — reused from home, experiments -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Services</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>What We Build</h1>
          <p class="uk-text-lead uk-margin-top" uk-scrollspy-class>From shader art to shipping product — 3D, motion, and engineering that holds up under real traffic.</p>
        </div>
      </section>

      <!-- 1: Services list — big-number layout -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-list">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <ul class="uk-list uk-margin-top" uk-scrollspy-class>
            ${services.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin">
                <span class="uk-h3 uk-text-muted uk-margin-right" style="min-width: 48px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>

      <!-- 2: Stack — toolbox -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-stack">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Stack</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>The toolbox</h2>
          <div class="uk-grid uk-child-width-1-2@m uk-margin-top" uk-grid>
            <div uk-scrollspy-class>
              <h3 class="uk-h5">3D & Shaders</h3>
              <p class="uk-text-meta">Three.js + TSL, WebGPU first with WebGL2 fallback. MeshPhysicalMaterial for glass, PMREM for IBL.</p>
            </div>
            <div uk-scrollspy-class>
              <h3 class="uk-h5">UI & Engineering</h3>
              <p class="uk-text-meta">UIkit 3, TypeScript strict, Bun + Vite, Prisma. Zero runtime errors in production.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3: Process — how we work -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-process">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>How We Work</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>4 steps</h2>
          <ul class="uk-list uk-list-divider uk-margin-top">
            <li class="uk-flex uk-flex-middle uk-margin"><span class="uk-h3 uk-margin-right" style="min-width:56px;opacity:0.5;">01</span><div class="uk-flex-1"><h3 class="uk-h4 uk-margin-remove">Discover</h3><p class="uk-text-meta">Research, audit, define the problem.</p></div></li>
            <li class="uk-flex uk-flex-middle uk-margin"><span class="uk-h3 uk-margin-right" style="min-width:56px;opacity:0.5;">02</span><div class="uk-flex-1"><h3 class="uk-h4 uk-margin-remove">Design</h3><p class="uk-text-meta">Art direction, 3D, interaction prototypes.</p></div></li>
            <li class="uk-flex uk-flex-middle uk-margin"><span class="uk-h3 uk-margin-right" style="min-width:56px;opacity:0.5;">03</span><div class="uk-flex-1"><h3 class="uk-h4 uk-margin-remove">Develop</h3><p class="uk-text-meta">WebGPU, TSL shaders, performance budgets.</p></div></li>
            <li class="uk-flex uk-flex-middle uk-margin"><span class="uk-h3 uk-margin-right" style="min-width:56px;opacity:0.5;">04</span><div class="uk-flex-1"><h3 class="uk-h4 uk-margin-remove">Ship</h3><p class="uk-text-meta">Launch, measure, evolve.</p></div></li>
          </ul>
        </div>
      </section>

      <!-- 4: Contact (last, light/inverse) — CTA -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-contact">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-large uk-margin-remove" uk-scrollspy-class>Let's Talk</h2>
          <p class="uk-text-lead uk-margin-top" uk-scrollspy-class>Got a project that needs glass, motion, and light?</p>
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large uk-margin-top" uk-scrollspy-class>Start a project</a>
        </div>
      </section>

      <!-- 5: Process (secret right) — values -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="services-values">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Values</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>Craft over speed.</h2>
          <p class="uk-text-meta uk-margin-top" uk-scrollspy-class>Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
