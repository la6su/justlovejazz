# Skills Training Plan
# WebGPU + Three.js Interactive Studio Sites (Junni-Style Patterns)

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.
> This plan is a reusable training framework, not a per-repo task list.
> The "Mapping to This Repository" section below reflects current status.

## Goal

Create a reusable skill system for training and delivery of interactive 3D sites using:

- Vite + TypeScript strict;
- Three.js + WebGPU primary;
- explicit WebGL fallback;
- state-driven transitions and section narratives;
- production-level lifecycle and QA discipline.

This plan is about **patterns and workflow**, not copying third-party assets/content.

## Skill Architecture

Define 9 core skills. Each skill is scoped, testable, and composable.

1. `skill-01-foundation`
2. `skill-02-renderer-capability`
3. `skill-03-world-state-timeline`
4. `skill-04-transition-choreography`
5. `skill-05-gallery-and-detail-fsm`
6. `skill-06-webgpu-shader-patterns`
7. `skill-07-asset-lifecycle-performance`
8. `skill-08-mobile-first-a11y-qa`
9. `skill-09-production-release-ops`

## Skill Breakdown

## 1) skill-01-foundation

- Repo setup standards.
- Strict TS conventions.
- App shell + section template architecture.
- Build/type gates as mandatory checks.

Outputs:
- stable project skeleton;
- starter docs and verification scripts.

## 2) skill-02-renderer-capability

- `webgpu | webgl | unsupported` detection contract.
- quality tiers: `high | medium | low`.
- fallback policy and unsupported UX state.

Outputs:
- typed capability contract;
- deterministic renderer init path.

## 3) skill-03-world-state-timeline

- canonical world state model.
- scroll normalization.
- section phase mapping and progression logic.

Outputs:
- single source of truth for camera/world/UI synchronization.

## 4) skill-04-transition-choreography

- section-driven enter/exit presets.
- transition easing matrix.
- timeline-based blending (not event-only toggles).

Outputs:
- consistent cinematic transitions across sections/pages.

## 5) skill-05-gallery-and-detail-fsm

- list -> focus -> open -> close flow.
- sticky selector + click-to-open detail pipeline.
- WebGL/DOM/Modal state synchronization.

Outputs:
- resilient project browsing and detail interaction.

## 6) skill-06-webgpu-shader-patterns

- TSL utility adapters.
- effect budget by quality tier.
- post-processing composition patterns.

Outputs:
- scalable shader stack with typed boundaries.

## 7) skill-07-asset-lifecycle-performance

- preload/must/sub priority design.
- context activation/disposal model.
- texture/geometry/material lifecycle safety.

Outputs:
- no known memory leaks in key transitions.

## 8) skill-08-mobile-first-a11y-qa

- mobile-first layout strategy.
- reduced-motion and touch interaction policy.
- focus/landmark/modal accessibility checks.

Outputs:
- consistent behavior on desktop + mobile with baseline a11y.

## 9) skill-09-production-release-ops

- E2E smoke + route checks.
- Lighthouse budgets and failure policy.
- release checklist and docs synchronization.

Outputs:
- repeatable release process for interactive studio sites.

## Training Path (6 Weeks)

## Week 1
- Skills 01–02
- Deliverable: stable foundation + renderer contract

## Week 2
- Skills 03–04
- Deliverable: timeline-driven section system + transitions

## Week 3
- Skill 05
- Deliverable: portfolio interaction lifecycle

## Week 4
- Skills 06–07
- Deliverable: shader discipline + lifecycle/perf safety

## Week 5
- Skill 08
- Deliverable: mobile-first + a11y baseline

## Week 6
- Skill 09
- Deliverable: production release package

## Assessment Rubric

Every skill is accepted only if:

1. type-check/build pass;
2. tests cover key behavior;
3. docs explain contracts and constraints;
4. no regressions in previous skill outputs.

## Mapping to This Repository

Status as of 2026-06-17 (post-junni-parity session). See `docs/STATUS.md`.

| Skill | Status | Notes |
|-------|--------|-------|
| 01-foundation | ✅ done | Vite + TS strict + app shell + build gates |
| 02-renderer-capability | ✅ done | webgpu/webgl/unsupported + quality tiers |
| 03-world-state-timeline | ✅ done | scroll normalization + section phase mapping |
| 04-transition-choreography | ✅ done | per-section camFovOffset/Duration/Smoothing in WorldConfig |
| 05-gallery-and-detail-fsm | ✅ done | WorksPortfolio + ProjectCarousel + ProjectOverlay |
| 06-webgpu-shader-patterns | ✅ done | tsl-utils.ts + three/addons BloomNode |
| 07-asset-lifecycle-performance | ✅ done | context-driven disposal + listener cleanup on destroy |
| 08-mobile-first-a11y-qa | 🔄 partial | reduced-motion + ARIA done; real-device testing pending |
| 09-production-release-ops | 🔄 partial | Lighthouse config exists; E2E expansion pending |

**Immediate implementation order for `justlovejazz`** (remaining):

1. Skill 08 — real-device mobile QA (needs hardware)
2. Skill 09 — E2E expansion + Lighthouse on real hardware
3. Bespoke content (Track 6 in JUNNI_PORT_BLUEPRINT) — needs human
