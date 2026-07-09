// src/pages/sections/works.ts — Face 3: Works (back face -Z)
//
// Gallery with BakuCarousel — the baku cube morphs into a ring of project cards.
// This is the ONLY section with BakuCarousel (showGallery: true in WorldConfig).
// Drag to spin, click any card to open fullscreen ProjectOverlay.
//
// 3D sync: EnvSphere pattern 3 (dark blue-grey gradient), SplashCube face 3.
// BakuCarousel lives in sceneGroups[3] — see World.ts + Experience.ts getCarousel().

import { REVEAL } from '../shared/constants'

export function worksSection(): string {
  return `
    <!-- 3: WORKS (back face -Z) — gallery, cube + carousel morph -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-challenge" data-section="challenge">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-top uk-text-center uk-height-1-1">
          <p class="uk-text-meta uk-text-uppercase" ${REVEAL}>Selected Work</p>
          <h2 class="studio-title uk-heading-medium"
              data-content-id="challenge-title">Works</h2>
          <p class="uk-text-lead" ${REVEAL}
             data-content-id="challenge-text">
            Six interactive experiences. Drag the carousel, click any card to open.
          </p>
          <div class="uk-margin-top uk-text-meta uk-flex uk-flex-center uk-flex-middle" uk-scrollspy="cls: uk-animation-fade; delay: 500" style="gap: 0.5rem;">
            <span uk-icon="icon: arrow-left; ratio: 0.7" aria-hidden="true"></span>
            <span>drag to spin</span>
            <span uk-icon="icon: arrow-right; ratio: 0.7" aria-hidden="true"></span>
          </div>
        </div>

        <div id="project-overlay" class="uk-position-z-index"></div>
      </div>
    </section>
  `
}
