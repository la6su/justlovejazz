# STORYBOARD CONNECTIONS — Visual Relationship Map

> 6 numbered cards showing how pages, cube faces, 3D scenes, themes, and UI elements connect.
> Card-based layout, dark/cyan aesthetic, TUI-like. Each card = one relationship type.

---

## 01 CUBE CONNECTION — Pages

```
┌─────────────────────────────────────────────────────────────────────┐
│  01  CUBE CONNECTION                                                │
│      3 pages in the cube universe                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐                   │
│   │  🟦     │─────▶│  ⬜     │─────▶│  ⬛     │                   │
│   │ / HOME  │      │/SERVICES│      │ / POSTS │                   │
│   └─────────┘      └─────────┘      └─────────┘                   │
│                                                                     │
│   HOME          →   SERVICES     →   POSTS                         │
│   6 cube faces      6 sections       6 sections                    │
│   BakuCarousel      No carousel       No carousel                   │
│   Unique 3D         Shared cube       Shared cube                   │
│                                                                     │
│   NAVIGATION FLOW:                                                  │
│   [/] ──┐                                                      │   │
│         ├──▶ [/services] ──┐                                    │   │
│   [/] ──┘                  ├──▶ [/posts]                         │   │
│         [/] ───────────────┘                                      │   │
│                                                                     │
│   • Home = unique template (BakuCarousel on Works face)             │
│   • Services/Posts = shared cube, unique content sections          │
│   • Footer = fixed bottom bar, hidden on home                      │
│   • Router: path-based (/ → home, /services, /posts)               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 02 CUBE NAVIGATION (PER PAGE)

```
┌─────────────────────────────────────────────────────────────────────┐
│  02  CUBE NAVIGATION (PER PAGE)                                     │
│      6 faces = 6 sections, joystick-driven                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              ┌──────────┐                                           │
│              │ FACE 0   │ ← secret left (horizontal ←)             │
│              │ Lab      │                                           │
│              │ light    │                                           │
│  ┌──────────┐├──────────┐┌──────────┐                             │
│  │ FACE 5   ││ FACE 1   ││ FACE 2   │                             │
│  │ Process  ││ Intro    ││ About    │ ← vertical joystick (↓)    │
│  │ dark     ││ light ★  ││ dark     │   cycles 1→2→3→4           │
│  │ secret → ││ START    ││          │                             │
│  └──────────┘├──────────┐└──────────┘                             │
│              │ FACE 3   │                                           │
│              │ Works    │ ← BakuCarousel (home only)               │
│              │ dark     │                                           │
│              ├──────────┤                                           │
│              │ FACE 4   │                                           │
│              │ Contact  │ ← light (inverse by default)             │
│              │ light    │                                           │
│              └──────────┘                                           │
│                                                                     │
│  VERTICAL JOYSTICK          HORIZONTAL TOGGLE                       │
│  ┌─────────────────┐       ┌─────────────────┐                     │
│  │  1 Intro (light)│       │  0 Lab ←──→ 5  │                     │
│  │  2 About (dark) │       │  Process       │                     │
│  │  3 Works (dark) │       │  (secret sides)│                     │
│  │  4 Contact(lite)│       └─────────────────┘                     │
│  └─────────────────┘                                               │
│                                                                     │
│  ★ = start section    light/dark = per-section theme               │
│  Input: pointer drag, keyboard arrows, Home/End keys               │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 03 3D ↔ DOM SYNCHRONIZATION

