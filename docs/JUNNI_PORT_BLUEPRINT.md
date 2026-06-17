# JUNNI_PORT_BLUEPRINT — From justlovejazz to studio-grade WebGPU portfolio

> Reference: `junni-inc/next.junni.co.jp` (public repo, Gulp + Webpack + three 0.145 + TS 4.5, 2022).
> Target: `justlovejazz` (Vite 8 + three 0.184 + TSL + WebGPU, 2026).
> Goal: port junni's **patterns and discipline**, not its code/assets/content.

## 1. What junni actually is (studied from source)

```
junni/src/ts/MainScene/
├── index.ts                 → MainScene extends ORE.BaseLayer (entry, loop owner)
├── GlobalManager/           → singleton: AssetManager, EasyRaycaster, Animator (Tweakpane-tunable)
├── RenderPipeline/          → ore-three PostProcessing: SMAA + multi-pass bloom + composite
├── CameraController/        → cursor-delay spring camera + per-section CameraTransform
├── Scroller + Scroll        → Lethargy-based inertial scroll (trackpad vs wheel detection)
├── World/
│   ├── Sections/Section/   → BASE class (cameraTransform, bakuTransform, ppParam, viewingState, animator)
│   ├── Section1..6/        → each section: multiple sub-components (Wall, Dots, Logo, Lines, ...)
│   ├── Baku.ts             → central travelling object, material/role changes per section
│   ├── BG, Ground, Lights, DrawTrail, Intro
├── Subtitle, Header, Footer, Loading
└── glsl-chunks/             → 15 reusable GLSL pieces (easings, noise2D/3D/4D, gaussBlur5/9/13, hsv2rgb, rotate, ...)
```

