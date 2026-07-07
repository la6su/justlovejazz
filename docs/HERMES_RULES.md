# HERMES_RULES — Operating Protocol for LLM Agents

> Hard-won rules. Each rule has a concrete bug that caused it. Follow them or you WILL break the project.

## Golden rules

### 1. NEVER use raw ShaderMaterial in scene objects

WebGPURenderer cannot compile raw GLSL ShaderMaterial (THREE.NodeBuilder
incompatibility). Use built-in materials OR TSL NodeMaterial (§2). ShaderMaterial
is allowed in post-processing passes (fullscreen quad) on the WebGL2 path only.

### 2. TSL NodeMaterial IS allowed — gate by DeviceCapability

TSL NodeMaterial (`MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`) is the
NATIVE path for WebGPU. Gate heavy TSL materials by `DeviceCapability.tier`.
Raw ShaderMaterial remains banned in scene.

### 3. ONE shared NodeMaterial per multi-face object

DO: Build ONE material, share it across all 6 cube faces (see `SplashCube`).
DON'T: Create 6 separate NodeMaterials — each creates a uniform group, and
WebGL has a ~12-16 binding-point limit. Six NodeMaterials crash WebGLBackend.

### 4. Non-destructive opacity fade

Cache `baseOpacity` in `userData`, apply fade multiplicatively. Never overwrite
factory opacity values.

### 5. ALWAYS use setAnimationLoop, not requestAnimationFrame

WebGPU requires setAnimationLoop for swap chain sync. rAF doesn't synchronize
with WebGPU swap chain → severe frame stutter on Chrome/WebGPU.

### 6. ALWAYS set scene.background

WebGPURenderer does NOT auto-clear. `World.bg.color` is authoritative — set
every frame in `World.update`.

### 7. alpha: false for WebGPURenderer

Chrome defaults to `alpha:true` → black screen.

### 8. NEVER remove the SplashCube (baku)

The SplashCube (Apple Fifth Avenue-style glass cube) IS the baku — the central
3D object on all sections. On works section §3 it morphs into the BakuCarousel
ring (§17). Removing it breaks both the splash sequence and the works section.

### 9. NEVER make section-bg opaque

DOM sections are transparent. 3D canvas provides background.

### 10. Single font: Inter

ONE font: Inter (300-900). Override master-quantum-flares AFTER its import in `main.less`.

### 11. NoiseText trigger: jlz:section-change + jlz:webgl-ready

NOT IntersectionObserver. NOT bulk `animateNoiseTitles`. Section-change event
only (initial animation on `jlz:webgl-ready`, subsequent on `jlz:section-change`).

### 12. Match section IDs

`intro/about/flexible/challenge/innovative/contact`. NOT "section-works".

### 13. Reuse #project-overlay

Don't create duplicate overlay containers.

### 14. BakuCarousel card click is the SOLE overlay opener

The fullscreen ProjectOverlay opens ONLY via BakuCarousel card raycast hit.
DO NOT re-add: Show button, cube-tap, or any other click path. Multiple entry
points caused event-handler conflicts + duplicate wiring.

### 15. master-quantum-flares is UIkit3 theme — DO NOT TOUCH

Override AFTER its import in `main.less`, never modify theme files.

### 16. No lessons system

Removed. Don't re-add.

### 17. Check junni reference first

`references/next.junni.co.jp/` — DO NOT MODIFY reference files (READ-ONLY).

### 18. references/ directory is READ-ONLY

Never commit changes to files under `references/`.

### 19. No hallucinated architecture

Don't invent "Stage4", "WorksStack", "Jólni", or other fictional modules.
Use existing patterns from the junni reference, adapted to built-in materials.

### 20. Always verify with lint + type-check + build

```bash
bun run lint && bun run type-check && bun run build
```

All three must pass. No exceptions.

### 21. NEVER re-add SmoothScroll / Lenis

SmoothScroll + Lenis were REMOVED. CircularNav drives section navigation.
Page doesn't scroll. ProjectOverlay locks `body.overflow` directly.

### 22. NEVER re-add SectionProgress

Replaced by CircularNav (`.jlz-circnav*`). Don't re-add timeline dots —
the dial IS the progress indicator.

### 23. Centralize UI-chrome event guards

DO: Use `isUiChromeEvent(e)` + `isMenuOpen()` from `src/UI/uiChrome.ts`.
DON'T: Inline `target.closest('#circ-nav, #jlz-menu-toggle, …')` strings —
they drift out of sync (a previous bug had `#jlz-menu-overlay` in some files
but the actual id is `#jlz-menu-modal`; guards silently failed).

### 24. dispose() must clean up ALL listeners + timers + GPU resources

Every class that adds window listeners, `setTimeout`, or creates THREE
geometries/materials/textures MUST remove/dispose them in `dispose()`.
Check: capture flags on `removeEventListener` MUST match `addEventListener`.
`BakuCarousel.dispose()` is called by `World.disposeSceneGroups()` via
`group.userData.gallery?.dispose?.()`.

### 25. No per-frame allocations in update() loops

Reuse pre-allocated scratch vectors/eulers/colors. `new THREE.Vector3()`
inside a per-frame loop causes GC pressure. See `SplashCube._tmpFaceOffset`
and `BakuCarousel._tmpRingRot/_tmpCubePos/_tmpRingPos/_tmpArcPos`.

### 26. Event-driven, not per-frame, for section-state writes

DO: Call `material.needsUpdate = true` on section CHANGE.
DON'T: Set `material.needsUpdate = true` every frame — forces shader recompiles.

### 27. NEVER use import.meta.hot

HMR is disabled (`server.hmr: false` in `vite.config.ts`). `import.meta.hot`
triggers Vite to inject `@vite/client`, which through the reverse proxy
resolves to the Next.js app (port 3000) returning HTML instead of JS —
breaks all module loading.

### 28. NEVER import CSS without `?inline` suffix

DO: `import './assets/main.less?inline'` — returns raw CSS string, no HMR injection.
DON'T: `import './assets/main.less'` — Vite injects `@vite/client` `updateStyle`/
`removeStyle` calls that fail through the proxy.

### 29. ALWAYS wrap Experience.update() in try/catch

A thrown error inside `setAnimationLoop` callback stops the render loop
permanently (no retry). Wrap the body in try/catch, log once, keep looping.
See `Experience.update()` for the canonical pattern.

### 30. Use drawCalls (per-frame), not calls (cumulative)

DO: `renderer.info.render.drawCalls` (reset each frame by `info.reset()`).
DON'T: `renderer.info.render.calls` — on WebGPURenderer this is cumulative
since start (grows forever — not a bug, just useless for monitoring).

### 31. NEVER re-add Subtitles

Subtitles are disabled. They will return as a 3D environment element later.
Don't re-add the old DOM-based Subtitles module.

### 32. NEVER re-add Input scroll system

`Input.ts` is now mouse-only. The scroll system (`scrollY`, `scrollVelocity`,
`update()`, `setScroll`, `refreshScrollLimit`) was removed — page doesn't scroll.
CircularNav drives navigation.

### 33. NEVER re-add setProjectTextures / clearProjectTextures

These no-op methods were deleted from `SplashCube`. The cube is always clean
glass — BakuCarousel owns the works-section visuals with its own per-card
meshes. No per-face textures are needed on the cube.

## Stop conditions

- TSL/WebGPU API unclear → ask human
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
- Tempted to use `any` outside adapter boundary → STOP, fix types

## Commit format

```
type: short imperative summary

Body: what changed, why, what bug it fixes.
```

Types: `fix`, `perf`, `feat`, `refactor`, `docs`, `chore`.