```
┌─────────────────────────────────────────────────────────────────────┐
│  03  3D ↔ DOM SYNCHRONIZATION                                       │
│      Cube rotation drives section theme + EnvSphere                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── 3D SCENE ───────────┐       ┌─── DOM SECTION ───────────┐   │
│  │                         │       │                            │   │
│  │  SplashCube             │◀─────▶│  section[data-section]     │   │
│  │  ┌─────┐                │       │  ┌─────────────────────┐  │   │
│  │  │cube │ rotateToFace() │       │  │ > EYEBROW           │  │   │
│  │  └─────┘                │       │  │ Title               │  │   │
│  │                         │       │  │ ─────────────────── │  │   │
│  │  EnvSphere              │       │  │   [ 3D transparent ]│  │   │
│  │  ┌─────┐ changeSection()│       │  │ ─────────────────── │  │   │
│  │  │ bg  │                │       │  │ UI panel (cards/grid)│  │   │
│  │  └─────┘                │       │  └─────────────────────┘  │   │
│  │                         │       │                            │   │
│  │  Three.js + TSL         │       │  UIkit 3 + Builder         │   │
│  │  WebGPU/WebGL2          │       │  TypeScript                 │   │
│  └─────────────────────────┘       └────────────────────────────┘   │
│                                                                     │
│  SYNC FLOW:                                                         │
│                                                                     │
│  JoystickNav.update()                                               │
│    │                                                                │
│    ▼                                                                │
│  Experience._updateInner()                                          │
│    │                                                                │
│    ├──▶ world.updateTransform(scrollValue)                          │
│    │     ├──▶ envSphere.changeSection(idx)    ← 3D bg pattern       │
│    │     ├──▶ sceneGroups[idx].visible = true  ← 3D particles       │
│    │     └──▶ baku.rotateToFace(idx)          ← cube rotation       │
│    │                                                                │
│    ├──▶ cfg = getConfig(sectionId)                                  │
│    │     └──▶ cfg.theme ('light'|'dark')                           │
│    │                                                                │
│    ├──▶ themeManager.setAutoTheme(cfg.theme === 'light')            │
│    │     └──▶ body.uk-light toggle          ← DOM text color        │
│    │                                                                │
│    └──▶ eventBus.emit('jlz:section-change')  ← NoiseText title      │
│                                                                     │
│  state.activeFace = idx → theme: 'light'|'dark' → uk-light toggle   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 04 THEME SYSTEM

```
┌─────────────────────────────────────────────────────────────────────┐
│  04  THEME SYSTEM                                                   │
│      Per-section light/dark + inverse toggle                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SECTION THEME MAP                    INVERSE TOGGLE                │
│  ┌─────────────────────────────┐      ┌──────────────────────┐     │
│  │ Face  Section    Theme     │      │   NORMAL  ↔  INVERSE │     │
│  │ ────  ────────    ─────    │      │                      │     │
│  │  0    Lab        light  ◀──┼──┐   │  light → dark        │     │
│  │  1    Intro      light  ◀──┼──┤   │  dark  → light       │     │
│  │  2    About      dark   ◀──┼──┤   │                      │     │
│  │  3    Works      dark   ◀──┼──┤   │  [ Change mode ]     │     │
│  │  4    Contact    light  ◀──┼──┤   │  Normal | Inverse    │     │
│  │  5    Process    dark   ◀──┼──┘   └──────────────────────┘     │
│  └─────────────────────────────┘                                   │
│                                                                     │
│  THEME TOKENS (CSS)                                                │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ● uk-light on <body>     = light bg → dark text           │      │
│  │ ● no uk-light            = dark bg → light text           │      │
│  │ ● ThemeManager._mode     = 'normal' | 'inverse'           │      │
│  │ ● ThemeManager.isLight   = mode=normal ? section : !sec   │      │
│  │ ● localStorage('jlz:theme') = persists toggle             │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  FLOW:                                                              │
│  cfg.theme = 'light'                                                │
│    │                                                                │
│    ▼ normal mode                                                    │
│  themeManager.setAutoTheme(true)                                    │
│    → body.uk-light = true (dark text on light bg)                   │
│    │                                                                │
│    ▼ inverse mode (toggle)                                          │
│  themeManager.isLight = !true = false                               │
│    → body.uk-light = false (light text on dark bg)                  │
│    → envSphere.changeSection(dark pattern)                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 05 UIKIT BUILDER ELEMENTS PER SECTION

