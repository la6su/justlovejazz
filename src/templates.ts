// templates.ts — HTML string templates for SPA rendering.
// 6 home sections (1:1 with cube faces) + 6 content pages (studio portfolio).
//
// Content theme: Website Design Studio & Portfolio
//   Home sections (cube faces): Lab / Intro / About / Works / Contact / Process
//   Content pages: Services / Case Studies / Process / Team / Journal / Contact
//
// Built with UIkit 3 utility/component classes. `.studio-title` is the
// NoiseText animation hook (entry-app.ts). `.jlz-fs-*` is ProjectOverlay.
// `.jlz-corner-label*` kept for future use.
//
// Footer: minimal, uk-sticky bottom bar with brand + social only.
// Navigation lives in the header (UIMenu slider + modal), NOT in the footer.

// ── Shared footer (minimal: brand + social, NO nav, NO copyright) ──
// Fixed bottom bar — content pages use position:absolute stacked sections
// with overflow:hidden on #spa-content, so uk-sticky doesn't work (no scroll).
// Fixed positioning keeps it pinned to the viewport bottom on all pages.
const FOOTER = `
  <footer class="jlz-footer" data-footer>
    <div class="uk-container uk-container-expand">
      <div class="uk-flex uk-flex-middle uk-flex-center uk-flex-wrap">
        <a class="uk-navbar-item uk-logo jlz-brand uk-margin-right" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
        <ul class="uk-iconnav">
          <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
          <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
          <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
        </ul>
      </div>
    </div>
  </footer>
`

export function homePage(): string {
  const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

  return `
    <!-- ═══ 6 child sections (4 main + 2 secret side) — 1:1 cube faces ═══ -->

    <!-- 0: LAB (secret left, top face) — Experiments & R&D -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-lab" data-section="lab">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h2 class="studio-title uk-heading-medium" ${REVEAL}>LAB</h2>
            <p class="uk-text-lead" ${REVEAL}>
              Where we break things on purpose. Shader experiments, GPU compute
              sketches, interaction prototypes — the playground behind the studio.
            </p>
          </div>
          <div class="uk-grid-small uk-child-width-1-2@s" uk-grid ${REVEAL}>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="shader">
              <span class="uk-text-large" aria-hidden="true">◈</span>
              <h3 class="uk-card-title">Shader Lab</h3>
              <p class="uk-text-meta">GLSL & TSL fragments</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="audio">
              <span class="uk-text-large" aria-hidden="true">◉</span>
              <h3 class="uk-card-title">Audio Reactive</h3>
              <p class="uk-text-meta">Sound-driven visuals</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="gen">
              <span class="uk-text-large" aria-hidden="true">⬡</span>
              <h3 class="uk-card-title">Generative</h3>
              <p class="uk-text-meta">Procedural worlds</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="particles">
              <span class="uk-text-large" aria-hidden="true">⁂</span>
              <h3 class="uk-card-title">GPU Particles</h3>
              <p class="uk-text-meta">10k instances</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 1: INTRO (front face) — baku cube center, hero at top, scroll hint at bottom -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-intro" data-section="intro">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h1 class="studio-title uk-heading-xlarge"
                data-content-id="hero-title">l@6</h1>
            <span class="uk-text-meta uk-margin-small-top" ${REVEAL}>Web Design Studio · est. 2019</span>
            <p class="uk-text-lead uk-margin-top" ${REVEAL}>
              We build cinematic interfaces for the modern browser —
              <span class="uk-text-bold">glass</span>,
              <span class="uk-text-bold">motion</span>, and
              <span class="uk-text-bold">light</span>, powered by WebGPU.
            </p>
          </div>
          <div class="jlz-scroll-hint" aria-hidden="true" ${REVEAL}>
            <span class="jlz-scroll-hint__label">Spin the cube</span>
            <span class="jlz-scroll-hint__line"></span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2: ABOUT (right face) — two-column split -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-about" data-section="about">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-grid uk-child-width-1-2@m uk-grid-match uk-text-left uk-height-1-1" uk-grid>
          <div class="uk-width-1-2@m uk-flex uk-flex-middle">
            <h2 class="studio-title uk-heading-medium"
                data-content-id="about-title">About</h2>
          </div>
          <div class="uk-width-1-2@m" ${REVEAL}>
            <p class="uk-text-lead" data-content-id="about-text">
              A small studio crafting expressive browser experiences. We merge
              art direction with web engineering — 3D-first interfaces, spatial
              design, and real-time shaders that stay fast under pressure.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3: WORKS (back face) — gallery, cube + carousel morph -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-challenge" data-section="challenge">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
          <h2 class="studio-title uk-heading-medium"
              data-content-id="challenge-title">Works</h2>
          <p class="uk-text-lead" ${REVEAL}
             data-content-id="challenge-text">
            Selected projects. Drag to spin the carousel, click any card to open.
          </p>
        </div>

        <div id="project-overlay" class="uk-position-z-index"></div>
      </div>
    </section>

    <!-- 4: CONTACT (bottom face) — large CTA, glass buttons -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-contact" data-section="contact">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
          <h2 class="studio-title uk-heading-medium"
              data-content-id="contact-title">Contact</h2>
          <p class="uk-text-lead uk-text-large" ${REVEAL}
             data-content-id="contact-text">
            Let's build something extraordinary.
          </p>
          <a href="mailto:hello@justlovejazz.com"
             class="uk-link uk-margin-top" ${REVEAL}>hello@justlovejazz.com</a>
          <div class="uk-grid-small uk-child-width-auto@s uk-flex uk-flex-center uk-margin-top"
               uk-grid ${REVEAL}
               data-content-id="contact-grid">
            <a href="mailto:hello@justlovejazz.com"
               class="uk-button uk-button-primary uk-button-large">
              <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
              <span>Start a project</span>
            </a>
            <a href="https://github.com" class="uk-button uk-button-default uk-button-large"
               target="_blank" rel="noopener">
              <span uk-icon="icon: github; ratio: 1.1" aria-hidden="true"></span>
              <span>GitHub</span>
            </a>
            <a href="https://twitter.com" class="uk-button uk-button-default uk-button-large"
               target="_blank" rel="noopener">
              <span uk-icon="icon: twitter; ratio: 1.1" aria-hidden="true"></span>
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 5: PROCESS (secret right, left face) — Workflow timeline -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-process" data-section="process">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1">
          <div class="uk-flex uk-flex-column uk-flex-middle">
            <h2 class="studio-title uk-heading-medium" ${REVEAL}>PROCESS</h2>
            <p class="uk-text-lead" ${REVEAL}>
              From concept to launch — every project follows a rhythm.
              Discover, design, develop, ship. Then iterate.
            </p>
          </div>
          <ul class="uk-list uk-list-divider" ${REVEAL}>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">01</span>
              <span class="uk-text-bold uk-margin-right">Discover</span>
              <span class="uk-text-meta">Research, audit, define the problem</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">02</span>
              <span class="uk-text-bold uk-margin-right">Design</span>
              <span class="uk-text-meta">Art direction, 3D, interaction prototypes</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">03</span>
              <span class="uk-text-bold uk-margin-right">Develop</span>
              <span class="uk-text-meta">WebGPU, TSL shaders, performance budgets</span>
            </li>
            <li class="uk-flex uk-flex-middle">
              <span class="uk-text-bold uk-text-large uk-margin-right">04</span>
              <span class="uk-text-bold uk-margin-right">Ship</span>
              <span class="uk-text-meta">Launch, measure, evolve</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    ${FOOTER}
  `
}

