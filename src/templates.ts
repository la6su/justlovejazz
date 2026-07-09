// templates.ts — HTML string templates for SPA rendering.
// 8 sections matching junni reference (6 main + 2 secret side, 1:1 with 3D scene groups).
//
// Built with UIkit 3 utility/component classes for layout, spacing,
// typography, cards, buttons, and modal chrome:
//   - uk-position-relative + uk-height-viewport   (main#spa-content shell)
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
//   - .jlz-corner-label*       — custom positioning (kept for future use)
//   - .jlz-fs-*                — ProjectOverlay fullscreen styles
//                                (defined in main.less, used by ProjectOverlay.ts)

export function homePage(): string {
  // Reusable scrollspy attribute — keeps markup DRY and the value
  // consistent across sections (so a future tweak is one-line).
  const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

  return `
    <!-- ═══ 8 child sections (6 main + 2 secret side) ═══ -->

    <!-- 00: LAB (secret left) — Experiments & interactive demos -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-large" id="section-lab" data-section="lab">
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
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="shader">
              <span class="uk-text-large" aria-hidden="true">◈</span>
              <h3 class="uk-card-title">Shader Playground</h3>
              <p class="uk-text-meta">Live GLSL fragments</p>
            </div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-flex uk-flex-column uk-flex-middle uk-text-center" data-lab="audio">
              <span class="uk-text-large" aria-hidden="true">◉</span>
              <h3 class="uk-card-title">Audio Reactive</h3>
              <p class="uk-text-meta">Sound → geometry</p>
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

    <!-- 01: INTRO — baku cube center, hero at top, scroll hint at bottom -->
      <section uk-height-viewport="expand: true"
               class="uk-section uk-section-large" id="section-intro" data-section="intro">
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
               class="uk-section uk-section-large" id="section-about" data-section="about">
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

    <!-- 03: WORKS — gallery, cube + carousel morph -->
      <section uk-height-viewport="expand: true"
               class="uk-section uk-section-large" id="section-challenge" data-section="challenge">
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

    <!-- 04: CONTACT — large CTA, glass buttons -->
      <section uk-height-viewport="expand: true"
               class="uk-section uk-section-large" id="section-contact" data-section="contact">
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
            <p class="uk-text-meta uk-margin-large-top" ${REVEAL}>© 2026 l@6.su — Crafted with Love</p>
          </div>
        </div>
      </section>

    <!-- 05: PROCESS (secret right) — Workflow timeline & studio manifesto -->
      <section uk-height-viewport="expand: true"
               class="uk-section uk-section-large" id="section-process" data-section="process">
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

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
  `
}

export type PageId = 'home' | 'music' | 'videos' | 'shows' | 'news' | 'about' | 'gallery'

const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

