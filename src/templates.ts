// templates.ts — HTML string templates for SPA rendering.
// 6 sections matching junni reference (1:1 with 3D scene groups).
//
// Built with UIkit 3 components:
//  - uk-container uk-container-expand   (section shells)
//  - uk-flex uk-flex-column uk-flex-*   (between / top / split layouts)
//  - uk-card uk-card-body uk-card-hover (feature + lab cards)
//  - uk-button uk-button-default        (CTA glass buttons)
//  - uk-grid + uk-child-width-*         (responsive grids)
//  - uk-list uk-list-divider            (process timeline)
//  - uk-text-meta / uk-text-lead        (typography utilities)
//  - uk-heading-medium                  (section titles)
//  - uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"
//    (per-element stagger reveal — attributes live directly on each
//    reveal target so UIkit auto-initialises them)
//
// `.studio-title` is preserved on every title — NoiseText animation
// (entry-app.ts) keys off it; do not remove that class.
//
// `.jlz-section-shell` is a small custom hook for non-UIKit layout
// details (responsive padding, position, z-index) that UIkit utilities
// do not cover. It augments `uk-container uk-container-expand`.

// 6 sections: intro, about, flexible, challenge, innovative, contact
// Index: 0=intro, 1=about, 2=flexible, 3=challenge, 4=innovative, 5=contact
export function homePage(): string {
  // Reusable scrollspy attribute — keeps markup DRY and the value
  // consistent across sections (so a future tweak is one-line).
  const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

  return `
    <!-- ═══ section-studio → 8 child sections (6 main + 2 secret side) ═══ -->
    <div class="section-studio uk-position-relative">

      <!-- 00: LAB (secret left) — Experiments & interactive demos -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-lab" data-section="lab">
        <div class="section-bg section-bg--lab uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center jlz-section-shell jlz-section-shell--between">
            <div class="jlz-hero uk-flex uk-flex-column uk-flex-middle">
              <h2 class="studio-title studio-title--about" ${REVEAL}>SECRET</h2>
              <p class="studio-body uk-text-lead" ${REVEAL}>
                Experiments at the edge of what browsers can do. Shader art, audio
                reactive visuals, generative geometry — this is where we play.
              </p>
            </div>
            <div class="jlz-lab-grid uk-grid-small uk-child-width-1-2@s" uk-grid ${REVEAL}>
              <div class="uk-card uk-card-body uk-card-hover" data-lab="shader">
                <span class="jlz-lab-card__icon">◈</span>
                <span class="uk-card-title">Shader Playground</span>
                <span class="jlz-lab-card__desc">Live GLSL fragments</span>
              </div>
              <div class="uk-card uk-card-body uk-card-hover" data-lab="audio">
                <span class="jlz-lab-card__icon">◉</span>
                <span class="uk-card-title">Audio Reactive</span>
                <span class="jlz-lab-card__desc">Sound → geometry</span>
              </div>
              <div class="uk-card uk-card-body uk-card-hover" data-lab="gen">
                <span class="jlz-lab-card__icon">⬡</span>
                <span class="uk-card-title">Generative</span>
                <span class="jlz-lab-card__desc">Procedural worlds</span>
              </div>
              <div class="uk-card uk-card-body uk-card-hover" data-lab="particles">
                <span class="jlz-lab-card__icon">⁂</span>
                <span class="uk-card-title">GPU Particles</span>
                <span class="jlz-lab-card__desc">10k instances</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 01: INTRO — baku cube center, hero at top, scroll hint at bottom -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-intro" data-section="intro">
        <div class="section-bg section-bg--intro uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center jlz-section-shell jlz-section-shell--between">
            <div class="jlz-hero uk-flex uk-flex-column uk-flex-middle">
              <h1 class="studio-title studio-title--hero jlz-hero__title"
                  data-content-id="hero-title">l@6</h1>
              <span class="uk-text-meta" ${REVEAL}>Studio · est. 2019</span>
              <p class="uk-text-lead" ${REVEAL}>
                Cinematic interfaces for the modern browser — built from
                <span class="uk-text-bold">glass</span>,
                <span class="uk-text-bold">motion</span>, and
                <span class="uk-text-bold">light</span>.
              </p>
            </div>
            <div class="jlz-scroll-hint" aria-hidden="true" ${REVEAL}>
              <span class="jlz-scroll-hint__label">Let's play?</span>
              <span class="jlz-scroll-hint__line"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 02: ABOUT — two-column split, cube visible through center gap -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-about" data-section="about">
        <div class="section-bg section-bg--about uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-grid uk-child-width-1-2@m uk-grid-match uk-text-left jlz-section-shell jlz-section-shell--split" uk-grid>
            <div class="uk-width-1-2@m uk-flex uk-flex-middle">
              <h2 class="studio-title studio-title--about uk-heading-medium"
                  data-content-id="about-title">About</h2>
            </div>
            <div class="uk-width-1-2@m" ${REVEAL}>
              <p class="studio-body uk-text-lead" data-content-id="about-text">
                Craft meets code. Every pixel is choreographed. Every frame, considered.
                We build for browsers, but we design for people.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 03: FLEXIBLE — pure 3D scene. Cube is hero. Minimal corner label only.
           Animated text background + full-screen title texture rendered in WebGL.
           Section is kept for scroll positioning only. -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-flexible" data-section="flexible">
        <div class="section-bg section-bg--flexible uk-position-cover" data-dynamic-content>
          <div class="jlz-corner-label" aria-hidden="true">
            <p class="jlz-corner-label__hint">Drag the cube · Scroll to morph</p>
          </div>
        </div>
      </section>

      <!-- 04: CHALLENGE / WORKS — gallery, cube + carousel morph -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-challenge" data-section="challenge">
        <div class="section-bg section-bg--challenge uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-top uk-text-center jlz-section-shell jlz-section-shell--top">
            <h2 class="studio-title studio-title--challenge uk-heading-medium"
                data-content-id="challenge-title">Works</h2>
            <p class="studio-body uk-text-lead" ${REVEAL}
               data-content-id="challenge-text">
              Six interactive experiences. Drag to spin the carousel,
              click any card to open.
            </p>
          </div>

          <div id="project-overlay" class="uk-position-z-index"></div>
        </div>
      </section>

      <!-- 05: INNOVATIVE — feature cards with glassmorphism -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-innovative" data-section="innovative">
        <div class="section-bg section-bg--innovative uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center jlz-section-shell jlz-section-shell--between">
            <div class="uk-flex uk-flex-column uk-flex-middle uk-margin">
              <h2 class="studio-title uk-heading-medium"
                  data-content-id="innovative-title">Innovative</h2>
              <p class="studio-body uk-text-lead" ${REVEAL}
                 data-content-id="innovative-text">
                We explore every edge of the platform — engineering
                experiences that feel like stepping into another world.
              </p>
            </div>
            <div class="jlz-feature-grid uk-grid-small uk-child-width-1-3@m uk-grid-match" uk-grid>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="jlz-feature-card__index">01</span>
                <h3 class="uk-card-title">WebGPU Native</h3>
                <p class="jlz-feature-card__body">
                  Compute shaders and render pipelines on the GPU.
                  Native performance, zero plugins.
                </p>
              </article>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="jlz-feature-card__index">02</span>
                <h3 class="uk-card-title">Real-time Shaders</h3>
                <p class="jlz-feature-card__body">
                  TSL node graphs compiled on the fly. Materials that
                  react to light, sound, and gesture.
                </p>
              </article>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="jlz-feature-card__index">03</span>
                <h3 class="uk-card-title">Spatial Design</h3>
                <p class="jlz-feature-card__body">
                  3D-first interfaces built for depth, parallax, and
                  presence — not flat pages.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- 06: CONTACT — large CTA, glass buttons -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-contact" data-section="contact">
        <div class="section-bg section-bg--contact uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-top uk-text-center jlz-section-shell jlz-section-shell--top">
            <h2 class="studio-title uk-heading-medium"
                data-content-id="contact-title">Contact</h2>
            <p class="jlz-contact-tagline" ${REVEAL}
               data-content-id="contact-text">
              Let’s build something extraordinary.
            </p>
            <a href="mailto:hello@justlovejazz.com"
               class="jlz-contact-email" ${REVEAL}>hello@justlovejazz.com</a>
            <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center"
                 uk-grid ${REVEAL}
                 data-content-id="contact-grid">
              <a href="mailto:hello@justlovejazz.com"
                 class="uk-button uk-button-default jlz-glass-btn jlz-glass-btn--primary">
                <span class="jlz-glass-btn__icon" uk-icon="icon: mail; ratio: 1.1"
                      aria-hidden="true"></span>
                <span>Start a project</span>
              </a>
              <a href="https://github.com" class="uk-button uk-button-default jlz-glass-btn"
                 target="_blank" rel="noopener">
                <span class="jlz-glass-btn__icon" uk-icon="icon: github; ratio: 1.1"
                      aria-hidden="true"></span>
                <span>GitHub</span>
              </a>
              <a href="https://twitter.com" class="uk-button uk-button-default jlz-glass-btn"
                 target="_blank" rel="noopener">
                <span class="jlz-glass-btn__icon" uk-icon="icon: twitter; ratio: 1.1"
                      aria-hidden="true"></span>
                <span>Twitter</span>
              </a>
            </div>
            <p class="jlz-contact-footer" ${REVEAL}>© 2026 l@6.su — Crafted with Love</p>
          </div>
        </div>
      </section>

      <!-- 07: PROCESS (secret right) — Workflow timeline & studio manifesto -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-process" data-section="process">
        <div class="section-bg section-bg--process uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center jlz-section-shell jlz-section-shell--between">
            <div class="jlz-hero uk-flex uk-flex-column uk-flex-middle">
              <h2 class="studio-title studio-title--about" ${REVEAL}>PROCESS</h2>
              <p class="studio-body uk-text-lead" ${REVEAL}>
                From concept to launch — every project follows a rhythm.
                Research, design, develop, ship. Then iterate.
              </p>
            </div>
            <ul class="uk-list uk-list-divider" ${REVEAL}>
              <li class="uk-flex uk-flex-middle">
                <span class="jlz-timeline__num">01</span>
                <span class="jlz-timeline__label">Research</span>
                <span class="jlz-timeline__desc">Understand the problem space</span>
              </li>
              <li class="uk-flex uk-flex-middle">
                <span class="jlz-timeline__num">02</span>
                <span class="jlz-timeline__label">Develop</span>
                <span class="jlz-timeline__desc">Prototype, iterate, refine</span>
              </li>
              <li class="uk-flex uk-flex-middle">
                <span class="jlz-timeline__num">04</span>
                <span class="jlz-timeline__label">Launch</span>
                <span class="jlz-timeline__desc">Ship, measure, evolve</span>
              </li>
            </ul>
            <div class="uk-margin-top" ${REVEAL}>
              <p>We believe the web is a canvas for emotion. <br class="uk-visible@s" />
              Every pixel earns its place. Every frame tells a story.</p>
              <p class="jlz-manifesto__sig">— JUSTLOVEJAZZ</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `
}

export function renderPage(): string {
  return homePage()
}
