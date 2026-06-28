// templates.ts — HTML string templates for SPA rendering.
// 6 sections matching junni reference (1:1 with 3D scene groups).

// 6 sections: intro, about, flexible, challenge, innovative, contact
// Index: 0=intro, 1=about, 2=flexible, 3=challenge, 4=innovative, 5=contact
export function homePage(): string {
  return `
    <!-- ═══ section-studio → 6 child sections (1:1 with 3D scene groups) ═══ -->
    <div class="section-studio uk-position-relative">

      <!-- 1: INTRO — White BG, metal drop -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-intro" data-section="intro">
        <div class="section-bg section-bg--intro uk-position-cover" data-dynamic-content>
          <div class="section-container uk-height-viewport uk-flex uk-flex-middle uk-flex-center" uk-scrollspy="cls: uk-animation-scale-up; delay: 100; repeat: true">
            <div class="section-content uk-text-center">
              <h1 class="studio-title studio-title--hero" data-content-id="hero-title">JUSTLOVEJAZZ</h1>
              <p class="studio-subtitle uk-text-meta uk-light" data-content-id="hero-subtitle">Interactive 3D Experience</p>
              <div class="uk-margin-large-top">
                <a href="#section-about" class="uk-button uk-button-default uk-button-large uk-border-circle">Explore</a>
              </div>
            </div>
            <div class="section-nav">
              <svg class="scroll-indicator" viewBox="0 0 100 300" aria-hidden="true">
                <g><circle cx='50' cy='288' r='12' fill='none' stroke='currentColor' stroke-width='1'><animate attributeName='r' dur='3s' repeatCount='indefinite' values='0; 15; 0' /></circle>
                <circle cx='50' cy='10' r='3' fill='currentColor'/></g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- 2: ABOUT — Black BG, blob character -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-about" data-section="about">
        <div class="section-bg section-bg--about uk-position-cover" data-dynamic-content>
          <div class="section-container uk-height-viewport uk-flex uk-flex-middle uk-flex-center" uk-scrollspy="cls: uk-animation-scale-up; delay: 100; repeat: true">
            <div class="section-content uk-text-center">
              <h2 class="studio-title studio-title--about" data-content-id="about-title">ABOUT</h2>
              <p class="studio-body uk-text-lead uk-light uk-margin-large-top" data-content-id="about-text">
                We craft immersive digital experiences at the intersection of art and technology.
                Our approach blends creative vision with cutting-edge 3D web technology,
                delivering memorable interactive moments that push the boundaries of the modern browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3: FLEXIBLE — Pure 3D scene (junni pattern: no HTML content).
           Animated text background + full-screen title texture rendered in WebGL.
           Section is kept for scroll positioning only. -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-flexible" data-section="flexible">
        <div class="section-bg section-bg--flexible uk-position-cover" data-dynamic-content></div>
      </section>

      <!-- 4: CHALLENGE — Dark, checkered floor, gallery -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-challenge" data-section="challenge">
        <div class="section-bg section-bg--challenge uk-position-cover" data-dynamic-content>
          <div class="section-container uk-height-viewport uk-flex uk-flex-middle uk-flex-center" uk-scrollspy="cls: uk-animation-scale-up; delay: 100; repeat: true">
            <div class="section-content uk-text-center">
              <h2 class="studio-title studio-title--challenge" data-content-id="challenge-title">WORKS</h2>
              <p class="studio-body uk-text-lead uk-light uk-margin-large-top" data-content-id="challenge-text">
                A curated selection of interactive experiences, creative coding experiments,
                and immersive web projects.
              </p>
              <button id="jlz-show-works" class="uk-button uk-button-default uk-margin-large-top" style="border-color:rgba(255,255,255,.3);color:#fff;">Show</button>
            </div>
          </div>
          <div id="project-overlay" class="jlz-works-ui uk-position-z-index" uk-scrollspy="cls: uk-animation-slide-bottom; delay: 200; repeat: true"></div>
        </div>
      </section>

      <!-- 5: INNOVATIVE — Dark, constellation -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-innovative" data-section="innovative">
        <div class="section-bg section-bg--innovative uk-position-cover" data-dynamic-content>
          <div class="section-container uk-height-viewport uk-flex uk-flex-middle uk-flex-center" uk-scrollspy="cls: uk-animation-scale-up; delay: 100; repeat: true">
            <div class="section-content uk-text-center">
              <h2 class="studio-title" data-content-id="innovative-title">INNOVATIVE</h2>
              <p class="studio-body uk-text-lead uk-margin-large-top" data-content-id="innovative-text">
                Pushing the frontier of what browsers can do. WebGL, WebGPU, spatial audio —
                we explore every edge of the platform to create experiences that feel
                like stepping into another world.
              </p>
              <div class="uk-grid-small uk-child-width-1-2@m uk-text-center uk-margin-large-top" uk-grid>
                <div uk-scrollspy="cls: uk-animation-fade; delay: 100; repeat: true">
                  <span class="uk-icon uk-icon-large" uk-icon="rocket"></span>
                  <p class="uk-margin-top">WebGPU Native</p>
                </div>
                <div uk-scrollspy="cls: uk-animation-fade; delay: 200; repeat: true">
                  <span class="uk-icon uk-icon-large" uk-icon="layers"></span>
                  <p class="uk-margin-top">Multi-layer Rendering</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 6: CONTACT — Dark, noisy blocks -->
      <section class="uk-height-viewport uk-flex uk-flex-center" uk-height-viewport="expand: true"
               id="section-contact" data-section="contact">
        <div class="section-bg section-bg--contact uk-position-cover" data-dynamic-content>
          <div class="section-container uk-height-viewport uk-flex uk-flex-middle uk-flex-center" uk-scrollspy="cls: uk-animation-scale-up; delay: 100; repeat: true">
            <div class="section-content uk-text-center">
              <h2 class="studio-title" data-content-id="contact-title">CONTACT</h2>
              <p class="uk-text-lead uk-light uk-margin-large-top" data-content-id="contact-text">
                Ready to build something extraordinary?
              </p>
              <div class="uk-grid-small uk-child-width-1-3@m uk-text-center uk-margin-large-top" data-content-id="contact-grid" uk-grid>
                <div>
                  <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">
                    <span class="uk-icon" uk-icon="mail"></span> Email
                  </a>
                </div>
                <div>
                  <a href="https://github.com" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
                    <span class="uk-icon" uk-icon="github"></span> GitHub
                  </a>
                </div>
                <div>
                  <a href="https://twitter.com" class="uk-button uk-button-default uk-button-large" target="_blank" rel="noopener">
                    <span class="uk-icon" uk-icon="twitter"></span> Twitter
                  </a>
                </div>
              </div>
              <p class="uk-text-meta uk-margin-large-top">© 2025 JUSTLOVEJAZZ. All rights reserved.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  `
}

export function renderPage(): string { return homePage() }
