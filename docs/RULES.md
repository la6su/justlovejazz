# RULES — Hard rules. Each has a bug provenance. Follow or break the project.

## Sync

```bash
git fetch origin && git checkout main && git pull origin main
```

## Rules

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (not 8 — uniform group limit)
4. Built-in materials for particles/ground/cards (reduce uniform groups)
5. Non-destructive opacity — cache baseOpacity in userData
6. `setAnimationLoop` — not rAF
7. `scene.background` — NOT set. **EnvSphere** (visible BackSide sphere mesh + CanvasTexture)
   is the sole background. `EnvSphere.attachToScene()` is a no-op (mesh renders itself).
8. `alpha: false` for WebGPURenderer
9. Never remove SplashCube (baku) — central 3D object
10. section-bg transparent
11. Single font: Inter
12. NoiseText via `jlz:section-change` (not IntersectionObserver — sections are absolute)
13. `jlz:webgl-ready` must fire
14. Section IDs (6 total): lab, intro, about, challenge (works), contact, process. 1:1 with cube faces (Lab=Top, Intro=Front, About=Right, Works=Back, Contact=Bottom, Process=Left).
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
    Ambient breathing (1-frame refresh every ~2.5s in idle) is the ONLY exception.
34. DrawTrail: Works section (idx=3) ONLY. Don't re-add to about/lab/contact.
35. CursorLight: DELETED. Don't re-add. (Was continuous spring-follow light.)
36. **Visual tiers**: `DeviceCapability.isRealWebGPU` gates backend selection. SplashCube is
    the SAME `MeshPhysicalMaterial` on both paths (single BoxGeometry + CubeCamera + rainbow
    edges). `isRealWebGPU` still drives `RenderPipeline` post-processing backend selection.
    Any divergence must be documented in ARCHITECTURE.md and logged to console.
37. **Background**: `EnvSphere` is the sole background. Do NOT re-enable `scene.background`
    or import `ShaderBackground` (file exists but is dead code). EnvSphere is a BackSide
    sphere mesh (`SphereGeometry(40, 32, 16)`) with `MeshBasicMaterial` + procedural
    `CanvasTexture` (6 per-section patterns), `renderOrder=-1000`, `fog: false`,
    `frustumCulled: false`. Starts on section 1 (Intro) — weights `[0,1,0,0,0,0]`.
38. **SplashCube**: single `BoxGeometry` + `MeshPhysicalMaterial` (transmission=0,
    iridescence=1, clearcoat=1) + `CubeCamera` envMap + `EdgesGeometry` with animated
    rainbow HSL vertex colors. NO `MeshPhysicalNodeMaterial`, NO `attachWorldDNA` call
    (worldDNA.ts exists but is unused by SplashCube). Don't re-add 6-plane cube or
    NodeMaterial-based cube.
39. **Fog ownership**: `World.ts` owns `scene.fog` (per-section `FogExp2`).
    `World.init()` creates it, `World.updateTransform()` updates color+density on section
    change, `World.dispose()` nulls it. `Renderer.ts` does NOT touch `scene.fog`.
40. **Particle system**: `makeParticles` (`src/Sections/_shared/makeParticles.ts`) is the
    canonical factory — `THREE.Points` + built-in `PointsMaterial` (NOT NodeMaterial, NOT
    `makeInstancedParticles`). Used by all 6 section creators. `baseOpacity` cached in
    `material.userData`. `SectionSceneFactory.hideGeometry()` MUST keep both `THREE.Points`
    AND `THREE.InstancedMesh` visible.
41. **Post-processing parity**: WebGL2 composite shader (`RenderPipeline.ts` `COMPOSITE_FSG`)
    and WebGPU TSL graph (`WebGPUPostPipeline.ts`) MUST produce bit-identical output.
    - **Bloom bright-extract**: use `smoothstep(threshold, threshold+0.1, luminance)` — matches
      `BloomNode` exactly (NOT quadratic `c*(c-threshold)`).
    - **ACES**: `color*(6.2*color+0.03) / (color*(4.8*color+1.0) + 0.0001)` — epsilon (0.0001)
      prevents NaN on black pixels.
    - **Film grain**: use portable integer hash (`fract((p3.x+p3.y)*p3.z)` with
      `p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33)`). Do NOT use `sin()`-based
      hash — sin() precision differs GLSL vs WGSL → grain mismatch.
    - **sRGB encode**: exact `sRGBTransferOETF` (`mix(pow(c, 0.41666)*1.055 - 0.055, c*12.92,
      step(c, 0.0031308))`). WebGL2: manual in GLSL. WebGPU: rely on `TSLRenderPipeline`
      `outputColorTransform=true` (default).
42. **Subtitles**: `src/UI/Subtitles.ts` is the canonical section-hint UI. Created in
    `Experience.init()`, disposed in `Experience.destroy()`. Listens to `jlz:section-change`,
    shows short hint for 4s then auto-fades. Don't re-add a parallel hint system.
