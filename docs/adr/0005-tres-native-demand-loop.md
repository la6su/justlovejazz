# ADR 0005 — Tres-native demand loop

- Status: accepted, 2026-09-25 (PR #224)
- Supersedes (in part): ADR 0004 "preserve demand rendering" (snapshot
  `ac3404d`) — the demand policy survives; the loop driver moves.
- Numbering note: the deleted snapshot's `0005-integrate-uikit-with-vue.md`
  used this number; this record replaces it for all current prose
  references. Snapshot files remain retrievable via
  `git show ac3404d:<path>` (see README).

## Context

Until 2026-09-25 the `RenderScheduler` was the single `setAnimationLoop`
caller: `TresCanvas` ran `render-mode="manual"` with its internal loop
stopped, and the scheduler owned the RAF. That kept the bounded demand
policy authoritative but left the project off the Tres ecosystem: Cientos
was deliberately not installed (peer-lock against `@tresjs/core` 5.8.3),
`useLoop` subscribers were contractually forbidden, and every renderer
swap needed loop re-attachment bookkeeping.

## Decision

The persistent Tres loop is the one RAF host:

- `TresCanvas` runs `render-mode="manual"` but keeps its loop running;
  `RenderScheduler` drives frames through a `SceneLoopPort`
  (`onBeforeLoop`) instead of owning `setAnimationLoop`.
- `@tresjs/cientos` 5.9.0 is installed (with `@tresjs/core` 5.9.0) as the
  declared foundation for ecosystem adoption; first component adoption is
  queued (e.g. Lab camera exploration via CameraControls).
- Ecosystem wake path: the wrapped `manager.invalidate()` in
  `SceneHost.vue` maps Tres/Cientos invalidations to the scheduler's
  `external` frame reason, so components using `useLoop` semantics wake
  the demand scheduler instead of racing it.
- Competing RAF loops remain forbidden: everything subscribes through the
  scheduler, which stays the single frame-policy owner (settle, demand
  windows, visibility).
- The renderer boundary is instance-agnostic: a device-loss renderer swap
  needs no loop re-attachment (see `Renderer.ts`).

## Consequences

- `Renderer.setAnimationLoop` is gone; `RenderScheduler` no longer calls
  it (pinned by `Renderer.deviceLossLifecycle.test.ts`).
- Scheduler behavior is locked by `renderScheduler.test.ts` and
  `TresLoop.contract.test.ts` (vendor upgrade canary).
- Documented in `ARCHITECTURE.md` → Renderer and scheduling; the seam
  lives in `src/app/sceneHost.ts` and `src/app/SceneHost.vue`.
