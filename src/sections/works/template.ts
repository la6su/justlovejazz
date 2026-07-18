// src/sections/works/template.ts — Face 3: Works (back face -Z, BakuCarousel)
// data-section="works" matches WorldConfig domSection (3D sync).
import { sectionShell } from '../_shared/constants'

export function worksSection(): string {
  // The title remains in the DOM for native navigation labels and assistive
  // technology, but the Works frame itself is deliberately image-only.
  const accessibleTitle = `
    <h2 id="jlz-works-title" data-i18n="home.works.title" hidden>Works</h2>
  `
  const controls = `
    <div class="jlz-works-slider-controls" role="group" aria-labelledby="jlz-works-title">
      <button class="jlz-works-slider-arrow jlz-works-slider-arrow--prev uk-icon-button" type="button"
              data-baku-carousel-control="prev" aria-label="Previous work" data-cursor="view">
        <span uk-icon="icon: arrow-left; ratio: 1.55" aria-hidden="true"></span>
      </button>
      <button class="jlz-works-slider-arrow jlz-works-slider-arrow--next uk-icon-button" type="button"
              data-baku-carousel-control="next" aria-label="Next work" data-cursor="view">
        <span uk-icon="icon: arrow-right; ratio: 1.55" aria-hidden="true"></span>
      </button>
    </div>
  `
  return sectionShell('works', accessibleTitle, '', 'home', false, '', controls)
}
