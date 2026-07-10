# RULES — Hard rules. Each has bug provenance. Follow or break the project.

## Sync

```bash
git fetch origin && git checkout main && git pull origin main
```

## Rules

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. TSL NodeMaterial IS allowed (native WebGPU path)
3. ONE shared NodeMaterial per multi-face object (uniform group limit)
4. Built-in materials for particles/ground/cards
5. Non-destructive opacity — cache baseOpacity in userData
6. `setAnimationLoop` — not rAF
7. `scene.background` — NOT set. **EnvSphere** is sole background
8. `alpha: false` for WebGPURenderer
9. Never remove SplashCube (baku) — central 3D object
10. section-bg transparent
11. Single font: Inter
12. NoiseText via `jlz:section-change` (not IntersectionObserver)
13. `jlz:webgl-ready` must fire
14. Section IDs: lab, intro, about, challenge (works), contact, process. 1:1 cube faces
15. Reuse `#project-overlay`
16. BakuCarousel card click is SOLE overlay opener
17. master-quantum-flares DO NOT TOUCH (RULES §17, but QF vars ARE configurable via @global-*)
18. `references/` READ-ONLY
19. Always verify: `bun run lint && type-check && build && test:unit`
20. No `import.meta.hot` — breaks proxy module loading
21. CSS imports use `?inline` suffix
22. `server.hmr: false` + `block-vite-client` plugin
23. `try/catch` in `update()` — log + skip frame
24. On-demand rendering: `_needsRender` event-driven only. Ambient breathing (1 frame/2.5s) is the ONLY exception
25. DrawTrail: Works section (idx=3) ONLY
26. **Visual tiers**: `DeviceCapability.isRealWebGPU` gates backend. SplashCube same on both paths
27. **EnvSphere** is sole background. 6 per-section patterns (kept for reference). Global theme drives pattern: auto→Intro(light), inverse→About(dark)
28. **SplashCube**: RoundedBoxGeometry + MeshPhysicalMaterial + CubeCamera 512×512. Opener = scale pulse 1.0→1.3→1.0
29. **Fog ownership**: `World.ts` owns `scene.fog`
30. **Particle system**: `makeParticles` (THREE.Points + PointsMaterial). Used by Intro + Works only
31. **Post-processing parity**: WebGL2 composite shader and WebGPU TSL graph MUST produce bit-identical output. Portable integer hash, ACES epsilon, exact sRGBTransferOETF, BloomNode smoothstep
32. **Subtitles**: `src/UI/Subtitles.ts` — NoiseText scramble on `[data-eyebrow]`. Home sections only
33. **Navigation — JoystickNav**: pure DOM, NO three-joystick. Trigger model. 2D: vertical=1-4, horizontal=0/5 secret. Same on ALL pages
34. **Theme system**: 2-mode (auto=light/inverse=dark). Global flip, NOT per-section. `uk-light` on body. `localStorage('jlz:theme')`. EnvSphere syncs via `jlz:theme-applied`
35. **QF theme principle**: `@global-primary-background = @jlz-color-accent` (1 line). QF manages ALL components. Do NOT override `@button-*`, `@card-*`, `@navbar-*`
36. **Mobile-first rem sizing**: `html { font-size: 0.85rem }` mobile → `1rem` ≥640px. ALL sizing rem-based (hairline borders exception)
37. **Responsive sections**: `uk-section-small uk-section-medium@s uk-section-large@m`
38. **Design tokens**: `_import.less` §1-2. Single source of truth. master-qf MUST NOT duplicate UIKit globals
39. **Multi-page**: splash(/), app(/app), blog(/blog), landing(/landing). Vite multi-page input
40. **Dock**: 2-row bottom bar (tools + footer) on ALL pages. `padding-bottom: calc(130px + env(safe-area-inset-bottom))`
41. **Custom cursor**: codrops-style (inner dot + noisy circle canvas). Red on hover. Bump on click. Fill on hover. Magnetic snap to center (small elements only, not large menu items)
42. **Cube-map layout**: ALL pages have 6 sections: 0=secret, 1=intro(start), 2-4=main, 5=secret. Vertical cycles 1-4, horizontal toggles 0/5
43. **Slider nav**: visible on ALL app pages. Labels per-page (PAGE_SLIDER_LABELS in UIMenu.ts)
44. **MSAA**: `samples: 4` on scene WebGLRenderTarget (fixes edge aliasing)
45. **Experience.destroy()**: clear `window.experience`, `Experience.instance`, cancel rAF, remove all listeners
46. **EventBus**: typed. No raw `window.dispatchEvent` for events that have EventBus types. `jlz:route-change` covers navigation
47. **Content pages**: use `contentSection`/`contentTop`/`contentBottom` helpers (same cube structure as home `sectionShell`)
48. **PROCESS_STEPS**: shared constant in `_shared/constants.ts` (used by services + manifesto)
49. **No `jlj:navigate` event**: removed. Use `jlz:route-change` (typed in EventBus)

## Removed (don't re-add)

| Module | Reason |
| --- | --- |
| SmoothScroll/Lenis | JoystickNav drives navigation |
| CursorLight | Conflicts with on-demand |
| CircularNav | Replaced by JoystickNav |
| three-joystick | JoystickNav is pure DOM |
| ShaderBackground | Replaced by EnvSphere |
| BG.ts | Dead computation (bg.color never read) |
| Section3Flexible/Section5Innovative | 8→6 unification |
| `src/styles/tokens.less` | Merged into `_import.less` |
| Custom `body.light-theme .uk-*` | Replaced by UIKit `uk-light` |
| Particles on Lab/About/Contact/Process | Kept only on Intro + Works |
| EdgesGeometry (rainbow edges) | LineSegments linewidth>1 unsupported → aliasing |
