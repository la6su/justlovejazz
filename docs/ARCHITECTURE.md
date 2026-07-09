# ARCHITECTURE

Vite 8 · TypeScript strict · Three.js 0.184 + TSL · UIkit 3 + Less · bun.

> **UIkit 3 theming layer**: see [`UIKIT3.md`](UIKIT3.md) — theme assembly,
> section template, custom-vs-UIKit rules, and the hard-won lessons we
> learned (blend-difference across stacking contexts, scrollspy+splash timing,
> per-section theme overrides vs global `body.light-theme`, etc.).

## Entry

```
index.html → entry-shell.ts → entry-app.ts → main-app.ts → Experience.ts
Render: renderer.setAnimationLoop (pauses on hidden tab)
CSS: import('./assets/main.less?inline') — prevents @vite/client injection
```

`main-app.ts` inlines the former Bootstrapper (3 lines: new Experience + await init + onReady cb).

## Layout

```
canvas (z-index:1, fixed, pointer-events:none) — 3D scene
#spa-content (z-index:2) — DOM sections (absolute-stacked, 100dvh each)
  .section-active { opacity:1; pointer-events:auto } — only visible section
.tm-header (z-index:1000) — top nav (uk-navbar + uk-slider)
#joystick-nav (z-index:9999, fixed bottom-center) — JoystickNav DOM joystick
#jlz-menu-toggle (z-index:10002) — hamburger button
#jlz-menu-modal (z-index:10000) — UIkit modal (jump nav + theme toggle)
.jlz-hint (fixed bottom-center) — Subtitles section hint
#project-overlay (z-index:3500) — fullscreen project detail
.jlz-footer (z-index:50, fixed bottom) — brand + social (hidden on home)
.custom-cursor (z-index:100000) — above all overlays
```

## Sections (6) — 1:1 with cube faces

| Idx | Section | Cube face | 3D content | BG pattern | Theme |
| --- | --- | --- | --- | --- | --- |
| 0 | Lab (secret left) | Top (+Y) | `makeParticles` | Light blue-grey HSV | light |
| 1 | Intro (start) | Front (+Z) | SplashCube + particles | HSV rainbow (light) | light |
| 2 | About | Right (+X) | Particles + WireframeTypography | Grey gradient | dark |
| 3 | Works | Back (-Z) | BakuCarousel + DrawTrail + particles | Blue-grey gradient | dark |
| 4 | Contact | Bottom (-Y) | Particles | Off-white gradient | light |
| 5 | Process (secret right) | Left (-X) | `makeParticles` | Deep blue-black gradient | dark |

