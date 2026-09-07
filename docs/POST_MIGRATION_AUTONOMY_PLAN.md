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

## Iteration 3 — measured declarative admission

Review remaining owners against a strict admission gate. Migrate only a new or
isolated static leaf whose geometry, material, animation, and disposal owners
are unambiguous. Existing TSL-heavy and animated owners remain imperative until
a measured runtime or maintenance problem justifies a slice.

Each slice requires one owner, one rollback point, focused lifecycle tests,
WebGPU and forced-WebGL evidence, reduced-motion coverage, and a route soak.

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
