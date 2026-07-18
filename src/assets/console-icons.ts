// console-icons.ts — Console-themed UIKit icon overrides.
//
// All icons are original SVGs drawn for the JLZ console theme.
// Style: bold strokes (2px), currentColor, rounded caps — matching the
// console reticle cursor and theme toggle for visual unity.
// No duplication: each icon is unique, no two icons share the same SVG.

import UIkit from 'uikit'

interface Icons {
  [name: string]: string
}

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

const CONSOLE_ICONS: Icons = {
  // ── Navigation ──
  'arrow-up':
    `<svg width="20" height="20" viewBox="0 0 20 20"><line ${STROKE} x1="10" y1="16" x2="10" y2="5"/><polyline ${STROKE} points="14 9 10 5 6 9"/></svg>`,

  'arrow-left':
    `<svg width="20" height="20" viewBox="0 0 20 20"><line ${STROKE} x1="16" y1="10" x2="5" y2="10"/><polyline ${STROKE} points="9 6 5 10 9 14"/></svg>`,

  'arrow-right':
    `<svg width="20" height="20" viewBox="0 0 20 20"><line ${STROKE} x1="4" y1="10" x2="15" y2="10"/><polyline ${STROKE} points="11 6 15 10 11 14"/></svg>`,

  'arrow-up-right':
    `<svg width="20" height="20" viewBox="0 0 20 20"><line ${STROKE} x1="5" y1="15" x2="15" y2="5"/><polyline ${STROKE} points="8 5 15 5 15 12"/></svg>`,

  // ── Media controls ──
  'play':
    `<svg width="20" height="20" viewBox="0 0 20 20"><polygon fill="currentColor" stroke="none" points="7 4 15 10 7 16"/></svg>`,

  'pause':
    `<svg width="20" height="20" viewBox="0 0 20 20"><rect fill="currentColor" stroke="none" x="5" y="4" width="3.5" height="12" rx="1"/><rect fill="currentColor" stroke="none" x="11.5" y="4" width="3.5" height="12" rx="1"/></svg>`,

  // ── Close / X ──
  'close':
    `<svg width="20" height="20" viewBox="0 0 20 20"><path ${STROKE} d="M15 15 L5 5"/><path ${STROKE} d="M15 5 L5 15"/></svg>`,

  // ── Slidenav (fullscreen prev/next — different from slider arrows) ──
  // These are chevrons-only (no line), wider, for fullscreen navigation
  'slidenav-previous':
    `<svg width="14" height="24" viewBox="0 0 14 24"><polyline ${STROKE} points="12 2 2 12 12 22"/></svg>`,

  'slidenav-next':
    `<svg width="14" height="24" viewBox="0 0 14 24"><polyline ${STROKE} points="2 2 12 12 2 22"/></svg>`,

  'slidenav-previous-large':
    `<svg width="25" height="40" viewBox="0 0 25 40"><polyline ${STROKE} points="20 2 3 20 20 38"/></svg>`,

  'slidenav-next-large':
    `<svg width="25" height="40" viewBox="0 0 25 40"><polyline ${STROKE} points="5 2 22 20 5 38"/></svg>`,

  // ── Communication ──
  'mail':
    `<svg width="20" height="20" viewBox="0 0 20 20"><rect ${STROKE} x="2" y="4" width="16" height="12" rx="1"/><polyline ${STROKE} points="2 5 10 11 18 5"/></svg>`,

  'commenting':
    `<svg width="20" height="20" viewBox="0 0 20 20"><path ${STROKE} d="M2 2 L18 2 L18 13 L11 13 L7 17 L7 13 L2 13 Z"/><circle fill="currentColor" stroke="none" cx="6.5" cy="7.5" r="1"/><circle fill="currentColor" stroke="none" cx="10" cy="7.5" r="1"/><circle fill="currentColor" stroke="none" cx="13.5" cy="7.5" r="1"/></svg>`,

  // ── Actions ──
  'push':
    `<svg width="20" height="20" viewBox="0 0 20 20"><line ${STROKE} x1="10" y1="12" x2="10" y2="2"/><polyline ${STROKE} points="6 6 10 2 14 6"/><path ${STROKE} d="M4 8 L4 18 L16 18 L16 8"/></svg>`,

  // ── Audio ──
  'muted':
    `<svg width="20" height="20" viewBox="0 0 20 20"><path ${STROKE} d="M2 7 L2 13 L6 13 L11 17 L11 3 L6 7 Z"/><line ${STROKE} x1="14" y1="8" x2="18" y2="12"/><line ${STROKE} x1="18" y1="8" x2="14" y2="12"/></svg>`,

  'sound':
    `<svg width="20" height="20" viewBox="0 0 20 20"><path ${STROKE} d="M2 7 L2 13 L6 13 L11 17 L11 3 L6 7 Z"/><path ${STROKE} d="M14 7 Q16 10 14 13"/><path ${STROKE} d="M16.5 5 Q19.5 10 16.5 15"/></svg>`,
}

/** Register all console-themed icons with UIKit. Call after UIkit.use(Icons). */
export function registerConsoleIcons(): void {
  const iconComponent = (UIkit as unknown as { icon?: { add?: (icons: Icons) => void } }).icon
  if (iconComponent?.add) {
    iconComponent.add(CONSOLE_ICONS)
  }
}
