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
const FOOTER = `
  <footer class="jlz-footer uk-section uk-section-xsmall" data-footer
          uk-sticky="position: bottom; overflow-flip: true; start: -100%; end: 0;"
          uk-scrollspy="target: [uk-scrollspy-class]; cls: uk-animation-fade; delay: 200;">
    <div class="uk-container uk-container-expand">
      <div class="uk-flex uk-flex-middle uk-flex-center uk-flex-wrap" uk-scrollspy-class>
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
             class="uk-section uk-section-large" id="section-lab" data-section="lab">
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
             class="uk-section uk-section-large" id="section-intro" data-section="intro">
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
             class="uk-section uk-section-large" id="section-about" data-section="about">
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
             class="uk-section uk-section-large" id="section-challenge" data-section="challenge">
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
             class="uk-section uk-section-large" id="section-contact" data-section="contact">
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
             class="uk-section uk-section-large" id="section-process" data-section="process">
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

// ── Services page — what we do ──
export function renderServicesPage(): string {
  const services = [
    { num: '01', title: 'WebGPU Experiences', desc: 'Real-time 3D, compute shaders, and TSL node graphs compiled on the fly. Native performance, zero plugins.' },
    { num: '02', title: 'Spatial Design', desc: '3D-first interfaces built for depth, parallax, and presence. Not flat pages — worlds you navigate.' },
    { num: '03', title: 'Interaction Design', desc: 'Motion choreography, gesture-driven UI, magnetic cursors, and scroll-triggered cinematic sequences.' },
    { num: '04', title: 'Shader Art', desc: 'GLSL and TSL fragments — glass, light, particles, and audio-reactive visuals that feel alive.' },
    { num: '05', title: 'Performance Engineering', desc: 'On-demand rendering, GPU instancing, chunked bundles, and Lighthouse scores that stay green.' },
    { num: '06', title: 'Brand Systems', desc: 'Visual identity, typography, and motion language that scales from favicon to fullscreen hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="services">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="services-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Services</p>
          <h1 class="uk-heading-xlarge">What We Build</h1>
          <p class="uk-text-lead uk-margin-large-top">From shader art to shipping product. We cover the full spectrum of modern web — 3D, motion, and engineering that holds up under real traffic.</p>
          <div class="uk-grid-large uk-child-width-1-3@m uk-grid-match uk-margin-large-top" uk-grid>
            ${services.map((s) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <span class="uk-text-meta uk-text-bold">${s.num}</span>
                <h2 class="uk-card-title uk-margin-top">${s.title}</h2>
                <p class="uk-text-meta">${s.desc}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="services-stack">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Our Stack</h2>
          <p class="uk-text-lead uk-margin-large-top">Three.js + TSL, WebGPU first with WebGL2 fallback. UIkit 3 for chrome. TypeScript strict. Bun + Vite for dev. Prisma when we need a database.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Case Studies page — selected work ──
export function renderCasesPage(): string {
  const cases = [
    { num: '01', title: 'Nocturne Blue', cat: 'Studio Portfolio', desc: 'WebGPU portfolio with glass cube morph, audio-reactive shaders, and a Baku-inspired carousel.' },
    { num: '02', title: 'Ebb Vibes', cat: 'Brand Experience', desc: 'Ambient warm study — procedural gradients, scanline texture, and fog pushed to their emotional limit.' },
    { num: '03', title: 'Till At Night', cat: 'Interactive Narrative', desc: 'Crossover timeline where analog meets algorithm. Diagonal camera traversal, synth-glow post.' },
    { num: '04', title: 'Undercurrent', cat: 'Generative Art', desc: 'Sub-bass meditation. Volume shaders, exponential fog, near-invisible until lit. The void is the feature.' },
    { num: '05', title: 'Mono Sunday', cat: 'Product Launch', desc: 'Monochrome minimalism with reactive light. Spatial sound, projection tests, full-screen viewing.' },
    { num: '06', title: 'Velvet Echo', cat: 'Music Identity', desc: 'Interactive identity system — type motion, glassmorphism, and a live shader-driven hero.' },
  ]
  return `
    <article class="jlz-page" data-page-view="cases">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="cases-index">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Case Studies</p>
          <h1 class="uk-heading-xlarge">Selected Work</h1>
          <div class="uk-grid-large uk-child-width-1-3@m uk-grid-match uk-margin-large-top" uk-grid>
            ${cases.map((c) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <span class="uk-text-meta">${c.cat}</span>
                <h2 class="uk-card-title uk-margin-top">${c.title}</h2>
                <p class="uk-text-meta">${c.desc}</p>
                <a class="uk-button uk-button-text uk-margin-top" href="/cases">View case →</a>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="cases-process">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">How We Work</h2>
          <p class="uk-text-lead uk-margin-large-top">Every project starts with a question: what does this feel like? Then we engineer the answer — shader by shader, frame by frame.</p>
          <a class="uk-button uk-button-default uk-margin-medium-top" href="/process">Read our process</a>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Process page — how we work ──
export function renderProcessPage(): string {
  const steps = [
    ['01', 'Discover', 'Research the problem space. Audit existing work. Define success metrics. We don\'t write a line of shader until we know what emotion we\'re engineering for.'],
    ['02', 'Design', 'Art direction, 3D sketches, interaction prototypes. Mood boards become GLSL fragments. We test in the browser early — never in static mockups.'],
    ['03', 'Develop', 'WebGPU-first with WebGL2 fallback. TSL node graphs, on-demand rendering, performance budgets. TypeScript strict, zero anys in shipping code.'],
    ['04', 'Ship', 'Launch, measure, evolve. We monitor frame times, not just Lighthouse. The work continues after deploy — we iterate on what users actually do.'],
  ]
  return `
    <article class="jlz-page" data-page-view="process">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="process-overview">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Process</p>
          <h1 class="uk-heading-xlarge">How We Work</h1>
          <ul class="uk-list uk-list-divider uk-margin-large-top">
            ${steps.map(([num, label, desc]) => `
              <li class="uk-flex uk-flex-middle" uk-scrollspy-class>
                <span class="uk-text-large uk-text-bold uk-margin-right">${num}</span>
                <h2 class="uk-h3 uk-margin-remove uk-margin-right">${label}</h2>
                <span class="uk-text-meta">${desc}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="process-principles">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Principles</h2>
          <p class="uk-text-lead uk-margin-large-top">The web is a canvas for emotion. Every pixel earns its place. Every frame tells a story. We build for browsers, but we design for people.</p>
          <p class="uk-text-meta uk-text-bold uk-margin-top">— JUSTLOVEJAZZ</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Team page — who we are ──
export function renderTeamPage(): string {
  const team = [
    { role: 'Creative Director', name: 'Lead', bio: '15 years in motion design. Former agency lead. Obsessed with light.' },
    { role: 'Lead Engineer', name: 'Eng', bio: 'WebGPU early adopter. Ships production TSL. TypeScript maximalist.' },
    { role: 'Shader Artist', name: 'GLSL', bio: 'Generative art background. Lives in fragment shaders. Audio-reactive everything.' },
    { role: 'Interaction Designer', name: 'IXD', bio: 'Gesture-driven UI, magnetic cursors, scroll choreography.' },
  ]
  return `
    <article class="jlz-page" data-page-view="team">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="team-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Team</p>
          <h1 class="uk-heading-xlarge">Who We Are</h1>
          <p class="uk-text-lead uk-margin-large-top">A small studio of engineers who design and designers who code. No handoffs, no silos — everyone ships.</p>
          <div class="uk-grid-large uk-child-width-1-2@m uk-margin-large-top" uk-grid>
            ${team.map((m) => `
              <div uk-scrollspy-class>
                <h2 class="uk-heading-medium">${m.role}</h2>
                <p class="uk-text-lead">${m.bio}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="team-values">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Values</h2>
          <p class="uk-text-lead uk-margin-large-top">Craft over speed. Depth over surface. We'd rather ship one thing that feels alive than ten that feel flat.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Journal page — writing & notes ──
export function renderJournalPage(): string {
  const posts = [
    { cat: 'Shaders', title: 'Why TSL Changes Everything', excerpt: 'Three.js TSL node graphs compiled on the fly — WebGPU portability without the boilerplate.' },
    { cat: 'Process', title: 'Designing in the Browser', excerpt: 'Why we killed static mockups and started sketching directly in WebGL.' },
    { cat: 'Performance', title: 'On-Demand Rendering', excerpt: 'Zero draw calls when idle. How we keep a 3D site fast without sacrificing the experience.' },
    { cat: 'WebGPU', title: 'WebGPU or Bust', excerpt: 'Real WebGPU vs WebGLBackend fallback — what actually ships to users in 2026.' },
  ]
  return `
    <article class="jlz-page" data-page-view="journal">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="journal-latest">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Journal</p>
          <h1 class="uk-heading-xlarge">Writing</h1>
          <div class="uk-grid-large uk-child-width-1-3@m uk-grid-match uk-margin-large-top" uk-grid>
            ${posts.map((p) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <span class="uk-label">${p.cat}</span>
                <h2 class="uk-card-title uk-margin-top">${p.title}</h2>
                <p class="uk-text-meta">${p.excerpt}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="journal-notes">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Notes</h2>
          <p class="uk-text-lead uk-margin-large-top">Short-form writing about tools, releases, visual systems, and the decisions behind the work.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}

// ── Contact page — reach out ──
export function renderContactPage(): string {
  return `
    <article class="jlz-page" data-page-view="contact">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="contact-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Contact</p>
          <h1 class="uk-heading-xlarge">Let's Talk</h1>
          <p class="uk-text-lead uk-margin-large-top">Got a project that needs glass, motion, and light? We take on a limited number of engagements per quarter.</p>
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large uk-margin-medium-top">
            <span uk-icon="icon: mail; ratio: 1.1" aria-hidden="true"></span>
            <span>hello@justlovejazz.com</span>
          </a>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="contact-faq">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Before You Ask</h2>
          <ul class="uk-list uk-list-divider uk-margin-medium-top">
            <li><span class="uk-text-bold">Engagements</span> — we book 8-12 week projects, one at a time.</li>
            <li><span class="uk-text-bold">Budgets</span> — typical projects start at €25k. Shader art and R&D available separately.</li>
            <li><span class="uk-text-bold">Location</span> — fully remote. Team across EU. We sync async.</li>
            <li><span class="uk-text-bold">Stack</span> — WebGPU, Three.js, TSL, TypeScript, UIkit. We don't do React-for-everything.</li>
          </ul>
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