World starts on section 1 (Intro). EnvSphere starts on section 1.
Light sections (0, 1, 4) toggle `uk-light` body class via ThemeManager → dark text/nav.

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()`):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |

SplashCube is identical on both paths. `isRealWebGPU` still drives `RenderPipeline` backend selection for post-processing.

## Navigation

**JoystickNav** — pure DOM joystick (bottom-center). Trigger model: one section per drag.
- Vertical drag (up/down): cycle 4 MAIN sections (Intro→About→Works→Contact)
- Horizontal drag (left/right): toggle to SECRET side sections (Lab ← center → Process)
- `TRIGGER_DISTANCE = 35px` — drag past threshold fires ONE section change, ball snaps back
- `DEAD_ZONE = 6px` — small movements ignored
- Keyboard: ArrowUp/Down/Left/Right, Home (→ Intro), End (→ Contact)
- `isActive()` true for ~400ms after trigger (feeds `_needsRender`)
- `goToSection(i)` — public, used by UIMenu + DevPanel
- Constructor: `new JoystickNav(scene, camera, 6 /* sectionCount */, { sectionLabels })`
- NO three-joystick import — pure DOM (pointerdown/move/up + keyboard)

**UIMenu** — UIkit modal (`uk-modal`). Hamburger `uk-toggle` opens. 7 page links + 4 section slider + theme toggle.

**BakuCarousel** — Works §3. Cube morphs into ring. Card click (raycast) → overlay.
- `isAnimating` getter — true when morphing/scrolling (feeds `_needsRender`).
- Scroll/drag blocked while JoystickNav active.

**Subtitles** — `.jlz-hint` bottom-center. Created in `Experience.init()`. Listens to
`jlz:section-change` → shows short hint (e.g. "Drag · Click to open"), auto-fades 4s.
`dispose()` clears timer + removes listener.

## On-demand rendering + ambient breathing

`Experience._needsRender` flag gates `renderer.update()`. Set true when:
1. `JoystickNav.isActive()` — 400ms after section trigger
2. `BakuCarousel.isAnimating` — morph/scroll/drag
3. Intro/splash animation running
4. Camera shake active
5. ParticleBurst active
6. **Ambient breathing** — 1 render frame every ~2.5s when fully idle
   (advances worldDNA `uTime` on premium, EnvSphere/particle drift on parity). Respects
   `prefers-reduced-motion`.

When idle (between breaths): `World.update(dt, false)` skips baku/particles/carousel. Zero draw calls.
Cursor (DOM) always updates — not gated by `_needsRender`.

## Background system — EnvSphere

| Property | Value |
| --- | --- |
| File | `src/Experience/World/EnvSphere.ts` |
| Geometry | `SphereGeometry(40, 32, 16)` |
| Material | `MeshBasicMaterial` (BackSide, `fog: false`, `depthTest: false`, `depthWrite: false`) |
| Texture | `CanvasTexture` 2048×1024, `SRGBColorSpace`, default UV mapping |
| `frustumCulled` | `false` |
| `renderOrder` | `-1000` (renders first) |
| `attachToScene()` | no-op (mesh is visible — `scene.background` NOT set) |
| Initial weights | `[0, 1, 0, 0, 0, 0]` — starts on section 1 (Intro) |

6 per-section patterns (mixed by animated `uSection` weights, lerped over ~0.3s):
- sec0 (Lab) — light blue-grey HSV (`hue: 0.6, sat: 0.06, val: 0.88`)
- sec1 (Intro) — HSV rainbow gradient (animated, low saturation, high value)
- sec2 (About) — grey gradient (`0x1a1a1a → 0x2e2e2e`)
- sec3 (Works) — dark blue-grey gradient (`0x1a1a22 → 0x2a2a3a`)
- sec4 (Contact) — light off-white gradient (`0xe8e8e8 → 0xd8d8d8`)
- sec5 (Process) — deep blue-black gradient (`0x080810 → 0x12121e`)

`changeSection(idx)` → `_targetWeights[idx]=1, others=0` → lerped in `update()`.
Canvas redrawn when dirty, or every ~200ms for animated patterns (HSV).
`prefers-reduced-motion` → frozen.

> `ShaderBackground.ts` file still exists but is **dead code** (not imported anywhere).
> EnvSphere is the sole background.
>
> In manual light/dark mode (not auto), Experience listens to `jlz:theme-applied`
> and overrides EnvSphere pattern to match — light forced → Intro pattern, dark
> forced → About pattern — so the 3D bg stays readable when text color flips.

## SplashCube (baku) — current implementation

| Property | Value |
| --- | --- |
| Geometry | Single `BoxGeometry(1.6, 1.6, 1.6)` |
| Material | `MeshPhysicalMaterial` (`transmission: 0`, `iridescence: 1.0`, `clearcoat: 1.0`, `roughness: 0.05`, `envMapIntensity: 2.0`) |
| Reflections | `CubeCamera` renders content scene (6 gradient planes + Apple logo/text textures) into `WebGLCubeRenderTarget(256)`, used as `material.envMap` |
| Edges | `EdgesGeometry` from BoxGeometry, animated rainbow HSL vertex colors (12 edges) |
| Opener | Scale pulse (single mesh — NOT face separation) |
| Update | `cubeCamera.update(renderer, contentScene)` each frame; cube hidden during CubeCamera render |

No premium/parity material split. `worldDNA.ts` + `attachWorldDNA()` exist but are NOT called by SplashCube.

## Render pipeline (WebGPU/WebGL2 parity)

| Backend | Render | Post |
| --- | --- | --- |
| WebGPU | `TSLRenderPipeline` + `PassNode` + `BloomNode` (via `WebGPUPostPipeline`) | ACES + vignette + grain + refraction + chromatic + grade + border + sRGB encode |
| WebGL2 | scene → RT(bright-extract) → gaussian blur(×2 ping-pong) → composite ShaderMaterial → screen | same chain, manual sRGB encode in GLSL |

**Parity guarantees** (bit-identical output across backends):

| Effect | Implementation | Why |
| --- | --- | --- |
| Bloom bright-extract | `smoothstep(threshold, threshold+0.1, luminance)` matches `BloomNode` exactly | Old `c*(c-threshold)` quadratic diverged from BloomNode |
| ACES tone map | `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` | Epsilon (0.0001) prevents NaN on black pixels |
| Film grain | Portable integer hash: `p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); fract((p3.x+p3.y)*p3.z)` | `sin()` precision differs GLSL vs WGSL — integer hash is bit-identical |
| sRGB encode | Exact `sRGBTransferOETF`: `mix(pow(c, 0.41666)*1.055 - 0.055, c*12.92, step(c, 0.0031308))` | Manual in WebGL2 GLSL; `TSLRenderPipeline` applies via `outputColorTransform=true` on WebGPU |

Color grading: `mix(color*uGradeShadows, color+(uGradeHighlights-1)*max(color-0.5,0), smoothstep(0,1,lum))` at 40% mix.

## Fog ownership

`World.ts` owns `scene.fog` (per-section `FogExp2`):
- `World.init()` creates `scene.fog = new FogExp2(cfg.fog.color, cfg.fog.density)` from section 1
- `World.updateTransform()` updates `fog.color` + `fog.density` on section index change (reuses instance)
- `World.dispose()` sets `scene.fog = null`
- `Renderer.ts` does NOT touch `scene.fog`

## Modules

| Module | Role |
| --- | --- |
| Experience | Render loop, section transitions, on-demand gating, ambient breathing |
| World | Sections + sceneGroups + baku + lights + BG + EnvSphere + DrawTrail(works only) + fog |
| SplashCube | Baku cube. Single BoxGeometry + MeshPhysicalMaterial + CubeCamera reflections + rainbow edges. |
| EnvSphere | BackSide sphere + CanvasTexture. 6 per-section patterns mixed by animated weights. Sole background. |
| BakuCarousel | Cube↔ring morph. Raycast card click. `isAnimating` getter. |
| JoystickNav | Pure DOM joystick (2D). `goToDirection`/`goToSection`/`isActive`/`onSectionChange`. |
| UIMenu | UIkit modal. `onNavigate`/`setActive`. |
| Subtitles | Bottom-center section hints. Listens to `jlz:section-change`. Auto-fade 4s. |
| ProjectOverlay | Fullscreen DOM dialog. Card click opens. |
| WorksPortfolio | Project metadata only (prev/next/goTo). No textures. |
| DevPanel | Tweakpane: Stats/Navigation/BakuCarousel/Render folders. |
| Section | No-op `update()`. State machine only (`switchState`). |
| SectionSceneFactory | `SECTION_CREATORS[6]` array + `hideGeometry()` (keeps Points + InstancedMesh visible). |
| makeParticles | Shared `THREE.Points` factory. Built-in `PointsMaterial`. 1 draw call per cloud. Used by all 6 section creators. |
| ThemeManager | UIKit `uk-light` body class. auto/light/dark modes. localStorage `jlz:theme`. Manual override wins over auto. |
| Input | Mouse-only (scroll system removed). |
| NoiseText | Glitch reveal via `jlz:section-change`. `data-rot` for rotation. |
| WireframeTypography | Section2 About decorative typography. |
| Router | Path-based routing `/`, `/services`, `/cases`, `/process`, `/team`, `/journal`, `/contact`. Renders 6 content pages. |
| Footer | Fixed bottom bar (brand + 3 social icons). Hidden on home where Contact section serves as the home footer. |

## Events

| Event | Emitted by | Consumed by |
| --- | --- | --- |
| `jlz:webgl-ready` | main-app (curtain mid-open) | entry-app (NoiseText + scrollspy) |
| `jlz:section-change` | Experience (section index change) | entry-app (NoiseText titles), ContentReveal, Subtitles |
| `jlz:route-change` | router (page navigation) | UIMenu (page link active state), JoystickNav (page-mode) |
| `jlz:theme-change` | ThemeManager (`setMode`) | UIMenu (highlight active toggle button) |
| `jlz:theme-applied` | ThemeManager (`apply`) | Experience (sync EnvSphere pattern to manual override) |

## Theme system — ThemeManager + UIKit `uk-light`

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` (singleton exported as `themeManager`) |
| Modes | `'auto'` (default, follows active home section), `'light'` (forced), `'dark'` (forced) |
| Persistence | `localStorage('jlz:theme')` — survives reloads |
| Body class | `uk-light` toggled on `<body>` + `<html>` (UIKit native inverse — 1 class flips ALL UIKit components) |
| Legacy synonym | `body.light-theme` kept as synonym for custom non-UIKit elements (joystick, hint, brand, corner-label) |
| Auto source | `Experience.ts` calls `themeManager.setAutoTheme(isLightSection)` on home section change. `isLightSection = idx === 0 || idx === 1 || idx === 4` |
| Content pages | `router.ts` calls `themeManager.setAutoTheme(false)` — always dark in auto mode |
| 3D sync | Dispatches `jlz:theme-applied {isLight, mode}` — Experience listens; in manual light/dark mode, overrides EnvSphere pattern (light→Intro, dark→About) so 3D bg stays in sync with text color |
| Toggle UI | 3 buttons (Auto/Light/Dark) in `#jlz-menu-modal .jlz-theme-toggle` (`uk-button-group`) |
| Less config | `_import.less`: `@inverse-global-color-mode: light` — generates `uk-light` class |

