# AGENTS.md — LLM entry point for justlovejazz. Read first.

> Studio-grade 3D portfolio. Vite 8 + TypeScript + Three.js + UIkit 3. Single-page, 6 sections.

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, visual tiers, background system | Understanding structure |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | Hard rules | Before changing code |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Junni patterns to port / NOT port | Adding section visuals |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent merge log | Understanding history |

## Language

User responses: Russian. Code/commits/docs: English.

## Visual tiers (IMPORTANT)

The project has TWO visual paths, gated by `DeviceCapability.isRealWebGPU`:

| Tier | Path | Baku | Background |
| --- | --- | --- | --- |
| **Premium** | Real WebGPU (WebGPUBackend, non-fallback adapter) | `MeshPhysicalNodeMaterial` + `transmission=1` + 4 TSL worldDNA nodes | EnvSphere (BackSide sphere + CanvasTexture) |
| **Parity** | WebGL2 / WebGLBackend fallback / SwiftShader | `MeshPhysicalMaterial` + opacity-glass (no TSL nodes) | EnvSphere (BackSide sphere + CanvasTexture) |

`isRealWebGPU` is set in `Renderer.init()` after backend detection. Logged to console on startup.

## Navigation model

| Surface | Role | API |
| --- | --- | --- |
| CircularNav | Bottom-right vinyl circle. Drag DOWN=next, UP=prev | `goToSection(i)`, `goToDirection(±1)`, `isActive()`, `onActiveChange(cb)` |
| UIMenu | UIkit modal, hamburger button | `onNavigate(cb)`, `setActive(i)` |
| BakuCarousel | Works §4 — cube morphs into ring. Card click→overlay | `onCardClick(cb)`, `isAnimating` getter |
| Subtitles | Bottom-center section hint, auto-fades after 4s | Created in `Experience.init()`; listens to `jlz:section-change` |

## Key rules (see HERMES_RULES.md for full list)

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (not 6)
4. Built-in materials for particles/ground/cards (reduce uniform groups)
5. `setAnimationLoop` — not rAF
6. Never remove SplashCube (baku)
7. Single font: Inter
8. NoiseText via `jlz:section-change` event (not IntersectionObserver)
9. `import.meta.hot` — DON'T USE (breaks module loading through proxy)
10. CSS imports use `?inline` suffix (prevents @vite/client injection)
11. On-demand rendering: only render when `_needsRender=true`. Don't set it permanently.
12. Event-driven animations: baku/particles/lights are STATIC when idle. Animate only during transitions.
13. Ambient breathing: 1-frame refresh every ~2.5s in idle is OK (respects reduced-motion).
14. DrawTrail: works section (idx=3) ONLY
15. CursorLight: DELETED — don't re-add
16. `server.hmr: false` + `block-vite-client` plugin in vite.config.ts
17. Always verify: `bun run lint && bun run type-check && bun run build`
18. **Visual tier doctrine**: premium path (real WebGPU) can diverge from parity (WebGL2).
    Document any divergence in `ARCHITECTURE.md` and log to console.
19. **Background**: `EnvSphere` is the sole background — a visible BackSide sphere mesh
    with a procedural CanvasTexture (6 per-section patterns). `attachToScene()` is a
    no-op kept for lifecycle compat. Do NOT set `scene.background` — EnvSphere renders itself.
20. **Post-processing parity**: WebGL2 composite shader and WebGPU TSL graph must match
    bit-for-bit. Use portable integer hash (NOT sin()) for grain, ACES epsilon (0.0001)
    for black-pixel safety, exact sRGBTransferOETF for encode, BloomNode-matching smoothstep
    for bright-extract. See HERMES_RULES §41.
21. **Fog ownership**: `World.ts` owns `scene.fog` (per-section FogExp2). `Renderer.ts` does
    NOT override fog. Don't add fog logic outside World.
22. **21st.dev MCP**: API key format `21st_sk_...` (not `an_sk_...`). Endpoint
    `https://21st.dev/api/mcp`. Free tier: 2 retrievals/day.

## Verification

```bash
bun run lint         # 0 errors (59 warnings — all pre-existing no-console/no-explicit-any)
bun run type-check   # 0 errors (strict)
bun run build        # must pass (~2s)
bun run test:unit    # 54 tests
```

## 21st.dev MCP usage

```bash
# Search components (metadata free)
curl -s -X POST https://21st.dev/api/mcp \
  -H "x-api-key: 21st_sk_..." \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search","arguments":{"query":"aurora background","limit":5}}}'

# Get component code (uses daily quota)
curl -s -X POST https://21st.dev/api/mcp \
  -H "x-api-key: 21st_sk_..." \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_component","arguments":{"id":5732}}}'
```

Already fetched: Atlas Aurora (id: 16166), Background Paper Shaders (id: 5732).
