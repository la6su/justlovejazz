// uiChrome.ts — Centralized UI-chrome event guard.
//
// Multiple input handlers (BakuCarousel, WorksPortfolio) need to ignore
// pointer/wheel/keyboard events that originate from navigation UI chrome
// (SwipeNav, UIMenu modal, ProjectOverlay). This module provides one
// canonical selector list + a single helper, so the guard can't drift out
// of sync across files (a previous bug had #jlz-menu-overlay in some files
// but the actual element id is #jlz-menu-modal — guards silently failed).
//
// Use in event handlers:
//   if (isUiChromeEvent(e)) return

/** Selector matching all navigation/UI-chrome elements that should swallow
 *  pointer/wheel/keyboard events before they reach 3D input handlers. */
const UI_CHROME_SELECTOR =
  '#swipe-nav, #jlz-menu-toggle, #jlz-menu-modal, #project-overlay, #project-modal, .jlz-works-ui, #jlj-splash'

/** Returns true if the event's target is inside (or is) a UI-chrome element. */
export function isUiChromeEvent(e: Event): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false
  return target.closest(UI_CHROME_SELECTOR) !== null
}

/** Returns true if the UIMenu modal is currently open. */
export function isMenuOpen(): boolean {
  const menu = document.getElementById('jlz-menu-modal')
  return !!menu && menu.classList.contains('uk-open')
}
