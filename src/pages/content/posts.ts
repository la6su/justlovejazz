// src/pages/content/posts.ts — Posts page (6 sections, Apple Watch layout)
// TOP (eyebrow+title) / 3D CENTER (glass cube) / BOTTOM (UI panel)

import { PAGE_REVEAL } from '../../sections/_shared/constants'
import { FOOTER } from '../../sections/_shared/footer'

export function postsPage(): string {
  const posts = [
    { cat: 'Shaders', title: 'Why TSL Changes Everything', excerpt: 'TSL node graphs compiled on the fly.', date: 'Jul 2026' },
    { cat: 'Process', title: 'Designing in the Browser', excerpt: 'Why we killed static mockups.', date: 'Jun 2026' },
    { cat: 'Performance', title: 'On-Demand Rendering', excerpt: 'Zero draw calls when idle.', date: 'May 2026' },
    { cat: 'WebGPU', title: 'WebGPU or Bust', excerpt: 'Real WebGPU vs WebGLBackend.', date: 'Apr 2026' },
  ]
  return `
    <article class="jlz-page" data-page-view="posts">
      <!-- 0: Intro (light) -->
      <section class="jlz-page-section section-active uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-intro">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; JOURNAL</span>
            <h1 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Writing</h1>
            <p class="uk-text-meta">Notes from the studio</p>
          </div>
        </div>
      </section>

      <!-- 1: Latest posts (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-latest">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; LATEST</span>
          </div>
          <div class="uk-grid-small uk-child-width-1-2 uk-margin-top" uk-grid uk-scrollspy-class>
            ${posts.map((p) => `
              <article class="uk-card uk-card-default uk-card-body uk-card-hover">
                <div class="uk-flex uk-flex-between uk-flex-middle">
                  <span class="uk-label">${p.cat}</span>
                  <span class="uk-text-meta">${p.date}</span>
                </div>
                <h2 class="uk-card-title uk-margin-small-top uk-margin-remove-bottom">${p.title}</h2>
                <p class="uk-text-meta uk-margin-small-top">${p.excerpt}</p>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 2: Featured (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-featured">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; FEATURED</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Why TSL Changes Everything</h2>
            <p class="uk-text-meta uk-margin-small-top">The shader stack we've been waiting for</p>
          </div>
          <div uk-scrollspy-class>
            <a class="uk-button uk-button-default" href="/posts">Read full article →</a>
          </div>
        </div>
      </section>

      <!-- 3: Categories (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m" data-page-section="posts-categories">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-text-center uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; TOPICS</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">By category</h2>
          </div>
          <div class="uk-grid-small uk-child-width-1-2@s uk-child-width-1-4@m uk-margin-top" uk-grid uk-scrollspy-class>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center"><span class="uk-text-large">◈</span><h3 class="uk-h5 uk-margin-small-top">Shaders</h3><p class="uk-text-meta">GLSL & TSL</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center"><span class="uk-text-large">◉</span><h3 class="uk-h5 uk-margin-small-top">Process</h3><p class="uk-text-meta">How we work</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center"><span class="uk-text-large">⬡</span><h3 class="uk-h5 uk-margin-small-top">Performance</h3><p class="uk-text-meta">Fast 3D</p></div>
            <div class="uk-card uk-card-default uk-card-body uk-card-hover uk-text-center"><span class="uk-text-large">⁂</span><h3 class="uk-h5 uk-margin-small-top">WebGPU</h3><p class="uk-text-meta">Native GPU</p></div>
          </div>
        </div>
      </section>

      <!-- 4: Contact (light) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-contact">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; WANT MORE?</span>
            <h2 class="uk-heading-large uk-margin-small-top uk-margin-remove-bottom">Follow the studio</h2>
          </div>
          <div uk-scrollspy-class>
            <a href="mailto:hello@justlovejazz.com" class="uk-button uk-button-primary uk-button-large">Get in touch</a>
          </div>
        </div>
      </section>

      <!-- 5: Archive (dark) -->
      <section class="jlz-page-section uk-section uk-section-small uk-section-medium@s uk-section-large@m uk-text-center" data-page-section="posts-archive">
        <div class="uk-container uk-container-expand uk-flex uk-flex-column uk-flex-between uk-height-1-1" ${PAGE_REVEAL}>
          <div uk-scrollspy-class>
            <span class="jlz-eyebrow uk-text-meta uk-text-uppercase">&gt; ARCHIVE</span>
            <h2 class="uk-heading-medium uk-margin-small-top uk-margin-remove-bottom">Older notes</h2>
          </div>
          <div uk-scrollspy-class>
            <p class="uk-text-meta">Short-form writing going back to 2019. Experiments, rants, breakthroughs.</p>
          </div>
        </div>
      </section>
    </article>
    ${FOOTER}
  `
}
