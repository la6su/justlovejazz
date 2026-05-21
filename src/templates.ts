// Simple template renderer — returns HTML string from tag fragments.
// No dependencies, no framework — just function(data) => HTML.
// UIkit hooks (uk-height-viewport, uk-grid, etc.) work on dynamically injected content as long as UIkit.update() is called.

export interface PageData {
  intro: string
  body: string
  footer: string
}

export interface PageLayout {
  title: string
  sections: PageData
}

// ─────────────── shared sections ───────────────

function sharedFooter(): string {
  return `
    <footer class="section-studio section-centered uk-flex uk-flex-middle" uk-height-viewport>
      <div class="uk-container uk-text-center">
        <span class="section-number">∞</span>
        <h2 class="studio-title studio-title--medium uk-text-center">Start<br/><span>a Project</span></h2>
        <p class="studio-text studio-text--meta">Team: direction + 3D + frontend engineering</p>
        <div class="uk-margin-medium-top">
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-secondary uk-button-large">hello@justlovejazz.com</a>
        </div>
      </div>
    </footer>`
}

// ─────────────── page definitions ───────────────

export function homePage(): PageLayout {
  return {
    title: 'JUSTLOVEJAZZ',
    sections: {
      intro: `
        <section id="home-hero" class="section-studio uk-flex uk-flex-middle section-intro" uk-height-viewport>
          <div class="uk-container uk-text-center">
            <h1 class="studio-title">
              <span class="studio-title__line">JUSTLOVEJAZZ</span>
            </h1>
            <p class="studio-tagline uk-margin-auto-center">Official Site · Visual Directory</p>
            <div class="uk-margin-large-top">
              <a href="#/works" class="reveal-item uk-button uk-button-primary uk-button-large btn-studio">Lets Explore</a>
            </div>
          </div>
        </section>`,
      body: `
        <section id="home-body" class="section-studio section-scrolly uk-flex uk-flex-middle" uk-height-viewport="expand:true">
          <div class="uk-container">
            <span class="section-number">Directory</span>
            <div class="home-directory">
              <a class="home-directory__item" href="#/works"><span class="home-directory__index">01</span><span class="home-directory__label">Fashion Book</span></a>
              <a class="home-directory__item" href="#/works"><span class="home-directory__index">02</span><span class="home-directory__label">Beauty / Portrait</span></a>
              <a class="home-directory__item" href="#/works"><span class="home-directory__index">03</span><span class="home-directory__label">Cinematography Work</span></a>
              <a class="home-directory__item" href="#/works"><span class="home-directory__index">04</span><span class="home-directory__label">Brands / Campaigns</span></a>
              <a class="home-directory__item" href="#/works"><span class="home-directory__index">05</span><span class="home-directory__label">Monochromatic Series</span></a>
            </div>
            <p class="studio-text studio-text--meta uk-margin-medium-top">
              Scroll and choose a universe. Each category opens a dedicated visual case.
            </p>
          </div>
        </section>`,
      footer: sharedFooter(),
    },
  }
}

export function trinityPage(): PageLayout {
  return {
    title: 'JUSTLOVEJAZZ — Trinity',
    sections: {
      intro: `
        <section id="trinity-hero" class="section-studio uk-flex uk-flex-middle section-intro" uk-height-viewport>
          <div class="uk-container uk-text-center">
            <h1 class="studio-title studio-title--xl">
              <span class="studio-title__line">Three</span>
              <span class="studio-title__line">Layers.</span>
              <span class="studio-title__line">One Form.</span>
            </h1>
            <p class="studio-tagline uk-margin-auto-center">Narrative → Runtime → Operations. A loop, not a stack.</p>
            <div class="uk-margin-large-top">
              <a href="#trinity-loop" class="reveal-item uk-button uk-button-primary uk-button-large btn-studio">Enter the Loop</a>
            </div>
          </div>
        </section>`,
      body: `
        <section id="trinity-loop" class="section-studio section-scrolly uk-flex uk-flex-middle" uk-height-viewport="expand:true">
          <div class="uk-container">
            <h2 class="studio-title uk-text-center studio-title--medium uk-margin-bottom">The Trinity</h2>
            <div uk-grid class="uk-grid-small uk-child-width-1-3@m uk-child-width-1-1">
              <div>
                <span class="section-number">I</span>
                <h3 class="studio-title studio-title--meta">Narrative</h3>
                <p class="studio-text studio-text--meta">Scene-first thinking. Scroll maps to emotion. Camera choreography — position, look-at, FOV offset — all state-driven.</p>
              </div>
              <div>
                <span class="section-number">II</span>
                <h3 class="studio-title studio-title--meta">Runtime</h3>
                <p class="studio-text studio-text--meta">Scroll → State → Scene. One source of truth for DOM and WebGL. Material presets shift with every scroll stop.</p>
              </div>
              <div>
                <span class="section-number">III</span>
                <h3 class="studio-title studio-title--meta">Operations</h3>
                <p class="studio-text studio-text--meta">Zero random disposal. Chunked bundles. Lazy textures. Lifecycle is a feature.</p>
              </div>
            </div>
            <p class="studio-text uk-text-center studio-text--body uk-margin-medium-top">
              Narrative informs runtime. Runtime demands operations. Operations enable the next narrative.<br/>
              <em>The Trinity isn't a stack — it's a spiral.</em>
            </p>
          </div>
        </section>`,
      footer: sharedFooter(),
    },
  }
}

