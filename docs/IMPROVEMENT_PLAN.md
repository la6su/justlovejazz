# IMPROVEMENT PLAN — Interface & 3D Scenes

> Based on STORYBOARD_CONNECTIONS.md audit. Each item tagged: ✅ done / ⚠️ partial / ❌ todo
> Priority: P0 (blocking) / P1 (important) / P2 (polish)

---

## Card 01 — CUBE CONNECTION (Pages)

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 1.1 | 3 pages exist (home, services, posts) | ✅ | — | router.ts + pages/index.ts |
| 1.2 | Home = unique template (BakuCarousel) | ✅ | — | World.ts isHomePage check |
| 1.3 | Services/Posts = no carousel | ✅ | — | carousel.visible = isHome |
| 1.4 | Footer fixed bottom, hidden on home | ✅ | — | body[data-page='home'] .jlz-footer |
| 1.5 | Services/Posts use shared cube (not unique 3D) | ⚠️ P1 | All pages share same sceneGroups — content pages should have minimal/empty 3D |
| 1.6 | Content page sections have unique content | ✅ | — | 6 sections each, unique eyebrows |

## Card 02 — CUBE NAVIGATION (Per Page)

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 2.1 | 6 sections per page | ✅ | — | home(6) + services(6) + posts(6) |
| 2.2 | Vertical joystick cycles 1→2→3→4 | ✅ | — | JoystickNav MAIN_SECTION_INDICES |
| 2.3 | Horizontal toggle 0↔5 | ✅ | — | Lab/Process secret sides |
| 2.4 | Content pages use page-section navigation | ✅ | — | _syncPageSection in JoystickNav |
| 2.5 | First + last section = light (inverse) | ✅ | — | _syncPageTheme theme logic |
| 2.6 | Keyboard nav (arrows, Home, End) | ✅ | — | JoystickNav keydown handler |

## Card 03 — 3D ↔ DOM SYNCHRONIZATION

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 3.1 | SplashCube.rotateToFace(idx) on section change | ✅ | — | Experience.ts line 495 |
| 3.2 | EnvSphere.changeSection(idx) for bg pattern | ✅ | — | World.ts line 345 |
| 3.3 | sceneGroups[idx].visible toggle | ✅ | — | World.ts updateTransform |
| 3.4 | cfg.theme → themeManager.setAutoTheme | ✅ | — | Experience.ts line 473 |
| 3.5 | NoiseText title animation on section change | ✅ | — | entry-app.ts jlz:section-change |
| 3.6 | Content page 3D = minimal (empty cube) | ❌ P1 | Content pages show same 3D scenes as home — should be minimal |
| 3.7 | Cube face rotation visible on content pages | ⚠️ P2 | rotateToFace fires but content page sections aren't cube faces |

## Card 04 — THEME SYSTEM

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 4.1 | Per-section theme in WorldConfig | ✅ | — | 7 sectionTheme values (incl. default) |
| 4.2 | ThemeManager normal/inverse modes | ✅ | — | 2 modes, toggle() |
| 4.3 | uk-light body class toggle | ✅ | — | ThemeManager.apply() |
| 4.4 | localStorage persistence | ✅ | — | jlz:theme key |
| 4.5 | Inverse flips EnvSphere on home | ✅ | — | jlz:theme-applied listener |
| 4.6 | Modal menu theme toggle (1 button) | ✅ | — | Change mode + label |
| 4.7 | Content page theme sync (first/last = light) | ✅ | — | JoystickNav._syncPageSection |
| 4.8 | No dead light-theme/dark-theme classes | ✅ | — | Removed in audit |
| 4.9 | EnvSphere sync only on home (page guard) | ✅ | — | data-page === 'home' check |

