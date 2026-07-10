// src/pages/content/services.ts — Services page (6 sections, cube-map layout)
// Same structure as home: 0=secret, 1=intro(start), 2-4=main, 5=secret.
// Vertical cycles 1-4, horizontal toggles 0/5 (secret sides).

import { contentSection, contentTop, contentBottom, processTimeline } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function servicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU 3D', desc: 'Real-time GPU rendering with TSL shaders. 60fps on mid-range hardware.' },
    { num: '02', title: 'Spatial UI', desc: '3D-first interfaces with depth and presence. Beyond the flat screen.' },
    { num: '03', title: 'Shader Art', desc: 'Glass, iridescence, fluid simulation. Hand-written GPU programs.' },
    { num: '04', title: 'Performance', desc: 'On-demand rendering. Zero idle draw calls. Lighthouse-verified.' },
  ]
  const stack = [
    { title: '3D', items: ['Three.js + TSL', 'WebGPU / WebGL2'] },
    { title: 'UI', items: ['UIkit 3 + YooTheme Pro', 'TypeScript strict'] },
    { title: 'Perf', items: ['On-demand render', 'Lighthouse CI'] },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <!-- 0: SECRET LEFT — hidden, reachable via horizontal drag -->
      ${contentSection('services-secret-left',
        contentTop('HIDDEN', 'The other side', 'Every cube has faces you rarely see. Drag right to return.'),
        contentBottom(`<p class="uk-text-meta uk-margin-remove">← Drag right to return to services</p>`)
      )}
      <!-- 1: INTRO (start, active) -->
      ${contentSection('services-intro',
        contentTop('SERVICES', 'What We Build', 'Real-time 3D for the web. WebGPU first, WebGL2 everywhere.'),
        contentBottom(`<a href="mailto:hello@justlovejazz.com?subject=New%20project" class="uk-button uk-button-primary uk-button-large">Start a project</a>`),
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
      <!-- 4: Process — shared vertical timeline (same as home + manifesto) -->
      ${contentSection('services-process',
        contentTop('PROCESS', 'How we ship'),
        contentBottom(processTimeline())
      )}
      <!-- 5: SECRET RIGHT — hidden, reachable via horizontal drag -->
      ${contentSection('services-secret-right',
        contentTop('HIDDEN', 'The other side', 'You reached the edge of the cube. Drag left to return.'),
        contentBottom(`<p class="uk-text-meta uk-margin-remove">Drag left to return to services →</p>`)
      )}
    </article>
    ${FOOTER}
  `
}
