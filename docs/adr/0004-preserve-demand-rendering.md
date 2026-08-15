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
