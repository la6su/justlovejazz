# ROADMAP

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.

## Current State

| Area | Status |
|-------|-------------|
| TypeScript strict | ✅ Green |
| Build (Vite 8) | ✅ Green |
| WebGPU/WebGL/unsupported modes | ✅ Implemented + parity |
| SPA routing (home/trinity/works) | ✅ Implemented |
| WebGPU TSL post-processing (bloom/chromatic/grain/vignette) | ✅ Production-grade (BloomNode mip-chain) |
| Per-section camera tuning | ✅ In WorldConfig |
| Design token system | ✅ tokens.css + tokens.less |
| Memory lifecycle (window listeners) | ✅ All clean up on destroy |
| A11y baseline (reduced-motion, ARIA) | ✅ Respected |
| Docs-to-code sync | ✅ This pass |
| Main risk | chunk-core 644KB (acceptable, within Vite limit) |

## Refactoring Milestones (status)

### M1. Contract Stabilization ✅
- Renderer capability contract (`webgpu | webgl | unsupported`) is the
  single source of truth in `DeviceCapability`.
- No behavioral drift between types and runtime.
- Unsupported state shows explicit UX message.

### M2. State and Timeline Consistency ✅
- `scroll → worldState → camera/post` normalized to 0..1.
- Magic multipliers removed — per-section `camFovOffset`/`camFovDuration`/
  `camSmoothing` in `WorldConfig`.
- Delta-time propagated to PostProcessingManager (was hardcoded 1/60).

### M3. Asset Lifecycle Hardening ✅
- Context-driven disposal preserved (`AssetManager.disposeContext`).
- All window listeners (Sizes/Renderer/Camera/Input) clean up on destroy.
- No HMR listener leaks.

### M4. Bundle and Loading Optimization ✅ (partial)
- Lazy-loading in `main-app.ts` (ErrorTracker, UIManager, Bootstrapper,
  DissolveOverlay are dynamic imports).
- chunk-core 644KB (gzip 184KB) — within Vite's 1000KB warning limit.
- No oversized warning. Further splitting deferred until real-perf data.

### M5. Production QA Gate 🔄
- ✅ type-check + build stable green
- ✅ fallback behavior explicit and documented
- ✅ docs reflect real architecture (this pass)
- ⏳ E2E smoke expansion (Playwright config exists, tests in `tests/`)
- ⏳ Lighthouse on real hardware (config exists, targets perf ≥ 85, a11y ≥ 90)

## Exit Criteria (progress)

1. ✅ `npm run type-check` and `npm run build` stable green over multiple iterations.
2. ✅ Fallback behavior is explicit, tested, and documented.
3. 🔄 No critical perf/memory regressions vs baseline (memory clean; perf pending Lighthouse).
4. ✅ Documentation reflects real architecture, not historical plans.

## Remaining work (priority)

1. **Track 6 bespoke content** (needs human): 3D assets, Baku model, copy.
2. **Track B per-section bloom tuning** (design review).
3. **Playwright E2E expansion**.
4. **Lighthouse on real hardware**.
