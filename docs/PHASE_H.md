# Phase H — Visual Polish & Mobile QA

## Context

**Status**: Core Done (A–E), Lazy Loading Done (F), Production Done (G).
**Next**: Visual finish that gets the site to "Active Theory / Resn" level.

Everything functional works. The scene renders correctly with:
- WebGPU primary / WebGL fallback
- Cinematic camera with scroll-driven state machine
- Gallery expand/contract with atomic callbacks
- Section-based content transitions (Awakening → Discovery → DeepDive → Connection)
- Post-processing (bloom, vignette, grain via TSL)
- Service Worker offline caching
- Error tracking (zero-dependency)
- Lighthouse CI + E2E tests

## Goals

Transform the experience from "functional" to "cinemic studio portfolio" —
the kind that makes design studios' portfolios.

### H.1 — Post-Processing Pipeline (Upgrade)

**Current**: Basic bloom + vignette + grain via `postProcessingNode()`.
**Problem**: Post-processing is primitive — single compositon node, no SMAA, no proper tone mapping. Flash + bloom hits are too heavy.

**Target**:

1. Proper TSL post-processing chain:
   - 🌸 Bloom: multi-resolution mip pyramid, sample count per quality tier
   - 🔇 Chromatic aberration (subtle, WebGPU only)
   - ⌛ Vignette: smooth edge falloff with configurable radius
   - 🌾 Grain: frequency-based, amplitude modulated per section
   - 📐 SMAA/TAA (anti-aliasing in post)
   - 🎨 Tone mapping: ACES applied uniformly across all paths

2. Post-processing responds to section state:
   - `AWAKENING`: Strong bloom, heavy grain → atmosphere.
   - `DISCOVERY`: Clean bloom, subtle grain → gallery clarity.
   - `DEEP_DIVE`: Reduced bloom, more chromatic → technical feel.
   - `CONNECTION`: Minimal post-processing → clean CTA.

3. Quality tiers:
   - high: full chain (bloom pyramid + AA + chromatic + grain + vignette)
   - medium: reduced samples (bloom 4-tap, chromatic off, grain 50%)
   - low: bloom disabled, vignette only

### H.2 — Baku Material (Section States)

**Current**: `Baku` has basic material states.
**Target**: Section-driven Baku:

| Section     | Material State | Appearance                            |
|------------|----------------|---------------------------------------|
| AWAKENING  | `wireframe`    | Eeride mesh, high metal, emissive     |
| DISCOVERY  | `dark`         | Matte dark, low reflectance           |
| DEEP_DIVE  | `glass`        | Transmissive, rough 0.0               |
| CONNECTION | `normal`       | Clean brushed metal, subtle sheen     |

### H.3 — Camera Polish

**Current**: Camera follows `cameraTarget` with smoothing + FOV accents on section change.
**Target**:

1. **Arrival pulse**: Subtle FOV wobble on section change (0.8s ease-out).
2. **Handheld shake**: Low-frequency noise overlay (gen 0.001 amplitude, never on mobile).
3. **Cursor attract**: Camera micro-drifts toward pointer (0.1 strength, ease 0.95).
4. **Baku follow**: Camera rotates slightly to track Baku's position (0.3 offset).
5. **Mobile**: No handheld shake, no cursor attract, slower smoothing.

### H.4 — Section Transitions (Visual)

**Current**: Section content fades via `queueTransition()`.
**Target**:

1. **Curtain wipe**: TSL node that reveals/hides content with a geometric wipe.
2. **Bloom pulse**: Bloom intensity spikes for 0.3s on section change.
3. **Camera snap**: After arrival pulse, camera smoothly settles to new position.
4. **Post-processing crossfade**: 0.5s lerp between old and new post params.

### H.5 — Mobile QA

**Priority**: Critical. Site must be usable on mobile.

1. **`prefers-reduced-motion`**: All animations disabled or simplified.
2. **Mobile layout**: Gallery cards larger (min 80px touch target).
3. **Mobile camera**: Reduced FOV range (fof 1.0–1.1 vs 1.0–1.5).
4. **DPR cap**: Already at 2.0 — verify.
5. **Touch gallery**: Swipe + tap, no hover.
6. **Performance**: Target 45 FPS on iPhone 13-level devices.
7. **No WebGL fallback**: WebGPU mobile is primary for WebGPU-supported devices.

### H.6 — Performance Final Audit

1. **Heap stability**: No memory growth after repeated section transitions.
2. **Texture disposal**: Old section content disposed when transitioning.
3. **Long tasks**: Nothing > 100ms in steady state.
4. **Lighthouse**: Performance ≥ 90 score.
5. **Bundle size**: Already optimized (chunk-world 700KB gzip 209KB).

### H.7 — Content Polish

1. **Loading screen**: Animated loader → fade to scene (no abrupt reveal).
2. **Scroll hints**: "Scroll to explore" indicator for first visit.
3. **Typography**: All text uses consistent scale/accent pattern.
4. **Gallery cards**: Hover state (glow, slight lift) — desktop only.

## Order of Execution

```
H.1 → H.4 → H.2 → H.3 → H.5 → H.6 → H.7
```

1. Post-processing foundation controls visual quality ceiling.
2. Section transitions depend on post-processing state.
3. Baku material builds on post-processing output.
4. Camera polish enhances all other systems.
5. Mobile QA validates everything.
6. Performance audit closes gaps.
7. Content polish is the final layer.

## Success Criteria

- `npm run build` passes
- 🌸 Lighthouse: Performance ≥ 90, Accessible ≥ 90
- 📁 No memory leaks after 10 section transitions
- ❌ Mobile touch targets ≥ 80px
- 🖥️ Reduced motion complied
- 🖼️ Each section "pauses" well (poster quality)