> See [`UIKIT3.md`](UIKIT3.md) §4 for the full theme toggle design + the home-only
> scope fix (§4.1) that prevents content pages from rendering dark-on-dark.

## Mobile-first sizing

| Property | Value |
| --- | --- |
| Root font-size | `html { font-size: 0.85rem }` (mobile), `@media (min-width:640px) { 1rem }` (tablet+) |
| All UIKit sizing | Rem-based (flows from `html` font-size) — headings, spacing, gutters, control heights, box-shadows |
| Section padding | `uk-section-small uk-section-medium@s uk-section-large@m` (responsive UIKit section primitive) |
| Custom paddings | `.jlz-footer`, `.jlz-page-section`, `.jlz-case-tile` all use rem units (px values removed in 76-value conversion) |
| Hairline borders | Kept as px (1-3px) for crispness — `@base-code-padding-vertical`, `@navbar-nav-item-line-hover-height`, etc. |

> See [`UIKIT3.md`](UIKIT3.md) §10 for the full mobile-first rem sizing rationale
> and the master-quantum-flares px→rem conversion record.

## 21st.dev integration

[@21st-dev/cli](https://21st.dev) MCP for component discovery:
- MCP endpoint: `https://21st.dev/api/mcp` (POST, `x-api-key` header)
- API key format: `21st_sk_...` (NOT `an_sk_...` — rejected by server)
- Free tier: 2 component-code retrievals/day
- Used to fetch: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732)
