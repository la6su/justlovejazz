// templates.ts — HTML string templates for SPA rendering.
// 8 sections matching junni reference (6 main + 2 secret side, 1:1 with 3D scene groups).
//
// Built with UIkit 3 utility classes ONLY for layout / spacing / typography:
//   - uk-position-relative + uk-height-viewport   (SPA stack parent)
//   - uk-position-cover                           (section background layer)
//   - uk-container uk-container-expand            (section shells)
//   - uk-padding                                  (section padding)
//   - uk-flex uk-flex-column uk-flex-*            (between / top layouts)
//   - uk-grid + uk-child-width-*                  (responsive grids)
//   - uk-card uk-card-body uk-card-hover          (feature + lab cards)
//   - uk-button uk-button-default                 (CTA buttons)
//   - uk-list uk-list-divider                     (process timeline)
//   - uk-text-meta / uk-text-lead / uk-text-bold  (typography)
//   - uk-heading-medium / uk-heading-xlarge       (section titles + hero)
//   - uk-link                                     (contact email)
//   - uk-icon                                     (button icons)
//   - uk-height-1-1                               (fill parent height)
//   - uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"
//
// `.studio-title` is preserved on every title — NoiseText animation
// (entry-app.ts) keys off this selector. UIkit heading classes are applied
// alongside for sizing / weight / typography.
//
// Custom classes that remain (no UIKit equivalent):
//   - .studio-title            — NoiseText animation target (UIkit heading
//                                classes applied alongside for sizing/weight)
//   - .jlz-scroll-hint*        — custom scroll indicator animation
//   - .jlz-corner-label*       — custom positioning for flexible section
//   - .jlz-glass-btn (--primary) — glassmorphism modifier for uk-button
//   - .jlz-fs-*                — ProjectOverlay fullscreen styles
//                                (defined in main.less, used by ProjectOverlay.ts)

