# Production Autopilot Plan (Studio-Grade Target)

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.

## Objective

Move `justlovejazz` from functional prototype to studio-grade interactive
portfolio. Most code-level tracks are done; remaining work is bespoke
content + design review + QA on real hardware.

## Current Maturity (post-junni-parity session)

| Area | Before | After |
|------|--------|-------|
| Architecture + build stability | 70% | ✅ 95% |
| WebGPU/Three.js core integration | 75% | ✅ 95% (TSL pipeline + BloomNode) |
| Works UX and project flow | 60% | 60% (unchanged — needs bespoke content) |
| Visual direction consistency | 45% | 60% (tokens unified, content pending) |
| Production QA (perf/a11y/mobile) | 35% | 65% (a11y done, perf pending Lighthouse) |
| Studio polish level | 20–30% | 30–40% (foundation done, bespoke polish pending) |

## Non-Negotiable Production Gates

1. ✅ `npm run type-check` and `npm run build` always green.
2. 🔄 E2E smoke green on all key routes (`#/`, `#/trinity`, `#/works`).
   Playwright config exists; tests need expansion.
3. ✅ Explicit renderer capability behavior (`webgpu | webgl | unsupported`) verified.
4. ✅ No known unsafe resource lifecycle paths (listeners clean up on destroy).
5. 🔄 Mobile-first UX and reduced-motion support verified (reduced-motion done;
   mobile touch UX needs real-device testing).
6. ⏳ Lighthouse target baseline: Performance ≥ 85, Accessibility ≥ 90.

## Delivery Tracks (status)

### Track A — Visual System Unification ✅
1. ✅ Shared page-token layer: `src/styles/tokens.css` (typography scale,
   spacing rhythm, color, z-index, motion easing matrix) + `tokens.less` bridge.
2. 🔄 Section storytelling per page — needs bespoke content (Track 6).
3. ✅ Remaining style drift removed — splash, EnterButton, ProjectOverlay,
   nav, modal, gallery-anchor all migrated to tokens.

### Track B — 3D Narrative Quality 🔄
1. ✅ Phase-specific easing: per-section `camFovOffset`/`camFovDuration`/
   `camSmoothing` in WorldConfig.
2. 🔄 Gallery/project transition fidelity — needs design review.
3. 🔄 Page-aware world presets — `bloomRadius`/`bloomThreshold` per section
   is the next design decision.

### Track C — Works Page Finalization 🔄
1. ✅ Portfolio interactive only on `#/works` (data-page gate).
2. 🔄 Sticky UX polish — needs bespoke content + design review.
3. ⏳ Case-study metadata blocks (role, scope, stack, outcomes).

### Track D — Performance and Stability 🔄
1. ⏳ Runtime performance diagnostics — DebugStats exists (FPS/MEM/GEO),
   needs section-transition profiling.
2. ✅ Expensive effects capped by quality tier (PostProcessingManager
   QUALITY_SCALARS: high/medium/low).
3. ⏳ Heavy asset audit (texture formats, payload) — deferred until assets exist.

### Track E — QA and Accessibility Hardening 🔄
1. ⏳ Playwright coverage expansion (route smoke, works lifecycle, keyboard nav).
2. ✅ A11y semantics: landmarks, ARIA on splash/progress, focus-visible on
   EnterButton/overlay nav, skip-link present.
3. ⏳ Mobile interaction validation on real devices.

## Sprint Plan (revised)

### Sprint 1 (DONE)
- ✅ Planning artifacts locked (JUNNI_PORT_BLUEPRINT, STATUS.md).
- ✅ Render-pipeline integrity (PR #1).
- ✅ Core gates green.

### Sprint 2 (DONE)
- ✅ Visual token unification (PR #3, #5, #7).
- ✅ Per-section transition presets (PR #3).

### Sprint 3 (NEXT — needs human)
- Bespoke 3D content for 6 step scenes.
- Baku central object model + per-section material variants.
- Per-page copy (Home/Trinity/Works).

### Sprint 4
- Playwright E2E expansion.
- Lighthouse on real hardware.

### Sprint 5
- Final production sweep: docs sync (this pass done), QA checklist, release.

## Done Definition (Studio-Grade)

- ⏳ Cohesive cross-page art direction (needs bespoke content).
- 🔄 Works flow robust + benchmark-ready (code done, content pending).
- ✅ Technical quality gates pass without exceptions.
- ✅ Docs accurately describe architecture, capabilities, and operations.
