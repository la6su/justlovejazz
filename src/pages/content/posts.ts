// src/pages/content/posts.ts — Posts page (6 sections, cube-face structure)
//
// 6 sections like home: Intro (light) → 4 unique post sections → Contact (light)
// + 2 secret side sections (Lab/Process) reachable via horizontal joystick.
//
// Intro and Contact (last) are light/inverse by default — matches home pattern.

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function postsPage(): string {
  const posts = [
    { cat: 'Shaders', title: 'Why TSL Changes Everything', excerpt: 'TSL node graphs compiled on the fly — WebGPU portability without boilerplate.', date: 'Jul 2026' },
    { cat: 'Process', title: 'Designing in the Browser', excerpt: 'Why we killed static mockups and sketch directly in WebGL.', date: 'Jun 2026' },
    { cat: 'Performance', title: 'On-Demand Rendering', excerpt: 'Zero draw calls when idle. 3D sites that stay fast.', date: 'May 2026' },
    { cat: 'WebGPU', title: 'WebGPU or Bust', excerpt: 'Real WebGPU vs WebGLBackend — what ships to users in 2026.', date: 'Apr 2026' },
  ]
  return `
    <article class="jlz-page" data-page-view="posts">
      <!-- 0: Intro (light/inverse) — journal intro -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-intro">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Journal</p>
          <h1 class="uk-heading-large uk-margin-remove-top" uk-scrollspy-class>Writing</h1>
          <p class="uk-text-lead uk-margin-top" uk-scrollspy-class>Notes from the studio — tools, releases, and decisions behind the work. No SEO bait.</p>
        </div>
      </section>

      <!-- 1: Latest posts — magazine grid -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-latest">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Latest</p>
          <div class="uk-grid-small uk-child-width-1-2 uk-child-width-1-2@m uk-margin-top" uk-grid>
            ${posts.map((p) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover" uk-scrollspy-class>
                <div class="uk-flex uk-flex-between uk-flex-middle">
                  <span class="uk-label">${p.cat}</span>
                  <span class="uk-text-meta">${p.date}</span>
                </div>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${p.title}</h2>
                <p class="uk-text-meta uk-margin-small-top uk-visible@m">${p.excerpt}</p>
                <a class="uk-button uk-button-text uk-margin-top uk-visible@m" href="/posts">Read →</a>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2: Featured — single highlight -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-featured">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Featured</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>Why TSL Changes Everything</h2>
          <p class="uk-text-lead uk-margin-top uk-width-2-3@m uk-margin-auto" uk-scrollspy-class>Three.js TSL node graphs compiled on the fly — WebGPU portability without the boilerplate. The shader stack we've been waiting for.</p>
          <a class="uk-button uk-button-default uk-margin-top" href="/posts" uk-scrollspy-class>Read full article →</a>
        </div>
      </section>

      <!-- 3: Categories — topic grid -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-categories">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Topics</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>By category</h2>
          <div class="uk-grid-small uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-top" uk-grid>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" uk-scrollspy-class><span class="uk-text-large">◈</span><h3 class="uk-h5 uk-margin-small-top">Shaders</h3><p class="uk-text-meta">GLSL & TSL</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" uk-scrollspy-class><span class="uk-text-large">◉</span><h3 class="uk-h5 uk-margin-small-top">Process</h3><p class="uk-text-meta">How we work</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" uk-scrollspy-class><span class="uk-text-large">⬡</span><h3 class="uk-h5 uk-margin-small-top">Performance</h3><p class="uk-text-meta">Fast 3D</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center" uk-scrollspy-class><span class="uk-text-large">⁂</span><h3 class="uk-h5 uk-margin-small-top">WebGPU</h3><p class="uk-text-meta">Native GPU</p></div>
          </div>
        </div>
      </section>

      <!-- 4: Contact (last, light/inverse) — CTA -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-contact">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <h2 class="uk-heading-large uk-margin-remove" uk-scrollspy-class>Want more?</h2>
          <p class="uk-text-lead uk-margin-top" uk-scrollspy-class>Follow the studio or reach out directly.</p>
          <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large uk-margin-top" uk-scrollspy-class>Get in touch</a>
        </div>
      </section>

      <!-- 5: Process (secret right) — archive note -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-archive">
        <div class="uk-container uk-container-expand" ${PAGE_REVEAL}>
          <p class="uk-text-meta uk-text-uppercase" uk-scrollspy-class>Archive</p>
          <h2 class="uk-heading-medium uk-margin-top" uk-scrollspy-class>Older notes</h2>
          <p class="uk-text-meta uk-margin-top" uk-scrollspy-class>Short-form writing going back to 2019. Mostly experiments, some rants, a few breakthroughs.</p>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