export function renderMusicPage(): string {
  return `
    <article class="jlz-page" data-page-view="music">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="music-discography">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Discography</p>
          <h1 class="uk-heading-xlarge">Selected Sounds</h1>
          <div class="uk-grid-large uk-child-width-1-2@m uk-grid-match uk-margin-large-top" uk-grid>
            ${albumCard('Nocturne Blue', 'Album * 2026', ['After Hours', 'Velvet Echo', 'Mono Sunday', 'Undercurrent'])}
            ${albumCard('Ebb Vibes', 'Single * 2026', ['Warm Tape', 'Golden Delay', 'Blue Room'])}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="music-platforms">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Listen Now</h2>
          <div class="uk-grid-small uk-child-width-auto@s uk-margin-medium-top" uk-grid>
            ${platformButton('Spotify')}
            ${platformButton('Apple Music')}
            ${platformButton('SoundCloud')}
            ${platformButton('Bandcamp')}
          </div>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderVideosPage(): string {
  const videos = ['Heartbeat Session', 'Golden Days Live', 'Nightscape Cut']
  return `
    <article class="jlz-page" data-page-view="videos">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="videos-archive">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Videos</p>
          <h1 class="uk-heading-xlarge">Motion Archive</h1>
          <div class="uk-grid-large uk-child-width-1-3@m uk-grid-match uk-margin-large-top" uk-grid>
            ${videos.map((title, index) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover">
                <span class="uk-text-meta">0${index + 1}</span>
                <h2 class="uk-card-title">${title}</h2>
                <p class="uk-text-meta">Cinematic live capture with reactive light and spatial sound.</p>
                <a class="uk-button uk-button-text" href="/videos">Watch</a>
          
    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="videos-stage">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Featured</p>
          <h2 class="uk-heading-xlarge">Live Capture</h2>
          <p class="uk-text-lead uk-margin-large-top">A rotating selection of stage edits, studio sketches, and projection tests built for full-screen viewing.</p>
          <a class="uk-button uk-button-default uk-margin-medium-top" href="/videos">Open Archive</a>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderShowsPage(): string {
  const shows = [
    ['17.06', 'Munich, DE'],
    ['19.06', 'Hamburg, DE'],
    ['24.07', 'Los Angeles, US'],
    ['26.07', 'Mexico City, MX'],
    ['03.08', 'Barcelona, ES'],
  ]
  return `
    <article class="jlz-page" data-page-view="shows">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="shows-events">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Past And Future Live</p>
          <h1 class="uk-heading-xlarge">Events</h1>
          <ul class="uk-list uk-list-divider uk-margin-large-top">
            ${shows.map(([date, city]) => `
              <li class="jlz-event-row uk-flex uk-flex-middle uk-flex-between">
                <span class="uk-text-large uk-text-bold">${date}</span>
                <h2 class="uk-h3 uk-margin-remove">${city}</h2>
                <a class="uk-button uk-button-default" href="/shows">Tickets</a>
              </li>
            `).join('')}
          </ul>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="shows-notes">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">On The Road</p>
          <h2 class="uk-heading-xlarge">Concert Notes</h2>
          <p class="uk-text-lead uk-margin-large-top">Compact stage packages, reactive visuals, and lighting cues for intimate rooms and festival screens.</p>
          <a class="uk-button uk-button-default uk-margin-medium-top" href="/shows">Book A Show</a>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderNewsPage(): string {
  const posts = [
    ['Shows', 'Street Serenades: Live On-The-Go Sessions'],
    ['Interviews', 'The Story Behind Second of Eternity'],
    ['Studio', 'How We Compose Interfaces With Light'],
  ]
  return `
    <article class="jlz-page" data-page-view="news">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="news-latest">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Latest Articles</p>
          <h1 class="uk-heading-xlarge">Journal</h1>
          <div class="uk-grid-large uk-child-width-1-3@m uk-grid-match uk-margin-large-top" uk-grid>
            ${posts.map(([category, title]) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover">
                <span class="uk-label">${category}</span>
                <h2 class="uk-card-title uk-margin-top">${title}</h2>
                <p class="uk-text-meta">Notes from experiments, shows, and production work.</p>
          
    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="news-dispatch">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Dispatch</p>
          <h2 class="uk-heading-xlarge">Studio Notes</h2>
          <p class="uk-text-lead uk-margin-large-top">Short-form writing about tools, releases, visual systems, and the decisions behind the work.</p>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderAboutPage(): string {
  return `
    <article class="jlz-page" data-page-view="about">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="about-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">About</p>
          <h1 class="uk-heading-xlarge">Let Us Introduce Ourselves</h1>
          <div class="uk-grid-large uk-child-width-1-2@m uk-margin-large-top" uk-grid>
            <p class="uk-text-lead">JUSTLOVEJAZZ is a small studio for expressive browser work: sound, motion, 3D, and interfaces that feel performed rather than placed.</p>
            <div>
              <h2 class="uk-heading-medium">Mix of Sounds</h2>
              <p>We combine web engineering with art direction, product thinking, and interactive systems built to stay fast under pressure.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="about-awards">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-medium">Awards & Recognition</h2>
          <ul class="uk-list uk-list-divider uk-margin-medium-top">
            <li><span class="uk-text-bold">2026</span> * WebGPU Portfolio Experiment</li>
            <li><span class="uk-text-bold">2025</span> * Interactive Music Identity</li>
            <li><span class="uk-text-bold">2024</span> * Generative Visual System</li>
          </ul>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderGalleryPage(): string {
  const items = ['Lab Lights', 'Baku Studies', 'Stage Forms', 'Glass Tests', 'Type Motion', 'Afterimage']
  return `
    <article class="jlz-page" data-page-view="gallery">
      <section class="jlz-page-section section-active uk-section uk-section-large" data-page-section="gallery-index">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Gallery</p>
          <h1 class="uk-heading-xlarge">Visual Index</h1>
          <div class="uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-margin-large-top" uk-grid>
            ${items.map((item, index) => `
              <div>
                <div class="jlz-gallery-tile uk-flex uk-flex-bottom uk-padding-small">
                  <span class="uk-text-bold">${String(index + 1).padStart(2, '0')} * ${item}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="jlz-page-section uk-section uk-section-large" data-page-section="gallery-series">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase">Series</p>
          <h2 class="uk-heading-xlarge">Studies In Light</h2>
          <p class="uk-text-lead uk-margin-large-top">Image groups for future case studies: glass, typography, stage identity, and experimental WebGPU sketches.</p>
        </div>
      </section>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

export function renderPage(page: PageId = 'home'): string {
  switch (page) {
    case 'music':
      return renderMusicPage()
    case 'videos':
      return renderVideosPage()
    case 'shows':
      return renderShowsPage()
    case 'news':
      return renderNewsPage()
    case 'about':
      return renderAboutPage()
    case 'gallery':
      return renderGalleryPage()
    case 'home':
    default:
      return homePage()
  }
}

function albumCard(title: string, meta: string, tracks: string[]): string {
  return `
    <article class="uk-card uk-card-default uk-card-body uk-card-hover">
      <p class="uk-text-meta">${meta}</p>
      <h2 class="uk-card-title">${title}</h2>
      <ul class="uk-list uk-list-divider">
        ${tracks.map((track, index) => `<li>(${index + 1}) ${track}</li>`).join('')}
      </ul>
      <a class="uk-button uk-button-text" href="/music">Listen Now</a>

    <!-- ═══ Unified footer — shared across all pages ═══ -->
    <footer class="jlz-footer uk-section uk-section-xsmall uk-text-center" data-footer>
      <div class="uk-container uk-container-expand">
        <div class="uk-flex uk-flex-middle uk-flex-between uk-flex-wrap uk-child-width-auto">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <ul class="uk-subnav uk-subnav-divider uk-margin-remove">
            <li><a href="/">Home</a></li>
            <li><a href="/#section-about">About</a></li>
            <li><a href="/#section-challenge">Works</a></li>
            <li><a href="/#section-contact">Contact</a></li>
          </ul>
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
        <p class="uk-text-meta uk-margin-small-top uk-margin-remove-bottom">© 2026 JUSTLOVEJAZZ — Crafted with glass, motion, and light.</p>
      </div>
    </footer>
    </article>
  `
}

function platformButton(label: string): string {
  return `<a class="uk-button uk-button-default" href="/music">${label}</a>`
}
