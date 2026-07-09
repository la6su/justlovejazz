// src/pages/shared/footer.ts — Unified footer (minimal: brand + social only)
//
// Fixed bottom bar — content pages use position:absolute stacked sections
// with overflow:hidden on #spa-content, so uk-sticky doesn't work (no scroll).
// Fixed positioning keeps it pinned to the viewport bottom on all pages.
// Hidden on home (Contact section serves as the home footer).
//
// Navigation lives in the header (UIMenu slider + modal), NOT here.

export const FOOTER = `
  <footer class="jlz-footer" data-footer>
    <div class="uk-container uk-container-expand">
      <div class="uk-flex uk-flex-middle uk-flex-center uk-flex-wrap">
        <a class="uk-navbar-item uk-logo jlz-brand uk-margin-right" href="/" aria-label="JUSTLOVEJAZZ home">l@6</a>
        <ul class="uk-iconnav">
          <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
          <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
          <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
        </ul>
      </div>
    </div>
  </footer>
`
