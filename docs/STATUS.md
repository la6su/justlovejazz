# STATUS — Single Source of Truth

> Updated: 2026-07-12 (docs-reconciliation). Branch: `main`. Build green.
>
> UIkit 3 theming patterns + lessons: see [`UIKIT3.md`](UIKIT3.md).
> Audit report for 2026-07-11: see [`AUDIT_2026-07-11.md`](AUDIT_2026-07-11.md).

## Project

SPA studio portfolio — **6 sections** (1:1 with cube faces), 3D canvas + transparent
DOM overlay. Single font: Inter.
Navigation: JoystickNav (pure DOM, 2D — bottom-center) + UIMenu (UIkit modal) + Subtitles (section hints).
Theme: UIKit native `uk-light` class via `ThemeManager` (3 modes: auto/light/dark) —
3D EnvSphere syncs to forced light/dark override.
Mobile-first: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px, all sizing rem-based.

> **3 content pages** (home / services / posts), each with 6 sections. Home is the
> 3D cube experience; services/posts reuse the same 3D scene with minimal content
> differentiation (planned improvement — see IMPROVEMENT_PLAN.md).

## Current state

| Item | Status |
| --- | --- |
| 3D scene (WebGPU + WebGL2 fallback) | ✅ |
| 6 sections (Lab/Intro/About/Works/Contact/Process) — 1:1 cube faces | ✅ |
| JoystickNav — pure DOM joystick, trigger model (one section per drag) | ✅ |
| 2D navigation (vertical=main, horizontal=Lab/Process) | ✅ |
| UIMenu — UIkit modal jump navigation + theme toggle (auto/light/dark, 3 buttons) | ✅ |
| Subtitles — short UI hint per section, auto-fade 4s | ✅ |
| BakuCarousel — cube morphs into ring (Works §3) | ✅ |
| ProjectOverlay — card click (raycast) opens fullscreen | ✅ |
| On-demand rendering (`_needsRender` flag) | ✅ |
| Ambient breathing (1-frame refresh every 2.5s in idle) | ✅ |
| Event-driven animations (static when idle) | ✅ |
| NoiseText titles via `jlz:section-change` | ✅ |
| Splash curtain + SplashCube opener | ✅ |
| DevPanel (Tweakpane) | ✅ |
| Per-section lighting + fog (World.ts owns `scene.fog`) | ✅ |
| EnvSphere — procedural CanvasTexture on BackSide sphere, 6 patterns | ✅ |
| `makeParticles` (`THREE.Points`, shared by all 6 sections) | ✅ |
| SplashCube — single BoxGeometry + CubeCamera + rainbow vertex-color edges | ✅ |
| WebGPU/WebGL2 color parity (sRGB + ACES + grain + bloom) | ✅ |
| ThemeManager — UIKit native `uk-light` + auto/light/dark toggle (localStorage, prefers-color-scheme on first visit) | ✅ |
| 3D ↔ theme sync (forced light/dark drives EnvSphere pattern) | ✅ |
| Mobile-first rem sizing (`.85rem` mob → `1rem@s`) | ✅ |
| Responsive sections (`uk-section-small uk-section-medium@s uk-section-large@m`) | ✅ |
| 3 content pages: services / posts (each with 6 sections, Apple Watch layout) | ✅ |
| Unified footer (brand + social, fixed bottom, hidden on home) | ✅ |
| Cinematic typography + glassmorphism UI | ✅ |
| TypeScript strict + ESLint + Prettier | ✅ |
| Prerendered home sections (SEO) | ✅ |
| a11y (skip-link, focus-trap, noscript) | ✅ |
| 25 unit tests (Easings 10, EventBus 5, Noise 8, motionPolicy 2) | ✅ |

## Sections (6) — 1:1 with cube faces

