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
        <section id="home-hero" data-section="step05" class="section-studio uk-flex uk-flex-middle section-intro" uk-height-viewport>
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
        <section id="home-body" data-section="step06" class="section-studio section-scrolly uk-flex uk-flex-middle" uk-height-viewport="expand:true">
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
        <section id="trinity-hero" data-section="step01" class="section-studio uk-flex uk-flex-middle section-intro" uk-height-viewport>
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
        <section id="trinity-loop" data-section="step02" class="section-studio section-scrolly uk-flex uk-flex-middle" uk-height-viewport="expand:true">
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
        <section id="works-slider" data-section="step03" class="section-studio section-works-slider" uk-height-viewport="expand:true">
          <div id="gallery-anchor" data-role="3d-gallery"></div>
        </section>`,
      body: ``,
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
