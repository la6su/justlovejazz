// src/pages/content/services.ts — Services page (6 sections, Apple Watch layout)
// Mobile-first: less content, but precise and punchy. Same cube structure as home.
// Uses contentSection/contentTop/contentBottom (TOP / 3D CENTER / BOTTOM).

import { contentSection, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  // 4 core services (was 6) — punchy, not cluttered
  const services = [
    { num: '01', title: 'WebGPU 3D', desc: 'Real-time GPU. TSL shaders. 60fps.' },
    { num: '02', title: 'Spatial UI', desc: '3D-first interfaces. Depth + presence.' },
    { num: '03', title: 'Shader Art', desc: 'Glass. Iridescence. Fluid simulation.' },
    { num: '04', title: 'Performance', desc: 'On-demand rendering. Zero idle draw calls.' },
  ]
  // 3 stack pillars (was 4) — essentials only
  const stack = [
    { title: '3D', items: ['Three.js + TSL', 'WebGPU / WebGL2'] },
    { title: 'UI', items: ['UIkit 3 + QF', 'TypeScript strict'] },
    { title: 'Perf', items: ['On-demand render', 'Lighthouse CI'] },
  ]
  const steps = [
    { num: '01', title: 'Discover', desc: 'Audit + define.' },
    { num: '02', title: 'Design', desc: '3D prototypes.' },
    { num: '03', title: 'Develop', desc: 'WebGPU + TSL.' },
    { num: '04', title: 'Ship', desc: 'Launch + evolve.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      ${contentSection('services-intro',
        contentTop('SERVICES', 'What We Build', 'Real-time 3D for the web. WebGPU first.'),
        contentBottom(`<a href="/app/#section-contact" class="uk-button uk-button-primary uk-button-large">Start a project</a>`),
        true
      )}
      ${contentSection('services-list',
        contentTop('CAPABILITIES', 'Four disciplines'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
            ${services.map((s) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center">
                <div class="uk-heading-large uk-margin-remove jlz-numeral">${s.num}</div>
                <h3 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('services-stack',
        contentTop('STACK', 'The toolbox'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-3@m" uk-grid>
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
        contentTop('PROCESS', '4 steps'),
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
        contentTop("LET'S TALK", 'Start a project'),
        contentBottom(`
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">Get in touch</a>
        `)
      )}
      ${contentSection('services-values',
        contentTop('VALUES', 'Craft over speed'),
        contentBottom(`
          <p class="uk-text-lead">Depth over surface. One thing alive &gt; ten things flat.</p>
        `)
      )}
    </article>
    ${FOOTER}
  `
}
