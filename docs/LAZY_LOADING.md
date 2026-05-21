# LAZY_LOADING — Architectural Plan

## Problem

Current production build reports oversized core chunk warning (around 1.6 MB minified in current baseline). Startup cost is still too heavy for studio-grade mobile UX.

## Goal

Reduce startup cost without introducing fragile loading orchestration.

## Tiers

| Tier | Content | Target |
|------|---------|--------|
| 1. Critical | entry + renderer init + minimal UI shell | fast first interactive frame |
| 2. Route Feature | route-specific scene/UI blocks | loaded only when needed |
| 3. Heavy Assets | large textures, optional media | deferred |
| 4. Non-Critical UX | secondary effects/text extras | deferred |

## Performance Budget

| Metric | Target |
|--------|--------|
| Build warning | no untracked oversized warning on critical chunk |
| First interactive frame | improved vs current baseline |
| Total warm load | no regression |
| Visual stability | no route flicker during deferred loads |

## Design Decisions

- Do not over-engineer bootstrap sequence.
- Prefer Vite-native code splitting and route/feature boundaries first.
- Defer optional effects only after behavior remains deterministic.

## Implementation Order

1. Measure current chunk map and critical path after `npm run build`.
2. Split by route/feature boundary (start with `works`-specific modules).
3. Verify no runtime regressions in page transitions and gallery flow.
4. Defer heavy assets behind explicit activation points.
5. Re-run build and keep thresholds documented in `docs/CHANGELOG.md`.
