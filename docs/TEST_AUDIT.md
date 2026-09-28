# Test audit

This document records the repository-wide audit against the OpenClaw
`test-audit` criteria on 2026-09-28. The aim is to remove duplicate or
assertion-light tests without weakening owner-boundary coverage.

## Current policy

- Keep tests that protect observable behavior, lifecycle ordering, resource
  ownership, backend policy, route/accessibility contracts, or static delivery.
- Remove a test only when its behavior was deleted or another test covers the
  same contract with equal or better failure evidence.
- Do not add production seams solely to make a test easier. Prefer public owner
  boundaries, typed fixtures, and real registries.
- Source inspection is acceptable for static ownership or delivery contracts
  that have no independent runtime signal.

## Findings and actions

The first pass covered the 125 Vitest files and route, renderer, stage, and
delivery tests. One high-confidence duplicate was removed: the standalone
`worldSlots` assertion duplicated the canonical table-driven mapping test
(`650b0143`). Lifecycle tests for `LazyStage`, section groups, route stages,
renderer recovery, and resource disposal were retained because they exercise
ordering and ownership boundaries.

The following suspect patterns remain intentionally under review:

| Area                                     | Why it remains                                                             | Evidence required before changing it                                   |
| ---------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Private-field lifecycle tests            | They verify teardown/recovery ordering not exposed by a stable public API. | An owner-boundary test that fails on the same regression.              |
| `routeLayoutOwnership` source inspection | It guards CSS ownership and prevents a duplicate layout owner.             | An equivalent static-delivery or rendered-layout contract.             |
| `sceneHost.__resetSceneHostForTests`     | It resets the one-shot host bridge between isolated tests.                 | A redesigned bridge lifecycle; otherwise tests become order-dependent. |
| `experienceSeed` fixture bag             | It is a shared harness contract, not production state.                     | A typed harness API in one coherent change.                            |

Future passes should audit one coherent subsystem at a time and record the
replacement evidence here. Avoid mechanical deletion and avoid wrappers that
only mirror imperative construction.
