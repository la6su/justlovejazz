// src/pages/content/services.ts — Services page (6 sections, cube-map layout)
// Same structure as home: 0=secret, 1=intro(start), 2-4=main, 5=secret.
// Vertical cycles 1-4, horizontal toggles 0/5 (secret sides).

import { contentSection, contentTop, contentBottom, PROCESS_STEPS } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU 3D', desc: 'Real-time GPU. TSL shaders. 60fps.' },
    { num: '02', title: 'Spatial UI', desc: '3D-first interfaces. Depth + presence.' },
    { num: '03', title: 'Shader Art', desc: 'Glass. Iridescence. Fluid simulation.' },
    { num: '04', title: 'Performance', desc: 'On-demand rendering. Zero idle draw calls.' },
  ]
  const stack = [
    { title: '3D', items: ['Three.js + TSL', 'WebGPU / WebGL2'] },
    { title: 'UI', items: ['UIkit 3 + QF', 'TypeScript strict'] },
    { title: 'Perf', items: ['On-demand render', 'Lighthouse CI'] },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: SECRET LEFT — hidden, reachable via horizontal drag -->
      ${contentSection('services-secret-left',
        contentTop('HIDDEN', 'Secret', 'Drag back to explore services.'),
        contentBottom(`<p class="uk-text-meta">← Drag right to return</p>`)
      )}
      <!-- 1: INTRO (start, active) -->
      ${contentSection('services-intro',
        contentTop('SERVICES', 'What We Build', 'Real-time 3D for the web. WebGPU first.'),
        contentBottom(`<a href="/app/#section-contact" class="uk-button uk-button-primary uk-button-large">Start a project</a>`),
        true
      )}
      <!-- 2: Capabilities -->
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
      <!-- 3: Stack -->
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
      <!-- 4: Process -->
      ${contentSection('services-process',
        contentTop('PROCESS', '4 steps'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
            ${PROCESS_STEPS.map((s) => `
              <div class="uk-text-center">
                <div class="uk-heading-large uk-margin-remove jlz-numeral">${s.num}</div>
                <h3 class="uk-h4 uk-margin-small-top uk-margin-remove-bottom">${s.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      <!-- 5: SECRET RIGHT — hidden, reachable via horizontal drag -->
      ${contentSection('services-secret-right',
        contentTop('HIDDEN', 'Secret', 'Drag back to explore services.'),
        contentBottom(`<p class="uk-text-meta">Drag left to return →</p>`)
      )}
    </article>
    ${FOOTER}
  `
}
