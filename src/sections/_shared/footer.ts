// src/sections/_shared/footer.ts — Compact dock (single row + joystick)
//
// Mobile-first, functional, navigation-focused.
// Layout (bottom of screen, all pages):
//   ┌────────────────────────────────────────────────┐
//   │ l@6   Home  Works  Services  Manifesto    ☰   │  ← single compact row
//   └────────────────────────────────────────────────┘
//             [joystick — position:fixed, centered, on top]
//
// - Brand (left) + main menu nav (center, hidden on mobile) + menu toggle (right)
// - Menu toggle opens UIMenu modal (contacts + theme toggle)
// - Contact buttons moved to modal (not in footer)
// - Joystick remains the primary cube-face navigation

export const FOOTER = `
  <footer class="jlz-dock" data-footer role="contentinfo">
    <div class="jlz-dock__bar">
      <div class="jlz-dock__brand">
        <a class="uk-logo jlz-brand" href="/app" aria-label="JUSTLOVEJAZZ home">l@6</a>
      </div>
      <nav class="jlz-dock__nav uk-visible@s" aria-label="Main navigation">
        <a href="/app" data-nav-link="home">Home</a>
        <a href="/app/services" data-nav-link="services">Services</a>
        <a href="/app/manifesto" data-nav-link="manifesto">Manifesto</a>
        <a href="/blog" data-nav-link="blog">Blog</a>
      </nav>
      <button class="jlz-dock__menu-btn" type="button" uk-toggle="target: #jlz-menu-modal" aria-label="Open menu">
        <span uk-icon="icon: menu; ratio: 1.1" aria-hidden="true"></span>
      </button>
    </div>
  </footer>
`