export type PageId = 'home' | 'services' | 'cases' | 'process' | 'team' | 'journal' | 'contact'

const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

// ── Services page — big-number list layout (mobile-first, 4 items visible) ──
export function renderServicesPage(): string {
  // 4 core services (mobile-first — fits 1 screen). 2 more on desktop via uk-hidden@s.
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, TSL node graphs. Native performance, zero plugins.' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces built for depth, parallax, and presence. Not flat pages — worlds.' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI, magnetic cursors, scroll-triggered sequences.' },
    { num: '04', title: 'Shader Art', desc: 'GLSL & TSL fragments — glass, light, particles, audio-reactive visuals that feel alive.' },
  ]
  const servicesExtra = [
    { num: '05', title: 'Performance Engineering', desc: 'On-demand rendering, GPU instancing, chunked bundles, green Lighthouse scores.' },
    { num: '06', title: 'Brand Systems', desc: 'Visual identity, typography, motion language from favicon to fullscreen hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Services</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>What We Build</h1>
          <ul class="uk-list uk-margin-top" uk-scrollspy-class>
            ${services.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin">
                <span class="uk-h3 uk-text-muted uk-margin-right" style="min-width: 48px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top uk-visible@s">${s.desc}</p>
                  <p class="uk-text-meta uk-margin-small-top uk-hidden@s" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${s.desc}</p>
                </div>
              </li>
            `).join('')}
            ${servicesExtra.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin uk-hidden@s" uk-scrollspy-class>
                <span class="uk-h3 uk-text-muted uk-margin-right" style="min-width: 48px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="services-stack">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Stack</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>The toolbox</h2>
          <div class="uk-grid uk-child-width-1-2@m uk-margin-top" uk-grid>
            <div uk-scrollspy-class>
              <h3 class="uk-h5">3D & Shaders</h3>
              <p class="uk-text-meta">Three.js + TSL, WebGPU first with WebGL2 fallback. MeshPhysicalMaterial for glass, PMREM for IBL.</p>
            </div>
            <div uk-scrollspy-class>
              <h3 class="uk-h5">UI & Engineering</h3>
              <p class="uk-text-meta">UIkit 3, TypeScript strict, Bun + Vite, Prisma. Zero runtime errors in production.</p>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Case Studies page — overlay tile grid (mobile-first, 2 col mobile → 3 col desktop) ──
export function renderCasesPage(): string {
  const cases = [
    { num: '01', title: 'Nocturne Blue', cat: 'Portfolio', desc: 'WebGPU portfolio with glass cube morph.' },
    { num: '02', title: 'Ebb Vibes', cat: 'Brand', desc: 'Ambient warm study, procedural gradients.' },
    { num: '03', title: 'Till At Night', cat: 'Narrative', desc: 'Analog meets algorithm. Synth-glow post.' },
    { num: '04', title: 'Undercurrent', cat: 'Generative', desc: 'Sub-bass meditation. Volume shaders.' },
    { num: '05', title: 'Mono Sunday', cat: 'Launch', desc: 'Monochrome minimalism, reactive light.' },
    { num: '06', title: 'Velvet Echo', cat: 'Identity', desc: 'Interactive identity, live shader hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="cases">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="cases-index">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Case Studies</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Selected Work</h1>
          <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-3@m uk-margin-top" uk-grid>
            ${cases.map((c) => `
              <div uk-scrollspy-class>
                <a class="uk-inline-clip uk-transition-toggle uk-link-toggle uk-display-block" href="/cases">
                  <div class="uk-card uk-card-default uk-card-body uk-card-hover jlz-case-tile">
                    <div class="uk-position-z-index uk-position-relative">
                      <span class="uk-text-meta uk-text-uppercase">${c.cat}</span>
                      <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${c.title}</h2>
                      <p class="uk-text-meta uk-margin-small-top uk-transition-fade uk-transition-opaque uk-visible@m">${c.desc}</p>
                      <span class="uk-position-top-right uk-position-small uk-text-bold uk-text-large">${c.num}</span>
                    </div>
                  </div>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="cases-cta">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium uk-margin-remove" uk-scrollspy-class>Have a project in mind?</h2>
          <a class="uk-button uk-button-primary uk-button-large uk-margin-top" href="/contact" uk-scrollspy-class>Start a project</a>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Process page — vertical timeline (mobile-first, compact) ──
export function renderProcessPage(): string {
  const steps = [
    { num: '01', title: 'Discover', desc: 'Research, audit, define success. We don\'t write shaders until we know the emotion.' },
    { num: '02', title: 'Design', desc: 'Art direction, 3D sketches, interaction prototypes. We test in the browser early.' },
    { num: '03', title: 'Develop', desc: 'WebGPU-first, TSL node graphs, on-demand rendering, TypeScript strict.' },
    { num: '04', title: 'Ship', desc: 'Launch, measure, evolve. We monitor frame times, not just Lighthouse.' },
  ]
  return `
    <article class="jlz-page" data-page-view="process">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="process-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Process</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>How We Work</h1>
          <ul class="uk-list uk-list-divider uk-margin-top">
            ${steps.map((s) => `
              <li class="uk-flex uk-flex-middle uk-margin" uk-scrollspy-class>
                <span class="uk-h3 uk-margin-right" style="min-width: 56px; opacity: 0.5;">${s.num}</span>
                <div class="uk-flex-1">
                  <h2 class="uk-h4 uk-margin-remove">${s.title}</h2>
                  <p class="uk-text-meta uk-margin-small-top">${s.desc}</p>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="process-principles">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Principles</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>The web is a canvas for emotion.</h2>
          <p class="uk-text-meta uk-margin-top" uk-scrollspy-class>Every pixel earns its place. Every frame tells a story.</p>
          <p class="uk-text-meta uk-text-bold uk-margin-top" uk-scrollspy-class>— JUSTLOVEJAZZ</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Team page — split bio cards (mobile-first, 1 col mobile → 2 col desktop) ──
export function renderTeamPage(): string {
  const team = [
    { role: 'Creative Director', bio: '15 years in motion design. Obsessed with light and timing.' },
    { role: 'Lead Engineer', bio: 'WebGPU early adopter. Ships production TSL. TypeScript maximalist.' },
    { role: 'Shader Artist', bio: 'Generative art background. Lives in fragment shaders. Glass is a lifestyle.' },
    { role: 'Interaction Designer', bio: 'Gesture-driven UI, magnetic cursors, scroll choreography.' },
  ]
  return `
    <article class="jlz-page" data-page-view="team">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="team-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Team</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Who We Are</h1>
          <p class="uk-text-meta uk-margin-top uk-width-3-4@m" uk-scrollspy-class>Engineers who design, designers who code. No handoffs — everyone ships.</p>
          <div class="uk-grid-small uk-child-width-1-2@m uk-margin-top" uk-grid>
            ${team.map((m, i) => `
              <div class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <span class="uk-text-meta uk-text-bold">0${i + 1}</span>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${m.role}</h2>
                <p class="uk-text-meta uk-margin-small-top">${m.bio}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="team-values">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <div class="uk-grid uk-child-width-1-2@m uk-grid-match" uk-grid>
            <div uk-scrollspy-class>
              <p class="uk-text-meta uk-text-uppercase">Values</p>
              <h2 class="uk-heading-medium uk-margin-top">Craft over speed.</h2>
            </div>
            <div uk-scrollspy-class>
              <p class="uk-text-meta">Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat. One engagement at a time.</p>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Journal page — magazine grid (mobile-first, 1 col mobile → 2 col desktop) ──
export function renderJournalPage(): string {
  const posts = [
    { cat: 'Shaders', title: 'Why TSL Changes Everything', excerpt: 'TSL node graphs compiled on the fly — WebGPU portability without boilerplate.', date: 'Jul 2026' },
    { cat: 'Process', title: 'Designing in the Browser', excerpt: 'Why we killed static mockups and sketch directly in WebGL.', date: 'Jun 2026' },
    { cat: 'Performance', title: 'On-Demand Rendering', excerpt: 'Zero draw calls when idle. 3D sites that stay fast.', date: 'May 2026' },
    { cat: 'WebGPU', title: 'WebGPU or Bust', excerpt: 'Real WebGPU vs WebGLBackend — what ships to users in 2026.', date: 'Apr 2026' },
  ]
  return `
    <article class="jlz-page" data-page-view="journal">
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="journal-latest">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Journal</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Writing</h1>
          <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-2@m uk-margin-top" uk-grid>
            ${posts.map((p) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <div class="uk-flex uk-flex-between uk-flex-middle">
                  <span class="uk-label">${p.cat}</span>
                  <span class="uk-text-meta">${p.date}</span>
                </div>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${p.title}</h2>
                <p class="uk-text-meta uk-margin-small-top uk-visible@m">${p.excerpt}</p>
                <a class="uk-button uk-button-text uk-margin-top uk-visible@m" href="/journal">Read →</a>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-text-center" data-page-section="journal-notes">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium uk-margin-remove" uk-scrollspy-class>Notes from the studio</h2>
          <p class="uk-text-meta uk-margin-top uk-width-2-3@m uk-margin-auto" uk-scrollspy-class>Short-form writing about tools, releases, and decisions behind the work. No SEO bait.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Contact page — hero CTA + FAQ (mobile-first, compact) ──
export function renderContactPage(): string {
  return `
    <article class="jlz-page" data-page-view="contact">
      <section class="jlz-page-section section-active uk-section uk-text-center" data-page-section="contact-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Contact</p>
          <h1 class="uk-heading-large uk-margin-top" uk-scrollspy-class>Let's Talk</h1>
          <p class="uk-text-meta uk-margin-top uk-width-2-3@m uk-margin-auto" uk-scrollspy-class>Got a project that needs glass, motion, and light? We take limited engagements per quarter.</p>
          <div class="uk-margin-top" uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-link uk-heading-medium jlz-contact-link">
              hello@justlovejazz.com
            </a>
          </div>
          <div class="uk-margin-top" uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">
              <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
              <span>Start a project</span>
            </a>
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="contact-faq">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <div class="uk-grid uk-child-width-1-2@m uk-grid-match" uk-grid>
            <div uk-scrollspy-class>
              <p class="uk-text-meta uk-text-uppercase">Before You Ask</p>
              <h2 class="uk-heading-medium uk-margin-top">FAQ</h2>
            </div>
            <div uk-scrollspy-class>
              <ul class="uk-list uk-list-divider">
                <li><span class="uk-text-bold">Engagements</span> — 8-12 weeks, one at a time.</li>
                <li><span class="uk-text-bold">Budgets</span> — from €25k. R&D available separately.</li>
                <li><span class="uk-text-bold">Location</span> — remote. Team across EU. Async.</li>
                <li><span class="uk-text-bold">Stack</span> — WebGPU, Three.js, TSL, TS, UIkit.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'services':
      return renderServicesPage()
    case 'cases':
      return renderCasesPage()
    case 'process':
      return renderProcessPage()
    case 'team':
      return renderTeamPage()
    case 'journal':
      return renderJournalPage()
    case 'contact':
      return renderContactPage()
    case 'home':
    default:
      return homePage()
  }
}
