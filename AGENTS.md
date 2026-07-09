# AGENTS.md — LLM entry point for justlovejazz. Read first.

> Studio-grade 3D portfolio. Vite 8 + TypeScript strict + Three.js + UIkit 3. Single-page, **6 sections** (1:1 with cube faces).

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, sections, background | Structure |
| [RULES.md](docs/RULES.md) | Hard rules | Before changing code |
| [UIKIT3.md](docs/UIKIT3.md) | UIKit theming patterns + lessons | UI/theme changes |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port | Adding section visuals |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent merge log | History |

## Language

User: Russian. Code/commits/docs: English.

## Sections (6 total — 1:1 with cube faces)

| Idx | Section | Cube face | 3D content | BG pattern | Theme |
| --- | --- | --- | --- | --- | --- |
| 0 | Lab (secret left) | Top (+Y) | `makeParticles` (THREE.Points) | Light blue-grey HSV | light |
| 1 | Intro (start) | Front (+Z) | SplashCube (baku) + particles | HSV rainbow (light) | light |
| 2 | About | Right (+X) | Particles + WireframeTypography | Grey gradient | dark |
| 3 | Works | Back (-Z) | BakuCarousel + DrawTrail + particles | Blue-grey gradient | dark |
| 4 | Contact | Bottom (-Y) | Particles | Off-white gradient | light |
| 5 | Process (secret right) | Left (-X) | `makeParticles` | Deep blue-black gradient | dark |

World initial state: **section 1 (Intro)**, not section 0. EnvSphere starts on section 1.

> **History:** Originally 8 sections (Lab/Intro/About/Flexible/Works/Innovative/Contact/Process).
> Unified to 6 in 2026-07-11 — Flexible and Innovative removed. Section3Flexible/Section5Innovative
> directories + ShaderBackground.ts + CircularNav.ts were deleted in commit `a9bab24`.

## Content pages (3 total — outside the SPA home)

| Route | Page | Title |
| --- | --- | --- |
| `/` | home | 3D cube experience (6 sections) |
| `/services` | services | "What We Build" — services list + stack + process + contact + values |
| `/posts` | posts | "Writing" — latest + featured + categories + contact + archive |

## Navigation model — JoystickNav (pure DOM, NOT three-joystick)

| Surface | Role | API |
| --- | --- | --- |
| JoystickNav | DOM joystick (bottom-center). One section per drag (trigger model). | `goToSection(i)`, `goToDirection(±1)`, `isActive()`, `onSectionChange(cb)`, `onActiveChange(cb)` |
| UIMenu | UIkit modal, hamburger button. 4 section slider items + 3 page links + 1 theme toggle button | `onNavigate(cb)`, `setActive(i)` |
| BakuCarousel | Works §3 — cube morphs into ring. Card click → overlay | `onCardClick(cb)`, `isAnimating` |
| Subtitles | `.jlz-hint` bottom-center, short UI hint per section, auto-fades 4s | Listens to `jlz:section-change` |

**JoystickNav 2D navigation:**
- Vertical (up/down): cycles 4 MAIN sections (Intro→About→Works→Contact)
- Horizontal (left/right): toggles to SECRET side sections (Lab ← center → Process)
- One action per drag, ball snaps back to center, no continuous scrub
- Keyboard: ArrowUp/Down/Left/Right, Home (→ Intro), End (→ Contact)

## Theme system — ThemeManager (2 modes: normal/inverse)

| Property | Value |
| --- | --- |
| File | `src/core/ThemeManager.ts` |
| Modes | `'normal'` (default), `'inverse'` |
| Persistence | `localStorage('jlz:theme')` |
| Body class | `uk-light` toggled on `<body>` + `<html>` (UIKit native inverse) |
| Auto source | `Experience.ts` calls `themeManager.setAutoTheme(isLightSection)` on home section change |
| Content pages | `router.ts` calls `themeManager.setAutoTheme(true)` (first section is light) |
| 3D sync | Dispatches `jlz:theme-applied` with `{isLight, mode}` — Experience listens, overrides EnvSphere |
| Toggle UI | **1 button** "Change mode" in `#jlz-menu-modal .jlz-theme-toggle` |
| `_import.less` | `@inverse-global-color-mode: light` — generates `uk-light` class |

> `normal` mode = per-section theme as configured (light sections show `uk-light`).
> `inverse` mode = flips all sections (light↔dark). Manual override wins over auto.

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()` after backend detection):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | Same `MeshPhysicalMaterial` (transmission=0, iridescence=1) + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |

> SplashCube is the SAME mesh on both paths: single `BoxGeometry` + `MeshPhysicalMaterial` + `CubeCamera` reflections + `EdgesGeometry` rainbow vertex-color edges. No `MeshPhysicalNodeMaterial`, no `attachWorldDNA` call (worldDNA.ts file kept but unused).

## Key rules (see RULES.md for full list)

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (not 6/8)
4. Built-in materials for particles/ground/cards (reduce uniform groups)
5. `setAnimationLoop` — not rAF
6. Never remove SplashCube (baku)
7. Single font: Inter
8. NoiseText via `jlz:section-change` event (not IntersectionObserver)
9. `import.meta.hot` — DON'T USE (breaks module loading through proxy)
10. CSS imports use `?inline` suffix (prevents @vite/client injection)
11. On-demand rendering: only render when `_needsRender=true`. Don't set it permanently.
12. Event-driven animations: baku/particles/lights STATIC when idle.
13. Ambient breathing: 1-frame refresh every ~2.5s in idle (respects reduced-motion).
14. DrawTrail: Works section (idx=3) ONLY
15. CursorLight: DELETED — don't re-add
16. `server.hmr: false` + `block-vite-client` plugin in vite.config.ts
17. Always verify: `bun run lint && bun run type-check && bun run build && bun run test:unit`
18. **Background**: `EnvSphere` is sole background — visible BackSide sphere mesh
    with procedural `CanvasTexture` (6 per-section patterns). `attachToScene()` is a
    no-op. Do NOT set `scene.background`.
19. **Post-processing parity**: WebGL2 composite shader and WebGPU TSL graph must
    match bit-for-bit. Portable integer hash (NOT sin()), ACES epsilon (0.0001),
    exact `sRGBTransferOETF`, BloomNode-matching smoothstep. See RULES.md §41.
20. **Fog ownership**: `World.ts` owns `scene.fog` (per-section FogExp2).
    `Renderer.ts` does NOT override fog.
21. **Navigation**: JoystickNav is canonical (pure DOM, NO three-joystick library).
    CircularNav is removed — do not re-add.
22. **21st.dev MCP**: API key `21st_sk_...` (not `an_sk_...`). Endpoint
    `https://21st.dev/api/mcp`. Free tier: 2 retrievals/day.

## Verification

```bash
bun run lint         # 0 errors (warnings tracked, not blocking)
bun run type-check   # 0 errors (strict)
bun run build        # must pass (~3s)
bun run test:unit    # 25 tests (Easings 10, EventBus 5, Noise 8, motionPolicy 2)
```

## 21st.dev MCP usage

```bash
curl -s -X POST https://21st.dev/api/mcp \
  -H "x-api-key: 21st_sk_..." \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search","arguments":{"query":"aurora background","limit":5}}}'
```

Already fetched: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732).
