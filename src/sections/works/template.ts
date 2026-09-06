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
    <div class="jlz-works-slider-controls uk-position-cover uk-flex uk-flex-middle uk-flex-between" role="group" aria-labelledby="jlz-works-title">
      <button class="jlz-nav-arrow jlz-works-slider-arrow jlz-works-slider-arrow--prev uk-flex uk-flex-middle uk-flex-center" type="button"
              data-baku-carousel-control="prev" aria-label="Previous work" data-cursor="view">
        <span uk-icon="icon: slidenav-previous-large" aria-hidden="true"></span>
      </button>
      <button class="jlz-nav-arrow jlz-works-slider-arrow jlz-works-slider-arrow--next uk-flex uk-flex-middle uk-flex-center" type="button"
              data-baku-carousel-control="next" aria-label="Next work" data-cursor="view">
        <span uk-icon="icon: slidenav-next-large" aria-hidden="true"></span>
      </button>
    </div>
  `
  const entrance = `<a href="/works" class="jlz-works-entrance uk-button uk-button-default"><span data-i18n="works.enterRooms">Explore the four rooms</span> ↗</a>`
  return sectionShell('works', accessibleTitle, '', 'home', false, '', controls + entrance)
}
