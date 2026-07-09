// src/pages/shared/constants.ts — Shared constants for page templates
//
// REVEAL: scrollspy attribute for home sections (per-element, repeatable)
// PAGE_REVEAL: scrollspy attribute for content pages (target children)

export const REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 300; repeat: true"'

export const PAGE_REVEAL = 'uk-scrollspy="cls: uk-animation-fade; delay: 120; target: > *"'

// ── Cube face → section mapping ──
// 6 sections = 6 cube faces. Each section maps to a cube face direction.
// SplashCube.FACE_ROTATIONS in src/Experience/World/SplashCube.ts must match.
//
//   Index | Section  | Cube face    | Face direction | Theme
//   ------|----------|--------------|----------------|-------
//   0     | Lab      | Top (+Y)     | up             | light (secret left)
//   1     | Intro    | Front (+Z)   | toward camera  | light (start)
//   2     | About    | Right (+X)   | right          | dark
//   3     | Works    | Back (-Z)    | away           | dark (carousel)
//   4     | Contact  | Bottom (-Y)  | down           | light
//   5     | Process  | Left (-X)    | left           | dark (secret right)
//
// Navigation: JoystickNav vertical cycles 1→2→3→4 (main sections),
// horizontal toggles 0 (Lab) ↔ center ↔ 5 (Process) (secret side sections).

export type SectionId = 'lab' | 'intro' | 'about' | 'challenge' | 'contact' | 'process'

export type PageId = 'home' | 'services' | 'cases' | 'process' | 'team' | 'journal' | 'contact'
