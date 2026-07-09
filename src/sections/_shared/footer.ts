// src/sections/_shared/footer.ts — Unified dock (footer + tools bar)
//
// The dock is a fixed bottom bar with two zones:
//   LEFT:  brand + copyright
//   CENTER: tools (joystick lives here — injected by JoystickNav)
//   RIGHT: social icons
//
// This reserves space at the bottom of the screen on ALL pages.
// Content sections get padding-bottom via CSS to avoid being covered.
// The joystick is NOT position:fixed on its own — it lives inside the
// dock's .jlz-dock__tools container.

export const FOOTER = `
  <footer class="jlz-dock" data-footer role="contentinfo">
    <div class="jlz-dock__inner">
      <!-- LEFT: brand + copyright -->
      <div class="jlz-dock__brand uk-flex uk-flex-middle">
        <a class="uk-navbar-item uk-logo jlz-brand" href="/app" aria-label="JUSTLOVEJAZZ home">l@6</a>
        <span class="uk-text-meta jlz-dock__copy">© ${new Date().getFullYear()} JUSTLOVEJAZZ</span>
      </div>
      <!-- CENTER: tools area (joystick injected here by JoystickNav) -->
      <div class="jlz-dock__tools" id="jlz-dock-tools">
        <!-- JoystickNav.el is appended here on init (see Experience.ts) -->
      </div>
      <!-- RIGHT: social icons -->
      <div class="jlz-dock__social">
        <ul class="uk-iconnav">
          <li><a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub" uk-icon="icon: github"></a></li>
          <li><a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter" uk-icon="icon: twitter"></a></li>
          <li><a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a></li>
        </ul>
      </div>
    </div>
  </footer>
`
