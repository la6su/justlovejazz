// src/pages/content/manifesto.ts — Manifesto page (6 sections, cube-map layout)
// Same structure as home: 0=secret, 1=intro(start), 2-4=main, 5=secret.

import { contentSection, contentTop, contentBottom, processTimeline } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function manifestoPage(): string {
  const principles = [
    { num: '01', title: 'Depth over surface', desc: 'One alive thing beats ten flat things.', example: 'A single iridescent cube you can rotate beats a gallery of static renders.' },
    { num: '02', title: 'Craft over speed', desc: 'Type-safe GPU code. No raw GLSL strings.', example: 'TSL nodes give us compile-time checks where GLSL gives us black screens.' },
    { num: '03', title: 'Performance is a feature', desc: '60fps on mid-range. Zero idle draw calls.', example: 'On-demand rendering means the GPU sleeps when you do — battery stays full.' },
    { num: '04', title: 'Parity, not compromise', desc: 'WebGPU + WebGL2. Bit-identical output.', example: 'One codebase, two backends. Safari users see what Chrome users see.' },
  ]
  return `
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: SECRET LEFT — hidden, reachable via horizontal drag -->
      ${contentSection('manifesto-secret-left',
        contentTop('HIDDEN', 'The other side', 'Every cube has faces you rarely see. Drag right to return.'),
        contentBottom(`<p class="uk-text-meta uk-margin-remove">← Drag right to return to manifesto</p>`)
      )}
      <!-- 1: INTRO (start, active) -->
      ${contentSection('manifesto-intro',
        contentTop('MANIFESTO', 'What we believe', 'Four principles. Built from shipping real work.', 'large'),
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
                <p class="uk-text-meta jlz-text-subtle uk-margin-small-top uk-margin-remove-bottom">e.g. ${p.example}</p>
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
          <p class="uk-text-meta uk-margin-small-top">No video. No sprites. No tricks. Just shaders, every frame, on your GPU.</p>
        `)
      )}
      <!-- 4: Process — shared vertical timeline (same as home + services) -->
      ${contentSection('manifesto-process',
        contentTop('PROCESS', 'How we ship'),
        contentBottom(processTimeline())
      )}
      <!-- 5: SECRET RIGHT — hidden, reachable via horizontal drag -->
      ${contentSection('manifesto-secret-right',
        contentTop('HIDDEN', 'The other side', 'You reached the edge of the cube. Drag left to return.'),
        contentBottom(`<p class="uk-text-meta uk-margin-remove">Drag left to return to manifesto →</p>`)
      )}
    </article>
    ${FOOTER}
  `
}