export function worksPage(): PageLayout {
  return {
    title: 'JUSTLOVEJAZZ — Works',
    sections: {
      intro: `
        <section id="works-hero" class="section-studio uk-flex uk-flex-middle section-intro" uk-height-viewport="expand:true">
          <div class="uk-container uk-text-center">
            <h1 class="studio-title studio-title--xl">
              <span class="studio-title__line">Four</span>
              <span class="studio-title__line">Universes.</span>
            </h1>
            <p class="studio-tagline uk-margin-auto-center">Each carries its own material preset, timeline, and deliverable.</p>
          </div>
        </section>`,
      body: `
        <section id="gallery" class="section-studio section-scrolly uk-flex uk-flex-top" uk-height-viewport="expand:true">
          <div class="uk-container">
            <div class="works-grid">
              <a href="/projects/ebb-vibes.html" class="works-grid__card" aria-label="Ebb Vibes — Visual Music">
                <div class="works-grid__thumbnail" style="background-image:url('/assets/projects/ebb-vibes/cover.webp'); background-color:#ff5500;">
                  <div class="works-grid__placeholder" aria-hidden="true">
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
                      <circle cx="50" cy="50" r="30" stroke-dasharray="4 6"/><circle cx="50" cy="50" r="15"/>
                      <path d="M50 20v15M50 65v15M20 50h15M65 50h15"/>
                    </svg>
                  </div>
                </div>
                <div class="works-grid__content">
                  <div class="works-grid__header"><span class="works-grid__index">01</span><span class="works-grid__category">Visual Music</span></div>
                  <h3 class="works-grid__title">Ebb Vibes</h3>
                  <p class="works-grid__desc">Late night sessions captured in digital harmony.</p>
                  <div class="works-grid__tags"><span class="works-grid__tag">WebGPU</span><span class="works-grid__tag">Procedural</span></div>
                  <span class="works-grid__year">2025</span>
                </div>
              </a>
              <a href="/projects/mono-sunday.html" class="works-grid__card" aria-label="Mono Sunday — Minimalist">
                <div class="works-grid__thumbnail" style="background-image:url('/assets/projects/mono-sunday/cover.webp'); background-color:#88cc70;">
                  <div class="works-grid__placeholder" aria-hidden="true">
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="20" y="20" width="60" height="60" rx="4"/><line x1="20" y1="50" x2="80" y2="50"/>
                    </svg>
                  </div>
                </div>
                <div class="works-grid__content">
                  <div class="works-grid__header"><span class="works-grid__index">02</span><span class="works-grid__category">Minimalist</span></div>
                  <h3 class="works-grid__title">Mono Sunday</h3>
                  <p class="works-grid__desc">Three chords and the silence between them.</p>
                  <div class="works-grid__tags"><span class="works-grid__tag">Ambient</span><span class="works-grid__tag">Texture</span></div>
                  <span class="works-grid__year">2024</span>
                </div>
              </a>
              <a href="/projects/till-at-night.html" class="works-grid__card" aria-label="Until the Night — Crossover">
                <div class="works-grid__thumbnail" style="background-image:url('/assets/projects/till-at-night/cover.webp); background-color:#cc88ff;">
                  <div class="works-grid__placeholder" aria-hidden="true">
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
                      <polygon points="50,15 85,80 15,80"/><polygon points="50,35 70,70 30,70"/>
                    </svg>
                  </div>
                </div>
                <div class="works-grid__content">
                  <div class="works-grid__header"><span class="works-grid__index">03</span><span class="works-grid__category">Crossover</span></div>
                  <h3 class="works-grid__title">Until the Night</h3>
                  <p class="works-grid__desc">Analog meets algorithm. Real instruments, synthetic space.</p>
                  <div class="works-grid__tags"><span class="works-grid__tag">Analogue</span><span class="works-grid__tag">Synth</span></div>
                  <span class="works-grid__year">2025</span>
                </div>
              </a>
              <a href="/projects/undercurrent.html" class="works-grid__card" aria-label="Undercurrent — Electronic">
                <div class="works-grid__thumbnail" style="background-image:url('/assets/projects/undercurrent/cover.webp); background-color:#222233;">
                  <div class="works-grid__placeholder" aria-hidden="true">
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M10 50 Q25 30 40 50 Q55 70 70 50 Q85 30 95 50"/><circle cx="50" cy="50" r="8"/>
                    </svg>
                  </div>
                </div>
                <div class="works-grid__content">
                  <div class="works-grid__header"><span class="works-grid__index">04</span><span class="works-grid__category">Electronic</span></div>
                  <h3 class="works-grid__title">Undercurrent</h3>
                  <p class="works-grid__desc">Sub-bass meditation. Frequencies below hearing, above feeling.</p>
                  <div class="works-grid__tags"><span class="works-grid__tag">Subwoofer</span><span class="works-grid__tag">3D Audio</span></div>
                  <span class="works-grid__year">2024</span>
                </div>
              </a>
            </div>
          </div>
        </section>`,
      footer: sharedFooter(),
    },
  }
}

// Page factory — returns template for any key.
export const PAGES: Record<string, () => PageLayout> = {
  home: homePage,
  trinity: trinityPage,
  works: worksPage,
}

export function renderPage(key: string): string {
  const layout = (PAGES[key] ?? PAGES.home)()
  return layout.sections.intro + layout.sections.body + layout.sections.footer
}
