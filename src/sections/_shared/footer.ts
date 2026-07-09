// src/sections/_shared/footer.ts — Unified dock (2-row: tools + footer)
//
// Layout (bottom of screen, all pages):
//   ┌──────────────────────────────────────┐
//   │  TOOLS ROW  (joystick sits here)     │  ← .jlz-dock__tools
//   ├──────────────────────────────────────┤
//   │  FOOTER ROW (brand + social)         │  ← .jlz-dock__footer
//   └──────────────────────────────────────┘
//
// The joystick is position:fixed (110px, centered, bottom anchored to the
// tools row). It visually overlaps the tools row — its base sits ON the
// tools bar. The tools row reserves space for it.

export const FOOTER = `
  <footer class="jlz-dock" data-footer role="contentinfo">
    <!-- Tools row — joystick visually sits on top of this -->
    <div class="jlz-dock__tools" id="jlz-dock-tools"></div>
    <!-- Footer row — brand + copyright + social -->
    <div class="jlz-dock__footer">
      <div class="jlz-dock__footer-inner">
        <div class="jlz-dock__brand uk-flex uk-flex-middle">
          <a class="uk-navbar-item uk-logo jlz-brand" href="/app" aria-label="JUSTLOVEJAZZ home">l@6</a>
          <span class="uk-text-meta jlz-dock__copy">© ${new Date().getFullYear()} JUSTLOVEJAZZ</span>
        </div>
        <div class="jlz-dock__social">
          <ul class="uk-iconnav">
            <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
            <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
            <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
`
