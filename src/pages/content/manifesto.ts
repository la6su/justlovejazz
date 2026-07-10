// src/pages/content/manifesto.ts — Manifesto page (6 sections, cube-map layout)
// Same structure as home: 0=secret, 1=intro(start), 2-4=main, 5=secret.

import { contentSection, contentTop, contentBottom, PROCESS_STEPS } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function manifestoPage(): string {
  const principles = [
    { num: '01', title: 'Depth over surface', desc: 'One alive thing &gt; ten flat things.' },
    { num: '02', title: 'Craft over speed', desc: 'Type-safe GPU code. No raw GLSL strings.' },
    { num: '03', title: 'Performance is a feature', desc: '60fps on mid-range. Zero idle draw calls.' },
    { num: '04', title: 'Parity, not compromise', desc: 'WebGPU + WebGL2. Bit-identical output.' },
  ]
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: SECRET LEFT — hidden, reachable via horizontal drag -->
      ${contentSection('manifesto-secret-left',
        contentTop('HIDDEN', 'Secret', 'Drag back to explore manifesto.'),
        contentBottom(`<p class="uk-text-meta">← Drag right to return</p>`)
      )}
      <!-- 1: INTRO (start, active) -->
      ${contentSection('manifesto-intro',
        contentTop('MANIFESTO', 'What we believe', 'Four principles. Built from shipping real work.'),
        contentBottom(`<a href="/app/services" class="uk-button uk-button-primary uk-button-large">See services →</a>`),
        true
      )}
      <!-- 2: Principles -->
      ${contentSection('manifesto-principles',
        contentTop('PRINCIPLES', 'Four principles'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s" uk-grid>
            ${principles.map((p) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover">
                <div class="uk-heading-medium uk-margin-remove jlz-numeral">${p.num}</div>
                <h3 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${p.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${p.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      <!-- 3: Craft -->
      ${contentSection('manifesto-craft',
        contentTop('CRAFT', 'Real-time, not canned'),
        contentBottom(`
          <p class="uk-text-lead">Every pixel is computed. Every frame is alive.</p>
          <p class="uk-text-meta uk-margin-small-top">No video. No sprites. No tricks.</p>
        `)
      )}
      <!-- 4: Process -->
      ${contentSection('manifesto-process',
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
      ${contentSection('manifesto-secret-right',
        contentTop('HIDDEN', 'Secret', 'Drag back to explore manifesto.'),
        contentBottom(`<p class="uk-text-meta">Drag left to return →</p>`)
      )}
    </article>
    ${FOOTER}
  `
}
