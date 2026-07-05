# HERMES_RULES — Operating Protocol for LLM Agents

> Hard-won rules. Each rule has a concrete bug that caused it.
> Follow them or you WILL break the project.

## Synchronization

```bash
git fetch origin
git checkout main
git pull origin main
git log --oneline -1  # verify you're on latest
```

`main` is always deployable. Never force-push.

## Golden rules

### 1. NEVER use raw ShaderMaterial in scene objects

WebGPURenderer cannot compile raw GLSL ShaderMaterial (THREE.NodeBuilder
incompatibility). Use built-in materials (MeshStandardMaterial,
MeshBasicMaterial, PointsMaterial, LineBasicMaterial) or TSL NodeMaterial
(see §2). ShaderMaterial is allowed in post-processing passes (fullscreen
quad, not in scene graph) on the WebGL2 path only.

### 2. TSL NodeMaterial IS allowed for scene objects

TSL NodeMaterial (MeshStandardNodeMaterial, etc.) is the NATIVE path for
WebGPU — prefer it over built-in materials when you need custom shaders.
Gate heavy TSL materials by DeviceCapability.tier — on low-tier devices,
fall back to built-in materials. Raw ShaderMaterial remains banned in scene.

### 3. Non-destructive opacity fade

Cache baseOpacity in userData, apply fade multiplicatively.

### 4. ALWAYS use setAnimationLoop, not requestAnimationFrame

WebGPU requires setAnimationLoop for swap chain sync.

### 5. ALWAYS set scene.background

WebGPURenderer does NOT auto-clear. World.bg.color is authoritative.

### 6. alpha: false for WebGPURenderer

Chrome defaults to alpha:true → black screen.

### 7. NEVER remove the SplashCube (baku)

The SplashCube (Apple Fifth Avenue-style glass cube) IS the baku — the central
3D object present on all sections. On the works section it morphs into the
BakuCarousel ring (see §14). Removing it breaks both the splash sequence
and the works section.

### 8. NEVER make section-bg opaque

DOM sections are transparent. 3D canvas provides background.

### 9. Single font: Inter

ONE font: Inter (300-900). Override master-quantum-flares AFTER import.

### 10. NoiseText trigger: jlz:section-change

NOT IntersectionObserver. NOT bulk animateNoiseTitles. Section-change event only.

### 11. jlz:webgl-ready MUST fire — do not re-add Troika/WebGLTextManager

`jlz:webgl-ready` is dispatched by `main-app.ts` at curtain mid-open and
triggers the NoiseText title animation. Do not re-introduce Troika.

### 12. Match section IDs

intro/about/flexible/challenge/innovative/contact. NOT "section-works".

### 13. Reuse #project-overlay

Don't create duplicate overlay containers.

### 14. BakuCarousel card click is the SOLE overlay opener

The fullscreen ProjectOverlay opens ONLY via BakuCarousel card click.
Do NOT re-add: Show button, cube-tap, or any other click path. Multiple
entry points caused event-handler conflicts + duplicate wiring.

### 15. master-quantum-flares is UIKit3 theme — DO NOT TOUCH

Override AFTER its import in main.less, never modify theme files.

### 16. No lessons system

Removed. Don't re-add.

### 17. Check junni reference first

`references/next.junni.co.jp/` — DO NOT MODIFY reference files.

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

SmoothScroll + Lenis were REMOVED. SwipeNav drives section navigation
(one-section-at-a-time swiper). The page doesn't scroll. ProjectOverlay
locks `body.overflow` directly when the fullscreen overlay is open.
Re-adding Lenis re-introduces a per-frame `lenis.raf()` call + a window
scroll listener that drives nothing.

### 22. NEVER re-add SectionProgress

SectionProgress was replaced by SwipeNav (`.jlz-swipenav*`). Don't re-add
timeline dots — the SwipeNav scrubber IS the progress indicator.

### 23. Centralize UI-chrome event guards

Use `isUiChromeEvent(e)` + `isMenuOpen()` from `src/UI/uiChrome.ts`.
Do NOT inline `target.closest('#swipe-nav, #jlz-menu-toggle, …')` strings —
they drift out of sync (a previous bug had `#jlz-menu-overlay` in some
files but the actual id is `#jlz-menu-modal`; guards silently failed).

### 24. dispose() must clean up ALL listeners + timers + GPU resources

Every class that adds window listeners, setTimeout, or creates THREE
geometries/materials/textures MUST remove/dispose them in `dispose()`.
Check: capture flags on removeEventListener MUST match addEventListener.
BakuCarousel.dispose() is called by World.disposeSceneGroups() via
`group.userData.gallery?.dispose?.()`.

### 25. No per-frame allocations in update() loops

Reuse pre-allocated scratch vectors/eulers/colors. `new THREE.Vector3()`
inside a per-frame loop causes GC pressure. See SplashCube._tmpFaceOffset
and BakuCarousel._tmpRingRot/_tmpCubePos/_tmpRingPos/_tmpArcPos.

### 26. Event-driven, not per-frame, for section-state writes

`clearProjectTextures()`, `portfolio.group.visible = false`, etc. should
be called on section CHANGE (event-driven), not every frame. Per-frame
`material.needsUpdate = true` forces shader recompiles.

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
