# Production Autopilot Plan (Studio-Grade Target)

## Objective

Move `justlovejazz` from a functional prototype to a studio-grade interactive portfolio with:

- page-consistent visual system;
- deterministic state/motion architecture;
- polished 3D transitions;
- production QA gates;
- documented repeatable workflows for future projects.

## Current Maturity (Estimated)

- Architecture and build stability: 70%
- WebGPU/Three.js core integration: 75%
- Works UX and project flow: 60%
- Visual direction consistency across pages: 45%
- Production QA (perf/accessibility/mobile): 35%
- Studio polish level: 20–30%

## Non-Negotiable Production Gates

1. `npm run type-check` and `npm run build` always green.
2. E2E smoke green on all key routes (`/`, `/trinity.html`, `/works.html`).
3. Explicit renderer capability behavior (`webgpu | webgl | unsupported`) verified.
4. No known unsafe resource lifecycle paths.
5. Mobile-first UX and reduced-motion support verified.
6. Lighthouse target baseline:
   - Performance >= 85
   - Accessibility >= 90

## Delivery Tracks

## Track A — Visual System Unification

1. Introduce a shared page-token layer:
   - typography scale;
   - spacing rhythm;
   - section composition rules;
   - surface styles for cards/modals.
2. Normalize section storytelling per page:
   - Home: positioning + capabilities;
   - Trinity: method/process;
   - Works: portfolio deep dive.
3. Remove remaining style drift and duplicated legacy blocks.

## Track B — 3D Narrative Quality

1. Tighten section transition choreography:
   - phase-specific easing curves;
   - camera transition timing by page context;
   - controlled amplitude for mobile.
2. Improve gallery/project transition fidelity:
   - continuity between sticky list selection and 3D card expansion;
   - better transition masking for detail entry.
3. Add page-aware world presets (without forking architecture).

## Track C — Works Page Finalization

1. Keep portfolio interactive only on `/works.html`.
2. Finalize sticky UX:
   - stronger item hierarchy;
   - smoother preview change transitions;
   - explicit active state persistence.
3. Add case-study metadata blocks (role, scope, stack, outcomes).

## Track D — Performance and Stability

1. Add runtime performance diagnostics for critical transitions.
2. Cap expensive effects by quality tier in all heavy passes.
3. Audit and optimize heavy assets (texture formats, payload size, preload policy).

## Track E — QA and Accessibility Hardening

1. Expand Playwright coverage:
   - route-level smoke;
   - works selection -> open -> close;
   - keyboard navigation in works listbox.
2. Improve a11y semantics:
   - landmarks, focus order, modal flow;
   - aria state for active works item.
3. Validate mobile interaction details (touch, scroll, momentum, reduced motion).

## Sprint Plan (Automatic Execution)

### Sprint 1 (Now)
- Lock planning artifacts.
- Stabilize page-specific content and works isolation.
- Confirm core gates remain green.

### Sprint 2
- Implement visual token unification and remove style drift.
- Add page-aware transition presets.

### Sprint 3
- Finalize works polish (preview transitions + metadata structure).
- Expand E2E to cover works interaction lifecycle.

### Sprint 4
- Perf + a11y pass.
- Lighthouse + regression checks.

### Sprint 5
- Final production sweep:
  - docs sync;
  - QA checklist closure;
  - release readiness report.

## Done Definition (Studio-Grade)

- Cohesive cross-page art direction.
- Works flow is robust, intuitive, and benchmark-ready.
- Technical quality gates pass without exceptions.
- Docs accurately describe architecture, capabilities, and operations.
