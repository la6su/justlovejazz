// console-icons.ts — Console-themed UIKit icon overrides.
//
// Registers custom SVG icons via UIkit.icon.add() to replace UIKit defaults
// with thin-line, currentColor versions matching the console theme aesthetic.
// All icons use stroke="currentColor" (no hardcoded #000) so they adapt to
// light/dark theme automatically.
//
// Stroke width 1.2 matches the cursor reticle and SVG theme toggle icons
// for visual unity across the interface.

import UIkit from 'uikit'

interface IconSvg {
  [name: string]: string
}

const CONSOLE_ICONS: IconSvg = {
  // Arrow up — thin line + chevron, currentColor
  'arrow-up':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="10" y1="16" x2="10" y2="5" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="14 9 10 5 6 9" />' +
    '</svg>',

  // Arrow left
  'arrow-left':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="16" y1="10" x2="5" y2="10" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="9 6 5 10 9 14" />' +
    '</svg>',

  // Arrow right
  'arrow-right':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="4" y1="10" x2="15" y2="10" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="11 6 15 10 11 14" />' +
    '</svg>',

  // Arrow up-right (diagonal)
  'arrow-up-right':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="5" y1="15" x2="15" y2="5" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="9 5 15 5 15 11" />' +
    '</svg>',

  // Play — thin triangle outline
  'play':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<polygon fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" points="7 5 14 10 7 15" />' +
    '</svg>',

  // Pause — two thin bars
  'pause':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="7" y1="5" x2="7" y2="15" />' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="13" y1="5" x2="13" y2="15" />' +
    '</svg>',

  // Close — thin X, rounded caps
  'close':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M16,16 L4,4" />' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M16,4 L4,16" />' +
    '</svg>',

  // Mail — thin envelope outline
  'mail':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<rect fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" x="1.5" y="4" width="17" height="12" rx="0.5" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="2 5 10 11 18 5" />' +
    '</svg>',

  // Commenting — thin speech bubble with dots
  'commenting':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="M2 2 L18 2 L18 13 L11 13 L7 17 L7 13 L2 13 Z" />' +
    '<circle fill="currentColor" cx="6.5" cy="7.5" r="0.8" />' +
    '<circle fill="currentColor" cx="10" cy="7.5" r="0.8" />' +
    '<circle fill="currentColor" cx="13.5" cy="7.5" r="0.8" />' +
    '</svg>',

  // Push — thin upload arrow + tray
  'push':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="10" y1="11" x2="10" y2="2" />' +
    '<polyline fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" points="7 5 10 2 13 5" />' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" d="M5 7 L4 7 L4 18 L16 18 L16 7 L15 7" />' +
    '</svg>',

  // Muted — speaker with X (console mute)
  'muted':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M2 7 L2 13 L6 13 L11 17 L11 3 L6 7 Z" />' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="14" y1="8" x2="18" y2="12" />' +
    '<line fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" x1="18" y1="8" x2="14" y2="12" />' +
    '</svg>',

  // Sound — speaker with waves (console unmute)
  'sound':
    '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M2 7 L2 13 L6 13 L11 17 L11 3 L6 7 Z" />' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M14 7 Q16 10 14 13" />' +
    '<path fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M16.5 5 Q20 10 16.5 15" />' +
    '</svg>',
}

/** Register all console-themed icons with UIKit. Call after UIkit.use(Icons). */
export function registerConsoleIcons(): void {
  const iconComponent = (UIkit as unknown as { icon?: { add?: (icons: IconSvg) => void } }).icon
  if (iconComponent?.add) {
    iconComponent.add(CONSOLE_ICONS)
  }
}