## Card 05 — UIKIT BUILDER ELEMENTS

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 5.1 | uk-card (Lab, Posts, Categories, Stack) | ✅ | — | uk-card-default uk-card-hover |
| 5.2 | uk-grid (responsive child-widths) | ✅ | — | 1-2@s, 1-3, 1-4@m |
| 5.3 | uk-list uk-list-divider (Process, Services) | ✅ | — | Timeline + service list |
| 5.4 | uk-button (CTA, small/large) | ✅ | — | primary/default |
| 5.5 | uk-heading (medium/xlarge) | ✅ | — | studio-title + heading |
| 5.6 | uk-text-meta (eyebrows, descriptions) | ✅ | — | .jlz-eyebrow TUI styling |
| 5.7 | uk-icon (social, drag, sound) | ✅ | — | mail, github, twitter, arrows |
| 5.8 | uk-label (post categories) | ✅ | — | Posts page |
| 5.9 | uk-position (3D overlay, project overlay) | ✅ | — | uk-position-cover, uk-position-z-index |
| 5.10 | uk-section (responsive small/medium@s/large@m) | ✅ | — | All sections |
| 5.11 | uk-scrollspy (fade reveal) | ✅ | — | REVEAL + PAGE_REVEAL constants |
| 5.12 | uk-flex (column, between, center) | ✅ | — | Layout structure |
| 5.13 | TUI .jlz-eyebrow (> LABEL) on all sections | ✅ | — | All 18 sections |
| 5.14 | Scanline overlay (.jlz-scanline) | ✅ | — | repeating-linear-gradient |
| 5.15 | Content sections need more variety | ⚠️ P2 | Some services/posts sections are sparse |

## Card 06 — DATA & STATE FLOW

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| 6.1 | Input → JoystickNav → activeFace | ✅ | — | Pointer + keyboard |
| 6.2 | Experience._updateInner → world.updateTransform | ✅ | — | Per-frame sync |
| 6.3 | jlz:section-change event | ✅ | — | ContentReveal + NoiseText |
| 6.4 | jlz:webgl-ready event | ✅ | — | Splash → title animation |
| 6.5 | jlz:theme-applied event | ✅ | — | EnvSphere sync (home only) |
| 6.6 | jlz:route-change event | ✅ | — | UIMenu page active state |
| 6.7 | jlz:page-section-change event | ✅ | — | Content page navigation |
| 6.8 | jlz:sound-toggle event | ✅ | — | AudioSystem mute |
| 6.9 | On-demand rendering (needsRender flag) | ✅ | — | Idle = 0 draw calls |

---

## PRIORITY TASKS (todo)

### P1 — Must fix

| # | Task | Impact | Effort |
|---|------|--------|--------|
| A | Content pages 3D = minimal/empty cube | High | Medium — getWorldConfigForPage returns different configs per page |
| B | Content page sections = unique 3D rooms | High | Large — need unique scene groups per page (or shared minimal) |

### P2 — Polish

| # | Task | Impact | Effort |
|---|------|--------|--------|
| C | Services Face 2 (Stack) — add more content | Low | Small |
| D | Posts Face 5 (Archive) — add post count or list | Low | Small |
| E | Cube face rotation on content pages — verify visible | Low | Small |
| F | Lint warnings cleanup (59 warnings in tsl.ts) | Low | Small |

---

## EXECUTION ORDER

```
Phase 1: P1-A — Content page 3D minimal
  ├── getWorldConfigForPage returns 'home' configs or 'content' configs
  ├── Content configs: minimal particles, no BakuCarousel, shared cube
  └── Verify: /services and /posts show glass cube + minimal particles

Phase 2: P1-B — Unique 3D rooms per page
  ├── Home: full scenes (Lab/Intro/About/Works/Contact/Process) — KEEP
  ├── Services: minimal scenes (particles only, different colors per section)
  ├── Posts: minimal scenes (particles only, different colors per section)
  └── Verify: each page has visually distinct 3D atmosphere

Phase 3: P2 polish
  ├── Content improvements (services stack, posts archive)
  ├── Cube rotation verification on content pages
  └── Lint cleanup
```
