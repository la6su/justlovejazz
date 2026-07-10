// src/pages/content/manifesto.ts — Manifesto page (6 sections, Apple Watch layout)
// Uses contentSection/contentTop/contentBottom — same cube structure as home.
// 3D content: WireframeTypography + glass cube + particles (from WorldConfig).

import { contentSection, contentTop, contentBottom } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function manifestoPage(): string {
  const principles = [
    { num: '01', title: 'Depth over surface', desc: 'We would rather ship one thing that feels alive than ten that feel flat.', icon: 'cube' },
    { num: '02', title: 'Craft over speed', desc: 'Type-safe GPU programming. TSL node graphs, not raw GLSL strings.', icon: 'code' },
    { num: '03', title: 'Performance is a feature', desc: '60fps on mid-range hardware. Zero idle draw calls. On-demand rendering.', icon: 'bolt' },
    { num: '04', title: 'Parity, not compromise', desc: 'WebGPU today, WebGL2 fallback — bit-identical output.', icon: 'copy' },
  ]
  const craftPoints = [
    { title: 'Real-time', desc: 'Every frame is computed. No video, no sprites.' },
    { title: 'Type-safe', desc: 'TSL node graphs compile to WGSL + GLSL from TypeScript.' },
    { title: 'On-demand', desc: 'Zero draw calls when idle. Ambient breathing every 2.5s.' },
    { title: 'Parity-guaranteed', desc: 'Portable integer hash. Exact sRGB. ACES with epsilon.' },
  ]
  const steps = [
    { num: '01', title: 'Discover', desc: 'Research, audit, define the problem.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D, interaction prototypes.' },
    { num: '03', title: 'Develop', desc: 'WebGPU, TSL shaders, performance budgets.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve.' },
  ]
  return `
    <article class="jlz-page" data-page-view="manifesto">
      ${contentSection('manifesto-intro',
        contentTop('MANIFESTO', 'What we believe', 'A studio philosophy in four principles. Built from shipping real work, not theory.'),
        contentBottom(`<a href="/app/services" class="uk-button uk-button-primary uk-button-large">See services →</a>`),
        true
      )}
      ${contentSection('manifesto-principles',
        contentTop('PRINCIPLES', 'Four principles', 'Non-negotiable. Every project, every time.'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s" uk-grid>
            ${principles.map((p) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover">
                <div class="uk-flex uk-flex-between uk-flex-top uk-margin-small-bottom">
                  <span class="uk-heading-medium jlz-numeral">${p.num}</span>
                  <span uk-icon="icon: ${p.icon}; ratio: 1.5" class="uk-text-muted" aria-hidden="true"></span>
                </div>
                <h3 class="uk-card-title uk-margin-remove">${p.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${p.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('manifesto-craft',
        contentTop('CRAFT', 'Real-time, not canned', 'Every pixel is computed. Every frame is alive.'),
        contentBottom(`
          <div class="uk-grid uk-child-width-1-2@s uk-child-width-1-4@m" uk-grid>
            ${craftPoints.map((c) => `
              <div class="uk-text-center">
                <span uk-icon="icon: bolt; ratio: 2" class="uk-text-primary" aria-hidden="true"></span>
                <h3 class="uk-h5 uk-margin-small-top uk-margin-remove-bottom">${c.title}</h3>
                <p class="uk-text-meta uk-margin-small-top">${c.desc}</p>
              </div>
            `).join('')}
          </div>
        `)
      )}
      ${contentSection('manifesto-process',
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
      ${contentSection('manifesto-contact',
        contentTop("LET'S TALK", 'Start a project', 'If this resonates, we should talk.'),
        contentBottom(`<a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">Get in touch</a>`)
      )}
      ${contentSection('manifesto-values',
        contentTop('CLOSING', 'Craft over speed.'),
        contentBottom(`
          <p class="uk-text-lead">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
          <div class="uk-margin-large-top">
            <a href="/app" class="uk-button uk-button-default uk-button-large">Enter 3D experience →</a>
          </div>
        `)
      )}
    </article>
    ${FOOTER}
  `
}
