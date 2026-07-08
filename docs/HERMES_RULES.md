# HERMES_RULES — Hard rules. Each has a bug provenance. Follow or break the project.

## Sync

```bash
git fetch origin && git checkout main && git pull origin main
```

## Rules

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (not 6 — uniform group limit)
4. Built-in materials for particles/ground/cards (reduce uniform groups)
5. Non-destructive opacity — cache baseOpacity in userData
6. `setAnimationLoop` — not rAF
7. `scene.background` — NOT set. **EnvSphere** (visible BackSide sphere mesh + CanvasTexture)
   is the sole background. Do NOT set `scene.background` to a Color or Texture.
   `EnvSphere.attachToScene()` is a no-op (mesh renders itself).
8. `alpha: false` for WebGPURenderer
9. Never remove SplashCube (baku) — central 3D object
10. section-bg transparent
11. Single font: Inter
12. NoiseText via `jlz:section-change` (not IntersectionObserver — sections are absolute)
13. `jlz:webgl-ready` must fire
14. Section IDs: intro/about/flexible/challenge/innovative/contact
15. Reuse `#project-overlay`
16. BakuCarousel card click is SOLE overlay opener
17. master-quantum-flares DO NOT TOUCH
18. No lessons system
19. `references/` READ-ONLY
20. No hallucinated architecture
21. Always verify: `bun run lint && bun run type-check && bun run build`
22. No `import.meta.hot` — breaks module loading through proxy
23. CSS imports use `?inline` suffix — prevents `@vite/client` injection
24. `server.hmr: false` + `block-vite-client` plugin — prevents reload loop
25. `try/catch` in `update()` — log + skip frame, don't stop loop
26. `info.render.drawCalls` (per-frame) not `info.render.calls` (cumulative)
27. No Input scroll re-add (mouse-only)
28. No `setProjectTextures`/`clearProjectTextures` re-add (deleted, BakuCarousel owns works)
29. No `needsUpdate=true` for opacity-only changes (uniforms, not shader structure)
30. No per-frame `scene.traverse()` — use cached NodeMaterial list (or `group.userData._meshCache`)
31. `dispose()` must clean ALL listeners + timers + GPU resources
32. No per-frame allocations — use pre-allocated scratch vectors
33. On-demand rendering: don't set `_needsRender=true` permanently. Event-driven only.
    Ambient breathing (1-frame refresh every ~2.5s in idle) is the ONLY exception —
    it's in Experience._updateInner, respects prefers-reduced-motion.
34. DrawTrail: works section (idx=3) ONLY. Don't re-add to about/flexible.
35. CursorLight: DELETED. Don't re-add. (Was continuous spring-follow light.)
36. **Visual tier doctrine**: `DeviceCapability.isRealWebGPU` gates premium path.
    Premium (real WebGPU): MeshPhysicalNodeMaterial + transmission=1 + 4 TSL worldDNA nodes.
    Parity (WebGL2/fallback): MeshPhysicalMaterial + opacity-glass, no TSL nodes.
    Any divergence must be documented in ARCHITECTURE.md and logged to console.
37. **Background**: `EnvSphere` is the sole background. Do NOT re-enable
    `scene.background` or import `ShaderBackground` (file exists but is dead code).
    EnvSphere is a BackSide sphere mesh (`SphereGeometry(40, 32, 16)`) with `MeshBasicMaterial`
    + procedural `CanvasTexture` (6 per-section patterns), `renderOrder=-1000`, `fog: false`,
    `frustumCulled: false`.
38. **worldDNA TSL nodes**: `attachWorldDNA()` connects 4 nodes on premium path only.
    On parity path it's a no-op. Don't add TSL nodes to parity path materials —
    WebGLNodesHandler may not compile them correctly.
39. **Fog ownership**: `World.ts` owns `scene.fog` (per-section `FogExp2`).
    `World.init()` creates it, `World.updateTransform()` updates color+density on section
    change, `World.dispose()` nulls it. `Renderer.ts` does NOT touch `scene.fog`.
40. **Particle system**: `makeInstancedParticles` (`src/Sections/_shared/makeInstancedParticles.ts`)
    uses `MeshBasicNodeMaterial` with TSL `positionNode`/`colorNode`/`opacityNode`. ONE shared
    uniform group across all particle systems. `updateInstancedParticles(dt)` advances `uTime`.
    `SectionSceneFactory.hideGeometry()` MUST keep both `THREE.Points` AND `THREE.InstancedMesh`
    visible (so particles stay for atmospheric depth even when other geometry is hidden).
41. **Post-processing parity**: WebGL2 composite shader (`RenderPipeline.ts` `COMPOSITE_FSG`)
    and WebGPU TSL graph (`WebGPUPostPipeline.ts`) MUST produce bit-identical output.
    - **Bloom bright-extract**: use `smoothstep(threshold, threshold+0.1, luminance)` — matches
      `BloomNode` exactly (NOT quadratic `c*(c-threshold)`).
    - **ACES**: `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` — epsilon (0.0001)
      prevents NaN on black pixels, lifts shadows identically on both paths.
    - **Film grain**: use portable integer hash (`fract((p3.x+p3.y)*p3.z)` with
      `p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33)`). Do NOT use `sin()`-based
      hash — sin() precision differs GLSL vs WGSL → grain mismatch.
    - **sRGB encode**: exact `sRGBTransferOETF` (`mix(pow(c, 0.41666)*1.055 - 0.055, c*12.92,
      step(c, 0.0031308))`). WebGL2: manual in GLSL. WebGPU: rely on `TSLRenderPipeline`
      `outputColorTransform=true` (default) — do NOT apply `pow(0.4545)` approximation.
42. **Subtitles**: `src/UI/Subtitles.ts` is the canonical section-hint UI. Created in
    `Experience.init()`, disposed in `Experience.destroy()`. Listens to `jlz:section-change`,
    shows hint for 4s then auto-fades. Don't re-add a parallel hint system.
43. **21st.dev MCP**: API key format `21st_sk_...` (not `an_sk_...` — rejected).
    Endpoint `https://21st.dev/api/mcp`. Free tier: 2 retrievals/day.
    Always port to TSL (HERMES §1) — no raw ShaderMaterial from 21st components.

## Removed (don't re-add)

| Module | Reason |
| --- | --- |
| PerfMonitor | YAGNI — on-demand rendering made FPS tracking redundant |
| Bootstrapper | Inlined into `main-app.ts` (3 lines) |
| WorldAtmosphere | Inlined into `World.ts` (fog logic at 2 call sites) |
| World.advance alias | Experience calls `world.updateTransform()` directly |
| Section.switchViewingState | Callers use `switchState()` directly |
| SectionSceneFactory named wrappers | Replaced by `SECTION_CREATORS` array |
| Lenis / SmoothScroll | CircularNav drives navigation (no page scroll) |
| ShaderBackground (as active bg) | Replaced by EnvSphere (file kept but unused) |

## Stop conditions

- TSL/WebGPU API unclear → ask human
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
