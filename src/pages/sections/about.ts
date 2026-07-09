// src/pages/sections/about.ts — Face 2: About (right face +X)
//
// Two-column split with stats. Title left, body + stats right.
//
// 3D sync: EnvSphere pattern 2 (dark grey gradient), SplashCube face 2.

import { REVEAL } from '../shared/constants'

export function aboutSection(): string {
  return `
    <!-- 2: ABOUT (right face +X) — two-column split with stats -->
    <section uk-height-viewport="expand: true"
             class="uk-section uk-section-small uk-section-medium@s uk-section-large@m" id="section-about" data-section="about">
      <div class="uk-position-cover" data-dynamic-content>
        <div class="uk-container uk-container-expand uk-padding uk-grid uk-child-width-1-2@m uk-grid-match uk-text-left uk-height-1-1" uk-grid>
          <div class="uk-width-1-2@m uk-flex uk-flex-middle">
            <div>
              <h2 class="studio-title uk-heading-medium"
                  data-content-id="about-title">About</h2>
              <p class="uk-text-meta uk-margin-top" ${REVEAL}>WebGPU · Three.js · TSL · UIkit</p>
            </div>
          </div>
          <div class="uk-width-1-2@m" ${REVEAL}>
            <p class="uk-text-lead" data-content-id="about-text">
              A small studio crafting expressive browser experiences. We merge
              art direction with web engineering — 3D-first interfaces, spatial
              design, and real-time shaders that stay fast under pressure.
            </p>
            <div class="uk-grid-small uk-child-width-1-3 uk-margin-top" uk-grid ${REVEAL}>
              <div class="uk-text-center">
                <div class="uk-heading-medium uk-margin-remove">7+</div>
                <span class="uk-text-meta">Years</span>
              </div>
              <div class="uk-text-center">
                <div class="uk-heading-medium uk-margin-remove">40+</div>
                <span class="uk-text-meta">Projects</span>
              </div>
              <div class="uk-text-center">
                <div class="uk-heading-medium uk-margin-remove">12</div>
                <span class="uk-text-meta">Awards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}
