# Post-migration autonomous plan

This plan extends the completed Vue/TresJS migration while preserving the
single canvas, renderer and animation-loop ownership boundaries.

## Iteration 1 — physical WebGL device-loss gate

Run the existing WebGL device-loss probe in a browser/driver that restores a
usable framebuffer. The production path already fails closed when restoration
is unsupported. No runtime change is admitted unless the probe proves recovery
on the same canvas with one adopted renderer and no fatal event.

Evidence: `tests/e2e.spec.ts`, `src/Experience/Renderer.ts`,
`src/app/SceneHost.vue`, and `docs/evidence/phase7-live-gate/`.

Stop if the browser cannot restore the framebuffer or if recovery needs a
second canvas, renderer, or loop. Continue only with a passing WebGL gate.

## Iteration 2 — route configuration and demand contract

Extend route-cycle acceptance coverage to assert that every route rebuilds its
world configuration before owner reconciliation. Cover fog, post settings,
camera ranges, reduced-motion settlement, idle zero-draw behavior, and return
to home without resource growth.

Touch only `src/Experience/ExperienceUI.ts`,
`src/Experience/SceneCoordinator.ts`, focused tests, and the route soak script
when a missing assertion is identified.

Stop if correctness requires moving the scheduler to Tres `useLoop`, changing
the persistent canvas mode, or adding another state/event abstraction.

### Current route/config result — 2026-09-08

The soak now reads the coordinator's DEV-only config ids after every route
settles and requires the target page family (`sec_*` for home or
`content_<page>_*` for content routes). Twenty steady-state cycles passed on
`WebGLBackend`, including zero-idle demand, resource caps, one-canvas and
root-destroy checks. No scheduler or canvas ownership change was needed.

## Iteration 3 — measured declarative admission

Review remaining owners against a strict admission gate. Migrate only a new or
isolated static leaf whose geometry, material, animation, and disposal owners
are unambiguous. Existing TSL-heavy and animated owners remain imperative until
a measured runtime or maintenance problem justifies a slice.

Each slice requires one owner, one rollback point, focused lifecycle tests,
WebGPU and forced-WebGL evidence, reduced-motion coverage, and a route soak.

### Current admission result — 2026-09-08

The remaining owners were re-audited after the route soak. No new isolated
static leaf is currently available: the remaining candidates either own TSL
materials, animation state, input, or explicit GPU disposal. This iteration is
therefore stopped at the admission gate. The next declarative slice must start
from a newly introduced static scene element or from a measured maintenance or
runtime bottleneck; existing animated owners are not candidates by default.

## Next decision queue — 2026-09-08

PR #206's complete CI gate is green (unit, build, Playwright and Lighthouse),
and the route/config plus demand contract is covered by the 20-cycle soak. The
migration therefore has no unverified code slice to admit right now.

Continue only when a browser restores a usable WebGL framebuffer after
`WEBGL_lose_context`, a new isolated static scene leaf appears, or a measured
runtime/maintenance bottleneck justifies a bounded declarative extraction.
Until then, retain the current hybrid topology and advance reviewed Works
assets and case chapters. Do not add speculative wrappers, registries, loops,
or renderer bridges.

## Loop decision

`RenderScheduler` remains the loop owner. Tres `renderMode="manual"` plus
`advance()` is the closest bridge for an explicitly scheduled frame, but the
installed runtime proves that `advance()` cannot replace the stopped internal
loop without changing ownership. `renderMode="on-demand"` plus `invalidate()`
fits only when Tres owns demand scheduling, which does not match the current
typed demand flags and zero-idle-draw contract. Neither path is a production
replacement without a measured bottleneck and a dedicated spike.

## Completion rule

After each iteration, commit the smallest coherent change and record the gate
result in `NEXT.md` and the corresponding evidence directory. A failed gate
keeps the working hybrid path and blocks the next migration slice.
