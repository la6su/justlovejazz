// templates.ts — HTML string templates for SPA rendering.
// 6 sections matching junni reference (1:1 with 3D scene groups).
//
// Cinematic UI overhaul:
//  - Section indices (01–06) as a design element next to eyebrows
//  - Mix-weight typography (900 hero + 200 section + 300 body)
//  - Glassmorphism feature cards (innovative) + CTA buttons (contact)
//  - Layouts that avoid the center cube: top / bottom / split / between
//  - Stagger reveal on .section-active (CSS-only, no JS)
//  - `.studio-title` preserved on every title — NoiseText animation
//    (entry-app.ts) keys off it; do not remove that class.

// 6 sections: intro, about, flexible, challenge, innovative, contact
// Index: 0=intro, 1=about, 2=flexible, 3=challenge, 4=innovative, 5=contact
export function homePage(): string {
  return `
    <!-- ═══ #main-nav — UIKit navbar container (populated by UIMenu.ts) ═══ -->
    <div id="main-nav"></div>

    <!-- ═══ section-studio → 8 child sections (6 main + 2 secret side) ═══ -->
    <div class="section-studio uk-position-relative">

      <!-- 00: LAB (secret left) — Experiments & interactive demos -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-lab" data-section="lab">
        <div class="section-bg section-bg--lab uk-position-cover" data-dynamic-content>
          <div class="section-container jlz-layout--between">
            <div class="section-content jlz-hero">
              <span class="jlz-eyebrow jlz-reveal">00 · Secret Lab</span>
              <h2 class="studio-title studio-title--about jlz-reveal">LAB</h2>
              <p class="studio-body jlz-reveal">
                Experiments at the edge of what browsers can do. Shader art, audio
                reactive visuals, generative geometry — this is where we play.
              </p>
            </div>
            <div class="jlz-lab-grid jlz-reveal">
              <div class="jlz-lab-card" data-lab="shader">
                <span class="jlz-lab-card__icon">◈</span>
                <span class="jlz-lab-card__title">Shader Playground</span>
                <span class="jlz-lab-card__desc">Live GLSL fragments</span>
              </div>
              <div class="jlz-lab-card" data-lab="audio">
                <span class="jlz-lab-card__icon">◉</span>
                <span class="jlz-lab-card__title">Audio Reactive</span>
                <span class="jlz-lab-card__desc">Sound → geometry</span>
              </div>
              <div class="jlz-lab-card" data-lab="gen">
                <span class="jlz-lab-card__icon">⬡</span>
                <span class="jlz-lab-card__title">Generative</span>
                <span class="jlz-lab-card__desc">Procedural worlds</span>
              </div>
              <div class="jlz-lab-card" data-lab="particles">
                <span class="jlz-lab-card__icon">⁂</span>
                <span class="jlz-lab-card__title">GPU Particles</span>
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
          <div class="section-container jlz-layout--between">
            <div class="section-content jlz-hero">
              
              <h1 class="studio-title studio-title--hero jlz-hero__title"
                  data-content-id="hero-title">l@6</h1>
              <span class="jlz-hero__meta jlz-reveal">Studio · est. 2019</span>
              <p class="jlz-hero__tagline jlz-reveal">
                Cinematic interfaces for the modern browser — built from
                <span class="jlz-weight-medium">glass</span>,
                <span class="jlz-weight-medium">motion</span>, and
                <span class="jlz-weight-medium">light</span>.
              </p>
            </div>
            <div class="jlz-scroll-hint jlz-reveal" aria-hidden="true">
              <span class="jlz-scroll-hint__label">Joystick</span>
              <span class="jlz-scroll-hint__line"></span>
            </div>
          </div>
        </div>
      </section>

      <!-- 02: ABOUT — two-column split, cube visible through center gap -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-about" data-section="about">
        <div class="section-bg section-bg--about uk-position-cover" data-dynamic-content>
          <div class="section-container jlz-layout--split">
            <div class="jlz-split__left">
              <p class="jlz-eyebrow jlz-reveal">
                <span class="jlz-section-index">02</span> About
              </p>
              <h2 class="studio-title studio-title--about jlz-section-title"
                  data-content-id="about-title">About</h2>
            </div>
            <div class="jlz-split__right jlz-reveal">
              <p class="studio-body jlz-body-text" data-content-id="about-text">
                Craft meets code. We design 3D interfaces that respond to
                gesture, light, and sound — engineered for the GPU in your pocket.
              </p>
              <p class="studio-body jlz-body-text jlz-body-text--muted">
                Every pixel is choreographed. Every frame, considered.
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
            <p class="jlz-eyebrow">
              <span class="jlz-section-index">03</span> Works
            </p>
            <p class="jlz-corner-label__hint">Drag the cube · Scroll to morph</p>
          </div>
        </div>
      </section>

      <!-- 04: CHALLENGE / WORKS — gallery, cube + carousel morph -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-challenge" data-section="challenge">
        <div class="section-bg section-bg--challenge uk-position-cover" data-dynamic-content>
          <div class="section-container jlz-layout--top">
            <div class="section-content">
              <p class="jlz-eyebrow jlz-reveal">
                <span class="jlz-section-index">04</span> Selected Works
              </p>
              <h2 class="studio-title studio-title--challenge jlz-section-title"
                  data-content-id="challenge-title">Works</h2>
              <p class="studio-body jlz-body-text jlz-reveal"
                 data-content-id="challenge-text">
                Six interactive experiences. Drag to spin the carousel,
                click any card to open.
              </p>
            </div>
          </div>

          <div id="project-overlay" class="jlz-works-ui uk-position-z-index"></div>
        </div>
      </section>

      <!-- 05: INNOVATIVE — feature cards with glassmorphism -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-innovative" data-section="innovative">
        <div class="section-bg section-bg--innovative uk-position-cover" data-dynamic-content>
          <div class="section-container jlz-layout--between">
            <div class="section-content jlz-innovative__head">
              <p class="jlz-eyebrow jlz-reveal">
                <span class="jlz-section-index">05</span> Innovative
              </p>
              <h2 class="studio-title jlz-section-title"
                  data-content-id="innovative-title">Innovative</h2>
              <p class="studio-body jlz-body-text jlz-reveal"
                 data-content-id="innovative-text">
                We explore every edge of the platform — engineering
                experiences that feel like stepping into another world.
              </p>
            </div>
            <div class="jlz-feature-grid">
              <article class="jlz-feature-card jlz-reveal">
                <span class="jlz-feature-card__index">01</span>
                <h3 class="jlz-feature-card__title">WebGPU Native</h3>
                <p class="jlz-feature-card__body">
                  Compute shaders and render pipelines on the GPU.
                  Native performance, zero plugins.
                </p>
              </article>
              <article class="jlz-feature-card jlz-reveal">
                <span class="jlz-feature-card__index">02</span>
                <h3 class="jlz-feature-card__title">Real-time Shaders</h3>
                <p class="jlz-feature-card__body">
                  TSL node graphs compiled on the fly. Materials that
                  react to light, sound, and gesture.
                </p>
              </article>
              <article class="jlz-feature-card jlz-reveal">
                <span class="jlz-feature-card__index">03</span>
                <h3 class="jlz-feature-card__title">Spatial Design</h3>
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
          <div class="section-container jlz-layout--top">
            <div class="section-content">
              <p class="jlz-eyebrow jlz-reveal">
                <span class="jlz-section-index">06</span> Contact
              </p>
              <h2 class="studio-title jlz-section-title"
                  data-content-id="contact-title">Contact</h2>
              <p class="jlz-contact-tagline jlz-reveal"
                 data-content-id="contact-text">
                Let’s build something extraordinary.
              </p>
              <a href="mailto:hello@justlovejazz.com"
                 class="jlz-contact-email jlz-reveal">hello@justlovejazz.com</a>
              <div class="jlz-cta-grid jlz-reveal" data-content-id="contact-grid">
                <a href="mailto:hello@justlovejazz.com"
                   class="jlz-glass-btn jlz-glass-btn--primary">
                  <span class="jlz-glass-btn__icon" uk-icon="icon: mail; ratio: 1.1"
                        aria-hidden="true"></span>
                  <span>Start a project</span>
                </a>
                <a href="https://github.com" class="jlz-glass-btn"
                   target="_blank" rel="noopener">
                  <span class="jlz-glass-btn__icon" uk-icon="icon: github; ratio: 1.1"
                        aria-hidden="true"></span>
                  <span>GitHub</span>
                </a>
                <a href="https://twitter.com" class="jlz-glass-btn"
                   target="_blank" rel="noopener">
                  <span class="jlz-glass-btn__icon" uk-icon="icon: twitter; ratio: 1.1"
                        aria-hidden="true"></span>
                  <span>Twitter</span>
                </a>
              </div>
              <p class="jlz-contact-footer jlz-reveal">© 2025 JUSTLOVEJAZZ — Crafted in WebGL</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 07: PROCESS (secret right) — Workflow timeline & studio manifesto -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-process" data-section="process">
        <div class="section-bg section-bg--process uk-position-cover" data-dynamic-content>
          <div class="section-container jlz-layout--between">
            <div class="section-content jlz-hero">
              <span class="jlz-eyebrow jlz-reveal">07 · Process</span>
              <h2 class="studio-title studio-title--about jlz-reveal">PROCESS</h2>
              <p class="studio-body jlz-reveal">
                From concept to launch — every project follows a rhythm.
                Research, design, develop, ship. Then iterate.
              </p>
            </div>
            <div class="jlz-timeline jlz-reveal">
              <div class="jlz-timeline__item">
                <span class="jlz-timeline__num">01</span>
                <span class="jlz-timeline__label">Research</span>
                <span class="jlz-timeline__desc">Understand the problem space</span>
              </div>
              <div class="jlz-timeline__item">
                <span class="jlz-timeline__num">02</span>
                <span class="jlz-timeline__label">Design</span>
                <span class="jlz-timeline__desc">Prototype, iterate, refine</span>
              </div>
              <div class="jlz-timeline__item">
                <span class="jlz-timeline__num">03</span>
                <span class="jlz-timeline__label">Develop</span>
                <span class="jlz-timeline__desc">Build with cutting-edge tech</span>
              </div>
              <div class="jlz-timeline__item">
                <span class="jlz-timeline__num">04</span>
                <span class="jlz-timeline__label">Launch</span>
                <span class="jlz-timeline__desc">Ship, measure, evolve</span>
              </div>
            </div>
            <div class="jlz-manifesto jlz-reveal">
              <p>We believe the web is a canvas for emotion.</p>
              <p>Every pixel earns its place. Every frame tells a story.</p>
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
