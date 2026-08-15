import type { StyleGroupId } from './style'

const showcaseSections: Record<StyleGroupId, string> = {
  global: `
    <section class="jlz-style-sample" data-style-sample="global">
      <span class="jlz-style-eyebrow">Global / color system</span>
      <div class="jlz-style-swatches" aria-label="Theme colors">
        <div class="is-accent"><span>Primary</span></div>
        <div class="is-background"><span>Background</span></div>
        <div class="is-surface"><span>Surface</span></div>
        <div class="is-elevated"><span>Elevated</span></div>
      </div>
      <hr>
      <p>Global tokens are the shared source for UIkit components and the 3D shell.</p>
    </section>`,
  theme: `
    <section class="jlz-style-sample" data-style-sample="theme">
      <span class="jlz-style-eyebrow">Theme / signals</span>
      <h2>JUSTLOVEJAZZ signal language</h2>
      <div class="jlz-style-signal-row">
        <span class="is-primary">Primary signal</span>
        <span class="is-cool">Cool signal</span>
        <span class="is-ember">Ember signal</span>
      </div>
    </section>`,
  inverse: `
    <section class="jlz-style-sample jlz-style-inverse-sample" data-style-sample="inverse">
      <span class="jlz-style-eyebrow">Inverse / paper polarity</span>
      <h2>Readable on light surfaces</h2>
      <p>The inverse palette remains authored, accessible and independent from the dark console.</p>
      <a href="#style-preview">Inverse link</a>
    </section>`,
  base: `
    <section class="jlz-style-sample" data-style-sample="base">
      <span class="jlz-style-eyebrow">Base / typography</span>
      <h1>Article title</h1>
      <h2>Section heading</h2>
      <p class="uk-text-lead">Lead copy establishes the principal idea without competing with the title.</p>
      <p>Body copy carries the useful detail. <a href="#style-preview">Links</a>, <strong>strong text</strong>, <em>emphasis</em> and <code>inline code</code> remain distinct.</p>
      <p class="uk-text-meta">Metadata · 15 August 2026 · JUSTLOVEJAZZ</p>
      <blockquote>Design systems become useful when every decision has one owner.</blockquote>
    </section>`,
  button: `
    <section class="jlz-style-sample" data-style-sample="button">
      <span class="jlz-style-eyebrow">Button / states</span>
      <h2>Actions</h2>
      <div class="jlz-style-button-row">
        <button class="uk-button uk-button-default" type="button">Default</button>
        <button class="uk-button uk-button-primary" type="button">Primary</button>
        <button class="uk-button uk-button-secondary" type="button">Secondary</button>
        <button class="uk-button uk-button-text" type="button">Text</button>
        <button class="uk-button uk-button-default" type="button" disabled>Disabled</button>
      </div>
    </section>`,
  card: `
    <section class="jlz-style-sample" data-style-sample="card">
      <span class="jlz-style-eyebrow">Card / surfaces</span>
      <div class="jlz-style-card-grid">
        <article class="uk-card uk-card-default uk-card-body"><h3>Default</h3><p>Neutral content surface.</p></article>
        <article class="uk-card uk-card-primary uk-card-body"><h3>Primary</h3><p>Brand emphasis surface.</p></article>
        <article class="uk-card uk-card-secondary uk-card-body"><h3>Secondary</h3><p>Elevated dark surface.</p></article>
      </div>
    </section>`,
  section: `
    <section class="jlz-style-sample" data-style-sample="section">
      <span class="jlz-style-eyebrow">Section / backgrounds</span>
      <div class="jlz-style-section-stack">
        <div class="uk-section uk-section-default"><div class="uk-container">Default section</div></div>
        <div class="uk-section uk-section-muted"><div class="uk-container">Muted section</div></div>
        <div class="uk-section uk-section-primary"><div class="uk-container">Primary section</div></div>
        <div class="uk-section uk-section-secondary"><div class="uk-container">Secondary section</div></div>
      </div>
    </section>`,
  form: `
    <section class="jlz-style-sample" data-style-sample="form">
      <span class="jlz-style-eyebrow">Form / controls</span>
      <form class="uk-form-stacked" action="#style-preview">
        <label class="uk-form-label" for="style-name">Project name</label>
        <div class="uk-form-controls"><input id="style-name" class="uk-input" value="Realtime identity"></div>
        <label class="uk-form-label" for="style-type">Project type</label>
        <div class="uk-form-controls"><select id="style-type" class="uk-select"><option>WebGPU experience</option><option>Visual system</option></select></div>
        <label class="uk-form-label" for="style-notes">Notes</label>
        <div class="uk-form-controls"><textarea id="style-notes" class="uk-textarea">A concise project brief.</textarea></div>
      </form>
    </section>`,
  navbar: `
    <section class="jlz-style-sample" data-style-sample="navbar">
      <span class="jlz-style-eyebrow">Navbar / navigation</span>
      <nav class="uk-navbar-container" uk-navbar aria-label="Style preview navigation">
        <div class="uk-navbar-left"><a class="uk-navbar-item uk-logo" href="#style-preview">JLZ</a><ul class="uk-navbar-nav"><li class="uk-active"><a href="#style-preview">Active</a></li><li><a href="#style-preview">Works</a></li><li><a href="#style-preview">Lab</a></li></ul></div>
      </nav>
    </section>`,
}

export function renderStyleShowcase(selected: StyleGroupId, showAll: boolean): string {
  const sections = showAll
    ? (Object.keys(showcaseSections) as StyleGroupId[]).map((id) => showcaseSections[id]).join('')
    : showcaseSections[selected]
  return `<div id="style-preview" class="jlz-style-showcase">${sections}</div>`
}