| Idx | Section | Cube face | 3D content | BG pattern | Theme |
| --- | --- | --- | --- | --- | --- |
| 0 | Lab (secret left) | Top (+Y) | `makeParticles` (THREE.Points) | Light blue-grey HSV | light |
| 1 | Intro (start) | Front (+Z) | SplashCube (baku) + particles | HSV rainbow (light) | light |
| 2 | About | Right (+X) | Particles + WireframeTypography | Grey gradient | dark |
| 3 | Works | Back (-Z) | BakuCarousel + DrawTrail + particles | Blue-grey gradient | dark |
| 4 | Contact | Bottom (-Y) | Particles | Off-white gradient | light |
| 5 | Process (secret right) | Left (-X) | `makeParticles` | Deep blue-black gradient | dark |

Sections: `position:absolute; inset:0` (stacked). `.section-active` toggles visibility.
World initial state: **section 1 (Intro)**. EnvSphere starts on section 1.
Light sections (0=Lab, 1=Intro, 4=Contact) toggle `uk-light` body class via ThemeManager →
dark text/nav. Dark sections (2=About, 3=Works, 5=Process) use default theme (light text).

> **Cube face rotation per section** — each section index maps to a cube face.
> `World.updateTransform()` rotates the SplashCube so the active face points at
> the camera. BakuCarousel on Works (idx 3) morphs the back face into a ring.

## Content pages (3) — outside the SPA home

| Route | Page | Title | Sections |
| --- | --- | --- | --- |
| `/services` | services | "What We Build" | intro / list / stack / process / contact / values |
| `/posts` | posts | "Writing" | intro / latest / featured / categories / contact / archive |

Content pages always render light text over the 3D canvas (first section is light/inverse).
Footer (brand + social) is fixed to viewport bottom, hidden on home where Contact
serves as the home footer.

> **Planned:** content pages currently reuse the home 3D scene (SplashCube + EnvSphere).
> `getWorldConfigForPage(page)` should return minimal configs for content pages — see
> [`IMPROVEMENT_PLAN.md`](IMROVEMENT_PLAN.md) Card 03 task 3.6.

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()` after `wg.init()` + adapter inspection):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |

`isRealWebGPU` logged to console on startup:
```
[Renderer.init] Final path: WebGPU (WebGPUBackend) | isRealWebGPU=true
[Renderer.init] Premium WebGPU path active
```

> SplashCube is identical on both paths now (single BoxGeometry + MeshPhysicalMaterial + CubeCamera). The `worldDNA.ts` file + `attachWorldDNA()` exist but are NOT called by SplashCube (kept for future use). `isRealWebGPU` is still used by `RenderPipeline` for backend-specific post-processing path selection.

## On-demand rendering + ambient breathing

`renderer.update()` only called when `_needsRender=true`. Triggers:
1. JoystickNav section change (`isActive()` true for 400ms after trigger)
2. BakuCarousel morphing/scrolling (`isAnimating` getter)
3. Splash/intro animation
4. Camera shake
5. ParticleBurst active
6. **Ambient breathing** — 1 render frame every ~2.5s when fully idle
   (advances worldDNA `uTime` on premium path, EnvSphere/particle drift on parity).
   Respects `prefers-reduced-motion`.

When idle (between breaths): zero draw calls, GPU sleeps. Cursor (DOM) always updates.

## Background system — EnvSphere

| Property | Value |
| --- | --- |
| File | `src/Experience/World/EnvSphere.ts` |
| Geometry | `SphereGeometry(40, 32, 16)` |
| Material | `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`) |
| Texture | `CanvasTexture` 2048×1024 (sRGB colorSpace, default UV mapping) |
| `frustumCulled` | `false` |
| `renderOrder` | `-1000` (renders first) |
| `attachToScene()` | no-op (mesh is visible — `scene.background` is NOT set) |
| Initial weights | `[0, 1, 0, 0, 0, 0]` — starts on section 1 (Intro) |

6 per-section patterns (mixed by animated `uSection` weights, lerped over ~0.3s):

| Idx | Section | Pattern |
| --- | --- | --- |
| 0 | Lab | Light blue-grey HSV (`hue: 0.6, sat: 0.06, val: 0.88`) |
| 1 | Intro | HSV rainbow gradient (low sat, animated hue shift) |
| 2 | About | Grey vertical gradient (`0x1a1a1a → 0x2e2e2e`) |
| 3 | Works | Dark blue-grey gradient (`0x1a1a22 → 0x2a2a3a`) |
| 4 | Contact | Light off-white gradient (`0xe8e8e8 → 0xd8d8d8`) for dark text |
| 5 | Process | Deep blue-black gradient (`0x080810 → 0x12121e`) |

Light sections (0=Lab, 1=Intro, 4=Contact) drive `uk-light` body class via ThemeManager →
dark text/nav. Forced light/dark mode (from the menu toggle) overrides EnvSphere to
match (light forced → Intro pattern, dark forced → About pattern).

## Theme system — ThemeManager + UIKit `uk-light`

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `'auto'` (default), `'light'`, `'dark'` |
| First-visit | If no saved mode, check `prefers-color-scheme: light` → start `'light'`; else `'auto'` |
| Persistence | `localStorage('jlz:theme')` |
| Body class | `uk-light` toggled on `<body>` + `<html>` (UIKit native inverse) |
| Auto source | `Experience.ts` calls `themeManager.setAutoTheme(isLightSection)` on home section change |
| Content pages | `router.ts` calls `themeManager.setAutoTheme(true)` (first section is light) |
| 3D sync | Dispatches `jlz:theme-applied` with `{isLight, mode}` — Experience listens; in forced light/dark mode, overrides EnvSphere pattern (light→Intro, dark→About) |
| Toggle UI | **3 buttons** (Auto/Light/Dark) in `#jlz-menu-modal .jlz-theme-toggle` (`uk-button-group`) |
| `_import.less` | `@inverse-global-color-mode: light` — generates `uk-light` class |

