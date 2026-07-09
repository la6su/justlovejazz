// src/pages/content/services.ts — Services page (big-number list layout)
//
// Content page — transparent over 3D canvas. 2 sections (overview + stack).
// Mobile-first: 4 services visible, 2 more on desktop via uk-hidden@s.

import { PAGE_REVEAL } from '../shared/constants'
import { FOOTER } from '../shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs. Native performance, zero plugins.' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces built for depth, parallax, and presence. Not flat pages — worlds.' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI, magnetic cursors, scroll-triggered sequences.' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, light, particles, audio-reactive visuals that feel alive.' },
  ]
  const servicesExtra = [
    { num: '05', title: 'Performance Engineering', desc: 'On-demand rendering, GPU instancing, chunked bundles, green Lighthouse scores.' },
    { num: '06', title: 'Brand Systems', desc: 'Visual identity, typography, motion language from favicon to fullscreen hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Services</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>What We Build</h1>
          <ul class="uk-list uk-margin-top" uk-scrollspy-class>
            ${services.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin">
                <span class="uk-h3 uk-text-muted uk-margin-right" style="min-width: 48px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top uk-visible@s">${s.desc}</p>
                  <p class="uk-text-meta uk-margin-small-top uk-hidden@s" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${s.desc}</p>
                </div>
              </li>
            `).join('')}
            ${servicesExtra.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin uk-hidden@s" uk-scrollspy-class>
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
    </article>
    ${FOOTER}
  `
}
