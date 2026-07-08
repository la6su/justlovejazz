# AGENTS.md — LLM entry point for justlovejazz. Read first.

> Studio-grade 3D portfolio. Vite 8 + TypeScript strict + Three.js + UIkit 3. Single-page, **8 sections**.

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, sections, background | Structure |
| [RULES.md](docs/RULES.md) | Hard rules | Before changing code |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Patterns to port / NOT port | Adding section visuals |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent merge log | History |

## Language

User: Russian. Code/commits/docs: English.

## Sections (8 total)

| Idx | Section | 3D content | BG pattern |
| --- | --- | --- | --- |
| 0 | Lab (secret left) | `makeParticles` (THREE.Points) | Light blue-grey HSV |
| 1 | Intro (start) | SplashCube (baku) + particles | HSV rainbow (light) |
| 2 | About | Particles + WireframeTypography | Grey gradient (dark) |
| 3 | Flexible | Particles | Dark purple gradient |
| 4 | Works | BakuCarousel + DrawTrail + particles | Blue-grey gradient (dark) |
| 5 | Innovative | Particles | Center glow (dark) |
| 6 | Contact | Particles | Off-white gradient (light) |
| 7 | Process (secret right) | `makeParticles` | Deep blue-black gradient |

World initial state: **section 1 (Intro)**, not section 0. EnvSphere starts on section 1.

## Navigation model — JoystickNav (pure DOM, NOT three-joystick)

| Surface | Role | API |
| --- | --- | --- |
| JoystickNav | DOM joystick (bottom-center). One section per drag (trigger model). | `goToSection(i)`, `goToDirection(±1)`, `isActive()`, `onSectionChange(cb)`, `onActiveChange(cb)` |
| UIMenu | UIkit modal, hamburger button | `onNavigate(cb)`, `setActive(i)` |
| BakuCarousel | Works §4 — cube morphs into ring. Card click → overlay | `onCardClick(cb)`, `isAnimating` |
| Subtitles | `.jlz-hint` bottom-center, short UI hint per section, auto-fades 4s | Listens to `jlz:section-change` |

**JoystickNav 2D navigation:**
- Vertical (up/down): cycles 6 MAIN sections (Intro→About→…→Contact)
- Horizontal (left/right): toggles to SECRET side sections (Lab ← center → Process)
- One action per drag, ball snaps back to center, no continuous scrub
- Keyboard: ArrowUp/Down/Left/Right, Home, End

## Visual tiers

Gated by `DeviceCapability.isRealWebGPU` (set in `Renderer.init()` after backend detection):

| Tier | Path | SplashCube | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | Same `MeshPhysicalMaterial` (transmission=0, iridescence=1) + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | Same `MeshPhysicalMaterial` + CubeCamera envMap | EnvSphere (BackSide sphere + CanvasTexture) |

> SplashCube is the SAME mesh on both paths now: single `BoxGeometry` + `MeshPhysicalMaterial` + `CubeCamera` reflections + `EdgesGeometry` rainbow vertex-color edges. No `MeshPhysicalNodeMaterial`, no `attachWorldDNA` call (worldDNA.ts file kept but unused).

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
14. DrawTrail: Works section (idx=4) ONLY
15. CursorLight: DELETED — don't re-add
16. `server.hmr: false` + `block-vite-client` plugin in vite.config.ts
17. Always verify: `bun run lint && bun run type-check && bun run build`
18. **Background**: `EnvSphere` is sole background — visible BackSide sphere mesh
    with procedural `CanvasTexture` (8 per-section patterns). `attachToScene()` is a
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
bun run lint         # 0 errors (59 warnings — pre-existing no-console/no-explicit-any)
bun run type-check   # 0 errors (strict)
bun run build        # must pass (~2s)
bun run test:unit    # 54 tests
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