`auto` mode follows per-section theme from `setAutoTheme()` (Lab/Intro/Contact = light,
About/Works/Process = dark). `light`/`dark` modes force the theme globally —
`setAutoTheme()` becomes a no-op (manual override wins).

UIKit native inverse (`uk-light`) replaces the former 50+ LOC of custom
`body.light-theme .uk-*` overrides. Custom non-UIKit elements (joystick, hint,
corner-label, brand) still keyed on `body.uk-light` (the native UIKit class).

## Particle system

`src/Sections/_shared/makeParticles.ts` — shared `THREE.Points` factory used by all 6 section creators.

- `THREE.Points` + built-in `PointsMaterial` (NOT NodeMaterial — reduces WebGL2 uniform groups)
- `baseOpacity` cached in `material.userData` for non-destructive fade
- `frustumCulled = false`
- Static when idle (event-driven — no drift)

`SectionSceneFactory.hideGeometry()` keeps both `THREE.Points` AND `THREE.InstancedMesh` visible
(particles stay for atmospheric depth even when other geometry is hidden).

## SplashCube (baku) — current implementation

| Property | Value |
| --- | --- |
| Geometry | Single `BoxGeometry(1.6, 1.6, 1.6)` |
| Material | `MeshPhysicalMaterial` — `transmission: 0`, `iridescence: 1.0`, `clearcoat: 1.0`, `roughness: 0.05`, `metalness: 0.0`, `envMapIntensity: 2.0` |
| Reflections | `CubeCamera` renders a content scene (6 gradient planes + Apple logo/text textures) into a `WebGLCubeRenderTarget(256)`, used as `material.envMap` |
| Edges | `EdgesGeometry` from BoxGeometry with animated rainbow HSL vertex colors (12 edges, not 6×4=24 from separate planes) |
| Opener | Scale pulse (single mesh, NOT face separation) |
| Update | `cubeCamera.update(renderer, contentScene)` each frame, cube hidden during CubeCamera render to avoid self-reflection |

No premium/parity split — same `MeshPhysicalMaterial` on both paths. `worldDNA.ts` + `attachWorldDNA()` exist but are not called by SplashCube.

