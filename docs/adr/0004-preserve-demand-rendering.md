# ADR 0004: Preserve demand-driven rendering

- Status: Accepted with implementation gate
- Date: 2026-08-15

## Context

The current scene calls `setAnimationLoop` for WebGPU pacing but avoids draw
work when settled. Many bounded animations and route layers can independently
keep rendering active. A Vue or TresJS migration could accidentally introduce
a second loop or continuous rendering.

## Decision

Create one framework-neutral `RenderScheduler` for invalidation and typed
activity tokens. Before Tres cutover, the current Experience loop remains the
single driver. At cutover, TresCanvas manual mode becomes the single
renderer-loop integration and the scheduler requests frames only through one
`advance()` adapter; project code no longer calls `renderer.setAnimationLoop`.
Vue state may invalidate the scheduler but does not wrap frame work in deep
reactivity. Phase 1 and the representative spike must verify this contract
against the selected TresJS version before production ownership moves.

## Consequences

Every animated owner must acquire and release a token. Reduced motion settles
and releases synchronously. Hidden tabs pause; resume invalidates once. Tests
assert one canvas, one loop driver, bounded idle ticks, zero settled draws and
diagnostic visibility of active reasons. If the spike cannot prove a single
driver through supported Tres APIs, this implementation remains blocked.

## Superseding clarification — 2026-08-16

The Phase 2 representative loop-driver evidence (2026-08-15, three valid
90-invocation windows per backend on the physical Android device, median and
worst p95 16.80 ms) selected the bounded `setAnimationLoop` port as the single
renderer-loop driver. It keeps the TresCanvas internal loop stopped and lets
the project-owned driver install `renderer.setAnimationLoop` for bounded
activity windows and clear it when settled; it retained zero idle ticks where
manual-mode `advance()` retained 60 idle ticks per second on both backends.

This supersedes the mechanism described in the Decision section, in which
TresCanvas manual mode would request frames only through an `advance()`
adapter and project code would no longer call `renderer.setAnimationLoop`.
Under the selected mechanism the project-owned driver is the single caller of
`renderer.setAnimationLoop`; the TresCanvas internal loop remains stopped, so
the one-driver invariant is unchanged. This clarification does not rewrite the
original decision or its history; it records that the integration mechanism
changed when the Phase 2 evidence existed.

Everything else in this decision is unchanged: one canvas and one driver,
demand-driven frames, no deep reactivity around frame work, hidden-tab pause
and resume, reduced-motion settling, and the listed test obligations.
