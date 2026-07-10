// src/pages/content/services.ts — Services page (6 sections, Apple Watch layout)
// Uses contentSection/contentTop/contentBottom — same cube structure as home
// sections (TOP / 3D CENTER / BOTTOM). QF theme styles cards/buttons/icons.

import { contentSection, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs.', icon: 'cube' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces for depth and presence.', icon: 'album' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI.', icon: 'move' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, iridescence, particles.', icon: 'bolt' },
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
    { num: '01', title: 'Discover', desc: 'Research, audit, define the problem.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D prototypes, interaction design.' },
    { num: '03', title: 'Develop', desc: 'WebGPU, TSL shaders, TypeScript strict.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      ${contentSection('services-intro',
        contentTop('SERVICES', 'What We Build', 'From shader art to shipping product — real-time 3D, spatial design, and WebGPU expertise.'),
        contentBottom(`<a href="/app/#section-contact" class="uk-button uk-button-primary uk-button-large">Start a project</a>`),
        true
      )}
      ${contentSection('services-list',
        contentTop('CAPABILITIES', 'Six disciplines'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-3@m" uk-grid>
            ${services.map((s) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover">
                <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-bottom">
                  <span class="uk-h3 jlz-numeral">${s.num}</span>
                  <span uk-icon="icon: ${s.icon}; ratio: 1.2" class="uk-text-muted" aria-hidden="true"></span>
                </div>
                <h3 class="uk-card-title uk-margin-remove">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('services-stack',
        contentTop('STACK', 'The toolbox', 'Production-grade tools, not experiments'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
            ${stack.map((s) => `
              <div class="uk-card uk-card-default uk-card-body">
                <h3 class="uk-h5 uk-margin-small-bottom">${s.title}</h3>
                <ul class="uk-list uk-list-divider uk-text-meta">
                  ${s.items.map((item) => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('services-process',
        contentTop('HOW WE WORK', '4 steps'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
            ${steps.map((s) => `
              <div class="uk-text-center">
                <div class="uk-heading-large uk-margin-remove jlz-numeral">${s.num}</div>
                <h3 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('services-contact',
        contentTop("LET'S TALK", 'Start a project', "We're open for new projects. Tell us what you're building."),
        contentBottom(`
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large uk-margin-small-right">Get in touch</a>
          <a href="/blog" class="uk-button uk-button-default uk-button-large">Read blog</a>
        `)
      )}
      ${contentSection('services-values',
        contentTop('VALUES', 'Craft over speed.'),
        contentBottom(`
          <p class="uk-text-lead">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
          <div class="uk-grid uk-child-width-1-3@m uk-margin-large-top" uk-grid>
            <div><span uk-icon="icon: bolt; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Real-time, not canned</p></div>
            <div><span uk-icon="icon: copy; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Parity, not compromise</p></div>
            <div><span uk-icon="icon: heart; ratio: 1.5" aria-hidden="true"></span><p class="uk-text-meta uk-margin-small-top">Craft over speed</p></div>
          </div>
        `)
      )}
    </article>
    ${FOOTER}
  `
}