## Removed (don't re-add)

| Module | Why |
| --- | --- |
| SmoothScroll/Lenis | JoystickNav drives navigation (no page scroll) |
| CursorLight | Continuous animation, removed for on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by JoystickNav |
| PerfMonitor | YAGNI — on-demand rendering made it redundant |
| Bootstrapper | Inlined into `main-app.ts` (3 lines) |
| WorldAtmosphere | Inlined into `World.ts` (fog logic at 2 call sites) |
| World.advance alias | `Experience.ts` calls `world.updateTransform()` directly |
| Section.switchViewingState | Callers use `switchState()` directly |
| SectionSceneFactory named wrappers | Replaced by `SECTION_CREATORS[6]` array |
| Section3Flexible (active) | Removed in 8→6 unification — dir + creator deleted in `a9bab24` |
| Section5Innovative (active) | Removed in 8→6 unification — dir + creator deleted in `a9bab24` |
| CircularNav (active) | Replaced by JoystickNav (pure DOM, 2D, trigger model) — file + test deleted in `a9bab24` |
| three-joystick (library import) | JoystickNav is pure DOM — no external joystick lib (dep still in package.json, planned removal) |
| ShaderBackground (as active bg) | Replaced by EnvSphere — file deleted in `a9bab24` |
| Atlas Aurora CanvasTexture | Replaced by EnvSphere procedural CanvasTexture |
| Particle drift | Particles are static (event-driven) |
| `src/styles/tokens.less` | Merged into `src/assets/_import.less` §1 (single source of truth) |
| Custom `body.light-theme .uk-*` overrides | Replaced by UIKit native `uk-light` (50+ LOC removed) |
| Per-section px padding on `.jlz-page-section` | Replaced by responsive `uk-section-small/medium@s/large@m` |
| import.meta.hot | Breaks module loading through proxy |
| Input.ts scroll system | Mouse-only now |

## Dead code candidates (kept on disk, NOT imported)

All previously-listed dead code was deleted in commit `a9bab24`:
- ✅ `src/Sections/Section3Flexible/` — removed
- ✅ `src/Sections/Section5Innovative/` — removed
- ✅ `src/Experience/World/ShaderBackground.ts` — removed
- ✅ `src/UI/CircularNav.ts` — removed
- ✅ `src/__tests__/CircularNav.test.ts` — removed

Remaining on disk but not imported:

| File | LOC | Status |
| --- | --- | --- |
| `projects/*.html` (4 standalone pages) | 446 | Standalone HTML, not part of SPA — decision: keep or remove |
| `three-joystick` (package.json dep) | — | Not imported by any source file — planned `bun remove` |

See [`AUDIT_2026-07-11.md`](AUDIT_2026-07-11.md) for the original cleanup decision tree.

## Proxy/dev config

| Setting | Value | Why |
| --- | --- | --- |
| `server.hmr` | `false` | WebSocket unstable through proxy |
| `server.allowedHosts` | `['project.6la.ru']` | Caddy/haproxy reverse proxy |
| `block-vite-client` plugin | Strips `@vite/client` from HTML + stubs HTTP | Prevents reload loop |
| `main.less` import | `?inline` | Prevents `@vite/client` injection in CSS |

## Performance

- Shared material for cube (single BoxGeometry, 1 draw call)
- Built-in materials for particles, ground, cards, edges
- `makeParticles` (THREE.Points): 1 draw call per section's particle cloud
- `try/catch` in `update()` — logs error, skips frame, doesn't stop loop
- `prefers-reduced-motion` freezes decorative anims (including ambient breathing)
- Post-processing parity: bloom/vignette/grain/refraction/chromatic-aberration/color-grade
  on BOTH WebGPU (TSL graph) and WebGL2 (ShaderMaterial composite).

## 21st.dev integration

[@21st-dev/cli](https://21st.dev) MCP for component discovery:
- API key format: `21st_sk_...` (NOT `an_sk_...`)
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- Free tier: 2 component-code retrievals/day
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