export function homePage(): string {
  // Reusable scrollspy attribute — keeps markup DRY and the value
  // consistent across sections (so a future tweak is one-line).
  const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

  return `
    <!-- ═══ 8 child sections (6 main + 2 secret side) ═══ -->
    <div class="uk-position-relative" uk-height-viewport>

      <!-- 00: LAB (secret left) — Experiments & interactive demos -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-lab" data-section="lab">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
            <div class="uk-flex uk-flex-column uk-flex-middle">
              <h2 class="studio-title uk-heading-medium" ${REVEAL}>SECRET</h2>
              <p class="uk-text-lead" ${REVEAL}>
                Experiments at the edge of what browsers can do. Shader art, audio
                reactive visuals, generative geometry — this is where we play.
              </p>
            </div>
            <div class="uk-grid-small uk-child-width-1-2@s" uk-grid ${REVEAL}>
              <div class="uk-card uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="shader">
                <span class="uk-text-large" aria-hidden="true">◈</span>
                <h3 class="uk-card-title">Shader Playground</h3>
                <p class="uk-text-meta">Live GLSL fragments</p>
              </div>
              <div class="uk-card uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="audio">
                <span class="uk-text-large" aria-hidden="true">◉</span>
                <h3 class="uk-card-title">Audio Reactive</h3>
                <p class="uk-text-meta">Sound → geometry</p>
              </div>
              <div class="uk-card uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="gen">
                <span class="uk-text-large" aria-hidden="true">⬡</span>
                <h3 class="uk-card-title">Generative</h3>
                <p class="uk-text-meta">Procedural worlds</p>
              </div>
              <div class="uk-card uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="particles">
                <span class="uk-text-large" aria-hidden="true">⁂</span>
                <h3 class="uk-card-title">GPU Particles</h3>
                <p class="uk-text-meta">10k instances</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 01: INTRO — baku cube center, hero at top, scroll hint at bottom -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-intro" data-section="intro">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
            <div class="uk-flex uk-flex-column uk-flex-middle">
              <h1 class="studio-title uk-heading-xlarge"
                  data-content-id="hero-title">l@6</h1>
              <span class="uk-text-meta uk-margin-small-top" ${REVEAL}>Studio · est. 2019</span>
              <p class="uk-text-lead uk-margin-top" ${REVEAL}>
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
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-about" data-section="about">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-grid uk-child-width-1-2@m uk-grid-match uk-text-left uk-height-1-1" uk-grid>
            <div class="uk-width-1-2@m uk-flex uk-flex-middle">
              <h2 class="studio-title uk-heading-medium"
                  data-content-id="about-title">About</h2>
            </div>
            <div class="uk-width-1-2@m" ${REVEAL}>
              <p class="uk-text-lead" data-content-id="about-text">
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
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-flexible" data-section="flexible">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="jlz-corner-label" aria-hidden="true">
            <p class="jlz-corner-label__hint">Drag the cube · Scroll to morph</p>
          </div>
        </div>
      </section>

      <!-- 04: CHALLENGE / WORKS — gallery, cube + carousel morph -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-challenge" data-section="challenge">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
            <h2 class="studio-title uk-heading-medium"
                data-content-id="challenge-title">Works</h2>
            <p class="uk-text-lead" ${REVEAL}
               data-content-id="challenge-text">
              Six interactive experiences. Drag to spin the carousel,
              click any card to open.
            </p>
          </div>

          <div id="project-overlay" class="uk-position-z-index"></div>
        </div>
      </section>

      <!-- 05: INNOVATIVE — feature cards with glassmorphism -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-innovative" data-section="innovative">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
            <div class="uk-flex uk-flex-column uk-flex-middle uk-margin">
              <h2 class="studio-title uk-heading-medium"
                  data-content-id="innovative-title">Innovative</h2>
              <p class="uk-text-lead" ${REVEAL}
                 data-content-id="innovative-text">
                We explore every edge of the platform — engineering
                experiences that feel like stepping into another world.
              </p>
            </div>
            <div class="uk-grid-small uk-child-width-1-3@m uk-grid-match" uk-grid>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="uk-text-meta uk-text-bold">01</span>
                <h3 class="uk-card-title">WebGPU Native</h3>
                <p class="uk-text-meta">
                  Compute shaders and render pipelines on the GPU.
                  Native performance, zero plugins.
                </p>
              </article>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="uk-text-meta uk-text-bold">02</span>
                <h3 class="uk-card-title">Real-time Shaders</h3>
                <p class="uk-text-meta">
                  TSL node graphs compiled on the fly. Materials that
                  react to light, sound, and gesture.
                </p>
              </article>
              <article class="uk-card uk-card-body uk-card-hover" ${REVEAL}>
                <span class="uk-text-meta uk-text-bold">03</span>
                <h3 class="uk-card-title">Spatial Design</h3>
                <p class="uk-text-meta">
                  3D-first interfaces built for depth, parallax, and
                  presence — not flat pages.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- 06: CONTACT — large CTA, glass buttons -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-contact" data-section="contact">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
            <h2 class="studio-title uk-heading-medium"
                data-content-id="contact-title">Contact</h2>
            <p class="uk-text-lead uk-text-large" ${REVEAL}
               data-content-id="contact-text">
              Let’s build something extraordinary.
            </p>
            <a href="mailto:hello@justlovejazz.com"
               class="uk-link uk-margin-top" ${REVEAL}>hello@justlovejazz.com</a>
            <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center uk-margin-top"
                 uk-grid ${REVEAL}
                 data-content-id="contact-grid">
              <a href="mailto:hello@justlovejazz.com"
                 class="uk-button uk-button-default jlz-glass-btn jlz-glass-btn--primary">
                <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
                <span>Start a project</span>
              </a>
              <a href="https://github.com" class="uk-button uk-button-default jlz-glass-btn"
                 target="_blank" rel="noopener">
                <span uk-icon="icon: github; ratio: 1.1" aria-hidden="true"></span>
                <span>GitHub</span>
              </a>
              <a href="https://twitter.com" class="uk-button uk-button-default jlz-glass-btn"
                 target="_blank" rel="noopener">
                <span uk-icon="icon: twitter; ratio: 1.1" aria-hidden="true"></span>
                <span>Twitter</span>
              </a>
            </div>
            <p class="uk-text-meta uk-margin-large-top" ${REVEAL}>© 2026 l@6.su — Crafted with Love</p>
          </div>
        </div>
      </section>

      <!-- 07: PROCESS (secret right) — Workflow timeline & studio manifesto -->
      <section uk-height-viewport="expand: true"
               class="uk-section" id="section-process" data-section="process">
        <div class="uk-position-cover" data-dynamic-content>
          <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
            <div class="uk-flex uk-flex-column uk-flex-middle">
              <h2 class="studio-title uk-heading-medium" ${REVEAL}>PROCESS</h2>
              <p class="uk-text-lead" ${REVEAL}>
                From concept to launch — every project follows a rhythm.
                Research, design, develop, ship. Then iterate.
              </p>
            </div>
            <ul class="uk-list uk-list-divider" ${REVEAL}>
              <li class="uk-flex uk-flex-middle">
                <span class="uk-text-bold uk-text-large uk-margin-right">01</span>
                <span class="uk-text-bold uk-margin-right">Research</span>
                <span class="uk-text-meta">Understand the problem space</span>
              </li>
              <li class="uk-flex uk-flex-middle">
                <span class="uk-text-bold uk-text-large uk-margin-right">02</span>
                <span class="uk-text-bold uk-margin-right">Develop</span>
                <span class="uk-text-meta">Prototype, iterate, refine</span>
              </li>
              <li class="uk-flex uk-flex-middle">
                <span class="uk-text-bold uk-text-large uk-margin-right">04</span>
                <span class="uk-text-bold uk-margin-right">Launch</span>
                <span class="uk-text-meta">Ship, measure, evolve</span>
              </li>
            </ul>
            <div class="uk-margin-top" ${REVEAL}>
              <p class="uk-text-lead">We believe the web is a canvas for emotion. <br class="uk-visible@s" />
              Every pixel earns its place. Every frame tells a story.</p>
              <p class="uk-text-meta uk-text-bold uk-margin-top">— JUSTLOVEJAZZ</p>
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
