# Phase H — Visual Polish & Mobile QA

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.
> Section ids in code are `step01`–`step06` (not AWAKENING/DISCOVERY/etc.
> — those names were historical and never matched WorldConfig).

## Context

Code-level foundation is done (PRs #1–#8). The scene renders correctly with:
- WebGPU primary / WebGL fallback (full parity: bloom + chromatic + grain + vignette)
- Cinematic camera with scroll-driven state machine + per-section FOV/smoothing
- Gallery expand/contract with atomic callbacks
- Section-based content transitions (step01 → step06 per page)
- Post-processing via three/addons BloomNode (mip-chain, 5 levels) on WebGPU
- Service Worker offline caching
- Error tracking (zero-dependency)
- Lighthouse CI + E2E test config

**Remaining**: bespoke visual content + design polish + real-device QA.

## Goals

Transform from "functional" to "cinematic studio portfolio".

### H.1 — Post-Processing Pipeline ✅ DONE

**Was**: Basic single-pass glow + vignette + grain.
**Now**: Production-grade TSL pipeline on WebGPU:
- 🌸 Bloom: `three/addons/tsl/display/BloomNode` (5-level mip-chain)
- 🔇 Chromatic aberration: `applyChromaticAberration` in tsl-utils.ts
- ⌛ Vignette: `applyCinematicVignette` (radial falloff)
- 🌾 Grain: `applyProfessionalGrain` (time-varying, dual sine)
- 🎨 Tone mapping: `acesTonemap` (Narkowicz 2015) + `renderOutput`

Quality tiers enforced via `PostProcessingManager.QUALITY_SCALARS`:
- high: full chain
- medium: chromatic off, grain 50%
- low: bloom off, vignette only

Section-aware: `ppParam` from active section drives uniform values,
crossfaded by `PostProcessingManager.update(dt)`.

⏳ **Remaining**: SMAA/TAA anti-aliasing in post (currently relies on
renderer `antialias: true` at construction).

### H.2 — Baku Material (Section States) ⏳ NEEDS BESPOKE

**Current**: `Baku` class exists in `src/Experience/World/Baku.ts` with
basic material states. `BakuRole` enum: `NORMAL | WIRE | GLASS`.
**Target**: Section-driven Baku per WorldConfig `bakuRole`:

| Step | bakuRole | Appearance |
|------|----------|------------|
| step01 | NORMAL | Default material |
| step02 | WIRE | Wireframe mode |
| step03 | WIRE | Wireframe mode |
| step04 | NORMAL | Default, low opacity |
| step05 | GLASS | Transmissive |
| step06 | WIRE | Wireframe mode |

⏳ **Needs**: bespoke 3D model + material variants (Blender → glTF).
Code infrastructure exists; assets do not.

### H.3 — Camera Polish ✅ DONE

**Now**:
1. ✅ Arrival pulse: `Camera.setFovOffset(camFovOffset, camFovDuration)` per section.
2. ✅ Handheld shake: organic sine-based, `!isMobile && !reduced` gated.
3. ✅ Cursor attract: spring-damper, `!isMobile && !reduced` gated.
4. 🔄 Baku follow: not implemented (needs Baku model first).
5. ✅ Mobile: no shake, no cursor attract, reduced smoothing.

### H.4 — Section Transitions (Visual) 🔄 PARTIAL

**Current**: Section content fades via StateBus `queueTransition()`.
Post-processing crossfades via `PostProcessingManager.update(dt)`.

⏳ **Remaining**:
1. Curtain wipe TSL node (geometric reveal/hide).
2. Bloom pulse on section change (0.3s spike).
3. Post-processing crossfade is done; visual tuning pending.

### H.5 — Mobile QA ⏳ NEEDS REAL-DEVICE TESTING

1. ✅ `prefers-reduced-motion`: enforced in Camera, SmoothScroll,
   GalleryManager, World, tokens.css.
2. 🔄 Mobile layout: gallery cards min 80px touch target — verify.
3. ✅ Mobile camera: reduced FOV range, no shake.
4. ✅ DPR cap: 2.0 (in Sizes + DeviceCapability).
5. 🔄 Touch gallery: swipe + tap, no hover — verify.
6. ⏳ Performance: target 45 FPS on iPhone 13-class — measure.
7. ✅ WebGPU mobile primary where supported; WebGL fallback otherwise.

### H.6 — Performance Final Audit ⏳ PENDING

1. ✅ Heap stability: no listener leaks (destroy wiring complete).
2. ✅ Texture disposal: context-driven via AssetManager.disposeContext.
3. ⏳ Long tasks: nothing > 100ms in steady state — profile on real hardware.
4. ⏳ Lighthouse: Performance ≥ 90 (config exists, needs run).
5. ✅ Bundle size: chunk-core 644KB gzip 184KB (within limits).

### H.7 — Content Polish ⏳ NEEDS HUMAN

1. ✅ Loading screen: splash with progress bar + ARIA.
2. ✅ Scroll hints: scrollHint element in index.html.
3. ✅ Typography: token scale (1.250 major third) in tokens.css.
4. 🔄 Gallery cards: hover state (glow, lift) — desktop only, needs design.

## Order of Execution (revised)

```
H.1 ✅ → H.3 ✅ → H.4 🔄 → H.2 ⏳ → H.5 ⏳ → H.6 ⏳ → H.7 ⏳
```

H.1 + H.3 done. H.4 partial. H.2 blocked on bespoke Baku model.
H.5/H.6/H.7 need real-device access and bespoke content.

## Success Criteria

- ✅ `npm run build` passes
- ⏳ Lighthouse: Performance ≥ 90, Accessibility ≥ 90
- ✅ No memory leaks after section transitions (destroy wiring complete)
- 🔄 Mobile touch targets ≥ 80px (verify)
- ✅ Reduced motion complied
- ⏳ Each section "pauses" well (poster quality) — needs bespoke content