```
┌─────────────────────────────────────────────────────────────────────┐
│  05  UIKIT BUILDER ELEMENTS PER SECTION                             │
│      Which UIKit components live in each face                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┬──────────┬──────────────────────┬──────────────────────┐ │
│  │ FACE │ SECTION  │ UI ELEMENTS          │ COMPONENTS USED      │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  0   │ Lab      │ ▦ ▦ ▦ ▦ (4 cards)   │ uk-card uk-grid      │ │
│  │      │          │                      │ uk-card-hover        │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  1   │ Intro    │ [btn][btn][btn] CTA  │ uk-button uk-icon    │ │
│  │      │          │ ↓ scroll hint        │ uk-heading-xlarge    │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  2   │ About    │ ▦ ▦ ▦ (3 stats)      │ uk-grid uk-heading   │ │
│  │      │          │ text lead            │ uk-text-lead uk-text  │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  3   │ Works    │ ⊕ carousel ring      │ uk-position-z-index  │ │
│  │      │          │ ← drag → hint         │ ProjectOverlay       │ │
│  │      │          │                      │ BakuCarousel (home)  │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  4   │ Contact  │ [btn][btn][btn]      │ uk-button-large      │ │
│  │      │          │ @ email link         │ uk-icon uk-link      │ │
│  ├──────┼──────────┼──────────────────────┼──────────────────────┤ │
│  │  5   │ Process  │ ☰ list timeline      │ uk-list-divider      │ │
│  │      │          │ 01 02 03 04          │ uk-flex uk-text-bold │ │
│  └──────┴──────────┴──────────────────────┴──────────────────────┘ │
│                                                                     │
│  SHARED ACROSS ALL SECTIONS:                                        │
│  • uk-section-small uk-section-medium@s uk-section-large@m         │
│  • uk-container uk-container-expand                                 │
│  • uk-flex uk-flex-column uk-flex-between uk-text-center           │
│  • uk-height-viewport="expand: true"                                │
│  • uk-scrollspy="cls: uk-animation-fade"                            │
│  • .jlz-eyebrow (> LABEL, TUI monospace)                           │
│  • .jlz-scanline (subtle CRT overlay)                              │
│                                                                     │
│  CONTENT PAGES (services/posts) ALSO USE:                           │
│  • uk-label (post categories)                                       │
│  • uk-card-body (post cards, stack cards, category cards)          │
│  • uk-list (services list, process steps)                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 06 DATA & STATE FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│  06  DATA & STATE FLOW                                              │
│      How input drives 3D + DOM + theme                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐     ┌──────────────────┐     ┌──────────────┐      │
│  │  INPUT    │────▶│  NAVIGATION      │────▶│  3D SCENE    │      │
│  │           │     │  CONTROLLER      │     │              │      │
│  │ joystick  │     │  (JoystickNav)   │     │  SplashCube  │      │
│  │ keyboard  │     │                  │     │  rotateToFace│      │
│  │ click     │     │  activeFace: idx │     │              │      │
│  │ router    │     │  side: center/   │     │  EnvSphere   │      │
│  │           │     │    lab/process   │     │  changeSection│     │
│  └───────────┘     └────────┬─────────┘     └──────────────┘      │
│                             │                                       │
│                    ┌────────▼─────────┐     ┌──────────────┐      │
│                    │  EXPERIENCE      │────▶│  DOM SECTION │      │
│                    │  (_updateInner)  │     │              │      │
│                    │                  │     │  section-     │      │
│                    │  cfg.theme       │     │  active toggle│      │
│                    │  ↓               │     │              │      │
│                    │  ThemeManager    │     │  NoiseText   │      │
│                    │  .setAutoTheme() │     │  title anim  │      │
│                    │  ↓               │     │              │      │
│                    │  body.uk-light   │     │  UIkit       │      │
│                    │  toggle          │     │  scrollspy   │      │
│                    └────────┬─────────┘     └──────────────┘      │
│                             │                                       │
│                    ┌────────▼─────────┐                           │
│                    │  EVENT BUS       │                           │
│                    │                  │                           │
│                    │  jlz:section-    │──▶ ContentReveal          │
│                    │    change        │    (.section-active)       │
│                    │                  │                           │
│                    │  jlz:webgl-ready │──▶ entry-app              │
│                    │                  │    (NoiseText start)       │
│                    │                  │                           │
│                    │  jlz:theme-      │──▶ Experience             │
│                    │    applied       │    (EnvSphere sync)        │
│                    │                  │                           │
│                    │  jlz:route-      │──▶ UIMenu                 │
│                    │    change        │    (page active state)     │
│                    │                  │                           │
│                    │  jlz:page-       │──▶ JoystickNav            │
│                    │    section-change│    (content page nav)      │
│                    └──────────────────┘                           │
│                                                                     │
│  LEGEND:                                                            │
│  ───▶ Direct flow (function call)                                  │
│  ─ ─▶ Event (eventBus.emit / window.dispatchEvent)                 │
│  ◀─▶ Bidirectional sync                                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  JUSTLOVEJAZZ · Three.js · WebGPU · UIkit 3 · TypeScript           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CONNECTION SUMMARY

```
                    ┌──────────────────┐
                    │   USER INPUT     │
                    │ (joystick/click) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  JoystickNav     │
                    │  (section idx)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼──────┐ ┌────▼──────────┐
     │  3D SCENE     │ │ EXPERIENCE│ │  EVENT BUS    │
     │               │ │           │ │               │
     │ SplashCube    │ │ cfg.theme │ │ jlz:section-  │
     │ rotateToFace  │ │     │     │ │   change      │
     │               │ │     ▼     │ │               │
     │ EnvSphere     │ │ ThemeMgr  │ │ jlz:theme-    │
     │ changeSection │ │ .apply()  │ │   applied     │
     │               │ │     │     │ │               │
     │ sceneGroups   │ │     ▼     │ │ jlz:webgl-    │
     │ [idx].visible │ │ uk-light  │ │   ready       │
     └───────────────┘ └───────────┘ └───────┬───────┘
                                            │
                                   ┌────────▼─────────┐
                                   │  DOM SECTIONS    │
                                   │                  │
                                   │ section-active   │
                                   │ .uk-light toggle │
                                   │ NoiseText title  │
                                   │ UIkit scrollspy  │
                                   └──────────────────┘
```