43. **Navigation — JoystickNav**: `src/UI/JoystickNav.ts` is the canonical nav (pure DOM,
    NO three-joystick library import). Trigger model — ONE section change per drag, ball
    snaps back to center. 2D: vertical=main sections (1-4 + Lab=0 + Process=5),
    horizontal=Lab(0)/Process(5). `CircularNav` is REMOVED (file kept as dead code) — do
    not re-add. World initial state is section 1 (Intro), NOT section 0.
44. **21st.dev MCP**: API key format `21st_sk_...` (not `an_sk_...` — rejected).
    Endpoint `https://21st.dev/api/mcp`. Free tier: 2 retrievals/day.
    Always port to TSL (Rule 1) — no raw ShaderMaterial from 21st components.
45. **Theme system — UIKit native `uk-light`**: `src/core/ThemeManager.ts` is the canonical
    theme manager. Uses UIKit's native inverse class `uk-light` (NOT custom `body.light-theme`
    per-component overrides — those were 50+ LOC of dead CSS, deleted). `_import.less` MUST
    have `@inverse-global-color-mode: light` (generates `uk-light`). **Three modes:**
    `'auto'` (default, follows active home section), `'light'` (forced), `'dark'` (forced).
    Manual override wins over auto. Persisted to `localStorage('jlz:theme')`. First-visit:
    if no saved mode, check `prefers-color-scheme: light` → start `'light'`; else `'auto'`.
    Content pages call `setAutoTheme(true)` (first section is light). Experience listens
    to `jlz:theme-applied` and syncs EnvSphere pattern in forced light/dark mode
    (light→Intro, dark→About). Toggle UI = **3 buttons** (Auto/Light/Dark) in
    `#jlz-menu-modal .jlz-theme-toggle` (`uk-button-group`).
46. **Mobile-first rem-based sizing**: `html { font-size: 0.85rem }` on mobile,
    `@media (min-width:640px) { html { font-size: 1rem } }` on tablet+. ALL sizing
    (UIKit globals, gutters, margins, control heights, box-shadows, custom paddings) MUST
    use `rem` units so they scale with the root font-size. The only exception is hairline
    borders (1-3px) which stay as `px` for crispness. master-quantum-flares `_import.less`
    has 76 px values converted to rem (recorded in worklog `mobile-first-rem-uikit-theme`).
47. **Responsive sections**: Use `class="uk-section uk-section-small uk-section-medium@s
    uk-section-large@m"` for ALL sections (home + content pages). The responsive pattern
    is mobile-first: small padding on mobile → medium at ≥640px → large at ≥960px. Do NOT
    use `uk-section-large` alone (was the previous pattern, replaced in 2026-07-11 mobile-first
    refactor). Do NOT add custom px padding on `.jlz-page-section` — let UIKit handle it.
48. **Design tokens location**: `src/styles/tokens.less` was DELETED — tokens now live in
    `src/assets/_import.less` §1 (`@jlz-*` Less variables) + §2 (`:root { --jlz-* }`
    CSS custom properties). Single source of truth — do NOT re-create `src/styles/`.
    master-quantum-flares `_import.less` MUST NOT duplicate UIKit globals (font-family,
    color, background, margin, gutter, control-height, inverse-color-mode) — those come
    from `_import.less`. master-qf only adds QF visual personality (font weights, status
    colors, box-shadows, glitch/scanline effects).

## Removed (don't re-add)

| Module | Reason |
| --- | --- |
| PerfMonitor | YAGNI — on-demand rendering made FPS tracking redundant |
| Bootstrapper | Inlined into `main-app.ts` (3 lines) |
| WorldAtmosphere | Inlined into `World.ts` (fog logic at 2 call sites) |
| World.advance alias | Experience calls `world.updateTransform()` directly |
| Section.switchViewingState | Callers use `switchState()` directly |
| SectionSceneFactory named wrappers | Replaced by `SECTION_CREATORS[6]` array |
| Lenis / SmoothScroll | JoystickNav drives navigation (no page scroll) |
| CircularNav | Replaced by JoystickNav (pure DOM, 2D, trigger model) — file kept as dead code |
| three-joystick (library import) | JoystickNav is pure DOM — no external joystick lib |
| ShaderBackground (as active bg) | Replaced by EnvSphere (file kept but unused) |
| CursorLight | Continuous spring-follow light, conflicts with on-demand |
| DebugStats | Merged into DevPanel (Tweakpane) |
| SectionProgress | Replaced by JoystickNav |
| Section3Flexible (active) | 8→6 unification — directory + creator still on disk as dead code |
| Section5Innovative (active) | 8→6 unification — directory + creator still on disk as dead code |
| `src/styles/tokens.less` | Merged into `src/assets/_import.less` §1 — single source of truth |
| Custom `body.light-theme .uk-*` overrides | Replaced by UIKit native `uk-light` (50+ LOC removed) |
| Per-section px padding on `.jlz-page-section` | Replaced by responsive `uk-section-small/medium@s/large@m` |

## Stop conditions

- TSL/WebGPU API unclear → ask human
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
