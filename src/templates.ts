// Simple template renderer — returns HTML string from tag fragments.
// 4 clear sections: Studio (Hero) → Trinity (About) → Works → Footer (Contact)

// ─────────────── shared sections ───────────────

function sharedFooter(): string {
  return `
    <footer id="section-contact" class="section-studio section-centered uk-flex uk-flex-middle" data-section="footer">
      <div class="uk-container uk-text-center">
        <span class="section-number">∞</span>
        <h2 class="studio-title studio-title--medium uk-text-center">Start<br/><span>a Project</span></h2>
        <p class="studio-text studio-text--meta">Direction · 3D · Frontend</p>
        <div class="uk-margin-medium-top">
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-secondary uk-button-large">hello@justlovejazz.com</a>
        </div>
      </div>
    </footer>`
}

// ─────────────── 4 sections (Studio → Trinity → Works → Contact) ───────────────
// Each = 1 screen, scroll snaps to section boundary via Lenis + CSS scroll-snap.

export function homePage(): string {
  return `
    <!-- ─── SECTION 1: STUDIO / HERO ─── -->
    <section id="section-hero" data-section="hero" class="section-studio section-hero uk-flex uk-flex-middle" uk-height-viewport>
      <div class="uk-container uk-text-center">
        <h1 class="studio-title studio-title--xl">
          <span class="studio-title__line">JUSTLOVEJAZZ</span>
        </h1>
        <p class="studio-tagline uk-margin-auto-center">Visual studio · Creative direction</p>
      </div>
    </section>

    <!-- ─── SECTION 2: TRINITY / ABOUT ─── -->
    <section id="section-about" data-section="about" class="section-studio uk-flex uk-flex-middle" uk-height-viewport="expand:true">
      <div class="uk-container">
        <h2 class="studio-title uk-text-center studio-title--medium uk-margin-bottom">The Trinity</h2>
        <div uk-grid class="uk-grid-small uk-child-width-1-3@m uk-child-width-1-1">
          <div>
            <span class="section-number">I</span>
            <h3 class="studio-title studio-title--meta">Narrative</h3>
            <p class="studio-text studio-text--meta">Scene-first thinking. Scroll maps to emotion.</p>
          </div>
          <div>
            <span class="section-number">II</span>
            <h3 class="studio-title studio-title--meta">Runtime</h3>
            <p class="studio-text studio-text--meta">One source of truth for DOM and WebGL.</p>
          </div>
          <div>
            <span class="section-number">III</span>
            <h3 class="studio-title studio-title--meta">Operations</h3>
            <p class="studio-text studio-text--meta">Lifecycle is a feature, not an afterthought.</p>
          </div>
        </div>
        <p class="studio-text uk-text-center studio-text--body uk-margin-medium-top">
          The Trinity isn't a stack — it's a loop.
        </p>
      </div>
    </section>

    <!-- ─── SECTION 3: WORKS / GALLERY ─── -->
    <section id="section-works" data-section="works" class="section-studio section-works-slider" uk-height-viewport="expand:true">
      <div id="gallery-anchor" data-role="3d-gallery"></div>
    </section>

    <!-- ─── SECTION 4: FOOTER / CONTACT ─── -->
    ${sharedFooter()}
  `
}

// ─────────────── Legacy page definitions ───────────────

export interface PageData {
  intro: string
  body: string
  section2: string
  footer: string
}

export interface PageLayout {
  title: string
  sections: PageData
}

export const PAGES: Record<string, () => PageLayout> = {
  home: (): PageLayout => ({
    title: 'JUSTLOVEJAZZ',
    sections: { intro: '', body: '', section2: '', footer: '' },
  }),
}

export function renderPage(): string {
  return homePage()
}