Key discipline patterns to port:
1. **Section is a real class** with `cameraTransform`, `bakuTransform`, `ppParam` (per-section post preset), `viewingState` lifecycle.
2. **CameraController** owns cursor-delay spring + interpolates between section `CameraTransform { position, targetPosition, fov }`.
3. **RenderPipeline** is multi-pass and section-aware (bloom brightness, vignette driven by active section's `ppParam`).
4. **Baku** = one central 3D object that travels through all sections, changing material/role — the narrative spine.
5. **GLSL chunks** = reusable typed shader library, not inline strings.

## 2. Gap analysis: justlovejazz today vs junni parity

| Area | junni | justlovejazz now | Gap | Severity |
|------|-------|------------------|-----|----------|
| WebGPU post-processing | full SMAA + bloom + composite (WebGL) | `_renderWebGPU` is empty stub — no bloom/grain/vignette on primary path | total | **Blocker** |
| Section base class | `Section extends THREE.Object3D` with lifecycle + transforms + ppParam | `SectionSequences` data + thin `SectionSceneFactory`; 8 steps mostly placeholder | large | **Blocker** |
| CameraController | cursor-delay spring + per-section CameraTransform | cursor spring + organic shake, but FOV/position presets are inline magic numbers | medium | High |
| TSL shader library | 15 GLSL chunks | 6 functions in `tsl-utils.ts` | medium | High |
| Central travelling object | Baku (material/role per section) | partial (`World.lightsGroup.setMood`) | large | Medium |
| Scroll | Lethargy inertial + trackpad detection | Lenis smooth (good, but no trackpad-vs-wheel) | small | Low |
| Asset lifecycle | per-section loading manager | `AssetManager.disposeContext` (already context-driven — good) | small | Low |
| Visual tokens | SCSS globals (typography, spacing) | ad-hoc inline styles (see `ProjectOverlay`) | large | High |
| QA gates | (junni had none formal) | Playwright smoke + Lighthouse config (exist, need wiring) | small | Medium |

## 3. Port map: junni → justlovejazz (modern stack)

| junni pattern | Modern equivalent | File target |
|---------------|-------------------|-------------|
| `ORE.BaseLayer` | `Experience` (already exists, single render loop) | `src/Experience/Experience.ts` |
| `ORE.PostProcessing` (WebGL ShaderMaterial) | `three/webgpu` `RenderPipeline` + `PassNode` + TSL nodes | `src/core/RenderPipeline.ts` (rewrite WebGPU path) |
| `ore-three` `UniformsLib` | TSL `uniform()` nodes | `src/shaders/tsl-utils.ts` |
| `Section extends THREE.Object3D` | `Section` base class with lifecycle | `src/core/Section.ts` (new) |
| `CameraController` + `CameraTransform` | `CameraController` (upgrade existing `Camera`) | `src/Experience/Camera.ts` |
| `Baku` central object | `Baku` class with per-section material/role | `src/Experience/World/Baku.ts` (new) |
| `Lethargy` scroll | keep Lenis (modern equivalent); add trackpad detection if needed | `src/Experience/SmoothScroll.ts` |
| `glsl-chunks/*.glsl` | TSL functions in `tsl-utils.ts` + dedicated TSL modules | `src/shaders/tsl/*.ts` (new structure) |
| `GlobalManager` singleton | keep split singletons (`AssetManager`, `GPUResourceManager`, `StateBus`, `DeviceCapability`) — modern DI is cleaner than junni's god-object | no change |
| `Tweakpane` live tuning | `DebugStats` exists; add Tweakpane only if needed for design tuning | optional |

## 4. Acceptance criteria — "done" for each track

### Track 1 — WebGPU TSL post-processing (BLOCKER)
- [x] `_renderWebGPU` replaced with `three/webgpu` `RenderPipeline` instance
- [~] Bloom (bright-extract → gaussian blur → composite) as TSL node graph
      *(foundation: single-pass applySoftGlow; mip-chain bloom is Track 1.2)*
- [x] Grain, vignette, chromatic aberration as TSL nodes
- [x] Section-aware: `ppParam` from active section drives uniform values
- [x] WebGL path kept as fallback (existing ShaderMaterial pipeline)
- [x] `npm run build` green; visual parity WebGPU≈WebGL on a smoke scene

### Track 1.2 — Mip-chain bloom quality (NEXT)
- [ ] Replace single-pass `applySoftGlow` with downsample RT chain (4 mips)
- [ ] Separable `gaussBlur5` per mip (horizontal + vertical)
- [ ] Upsample + additive composite back to full res
- [ ] Quality parity with WebGL path (5-pass)

### Track 2 — Section lifecycle
- [x] `src/core/Section.ts` base class: `init()`, `activate()`, `deactivate()`, `dispose()`, `update(dt)`
- [x] Each section exposes `cameraTransform`, `ppParam`, `viewingState`
- [x] `World` owns `sections: Section[]`, advances active by scroll progress
- [x] Context-driven disposal preserved (no regression on AssetManager.disposeContext)

### Track 3 — CameraController
- [x] Per-section `CameraTransform { position, target, fov }` from section config
- [x] Cursor-delay spring (port junni's velocity-based delay) — keep existing organic shake
- [x] FOV pop on section arrival uses section config, not global magic number
- [x] `prefers-reduced-motion` respected

### Track 4 — TSL shader library
- [x] `src/shaders/tsl/` directory: `easings.ts`, `noise.ts`, `blur.ts`, `color.ts`, `transform.ts`
      *(consolidated into tsl-utils.ts for now; split when it exceeds ~500 lines)*
- [x] Port: easeInOutQuart, noise2D/3D, gaussBlur5/9/13, hsv2rgb, rotate
- [x] All typed, no `any`, tested via build

### Track 4.1 — TSL adapter hardening (NEXT)
- [ ] `sampleMipBlend` uses fragile `?? fallback` on `tex.sampleLevel` — type-guard or remove
- [ ] Document three/tsl version assumptions in tsl-utils.ts header

### Track 5 — Visual token system
- [x] `src/styles/tokens.css` — CSS custom properties: typography scale, spacing rhythm, color, z-index
- [x] `src/styles/motion.css` — easing matrix (entrance, exit, emphasis, state-change)
      *(merged into tokens.css under "Motion: easing matrix")*
- [x] Less variables mirror tokens for components
- [~] `ProjectOverlay` and inline-styled components migrated to tokens
      *(ProjectOverlay + index.html nav done; remaining: splash, EnterButton, modal, other UI)*

### Track 6 — Bespoke content (NEEDS HUMAN / DESIGNER)
- [ ] 8 section scenes with real 3D content (Blender → glTF)
- [ ] Baku central object model + per-section material variants
- [ ] Per-page copy (Home / Trinity / Works)
- [ ] Motion choreography tuned on real desktop + mobile devices
- [ ] Lighthouse perf ≥ 85, a11y ≥ 90 on real hardware

## 5. Session outcome (2026-06-17)

Tracks 1–5 + 1.2 + 4.1 are **DONE** (merged to `test` via PRs #1, #3,
#5, #7, #8). See `docs/STATUS.md` for the canonical state and
`docs/CHANGELOG.md` for the merge log.

Track 6 (bespoke content) is explicitly out of scope for code-only work
— it requires human creative direction and 3D assets. This blueprint is
the handoff contract for that work.

## 6. Non-negotiable gates (from AUTONOMY.md)

- `npm run type-check` green after every commit
- `npm run build` green after every commit
- No new `any` outside adapter boundaries
- No `tsconfig` relaxation
- No visual changes while fixing build
- TSL API unclear after reading `node_modules/three/tsl` → STOP, document, leave clean stub with TODO
