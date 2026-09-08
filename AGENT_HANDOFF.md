# Resume checkpoint

Baseline: `ff9a12c5`, 2026-09-08. Recheck git status; this is a working-tree
checkpoint, not release evidence. Read AGENTS.md and [NEXT.md](NEXT.md).

## In progress

The Works installation ownership slice is implemented in the working tree.
`WorksInstallation.vue` transfers mounted nodes when its controller prop changes
and releases them before geometry disposal. The controller's identity-checked
`release` prevents a stale release from detaching a newer adoption.

ContactHaloStage and ManifestoInkStage now reference-count their shared plane
geometry. It remains shared while two stages coexist and is disposed by the
last stage, so a root teardown no longer retains either GPU buffer.

CasePlane uses the same final-owner release for the shared cloth geometry used
by Works cards.

ServicesStageGeometry now declares its seven parts and three rings in the Tres
template. Its mount hook only adopts the refs and applies camera-independent
initial transforms; material/state ownership remains in ServicesStage.

ServicesStage.updateState now reuses a preallocated offset vector instead of
allocating one on every rendered frame. Its lifecycle test covers reuse across
state updates.

Regression coverage exercises controller/material replacement without geometry
recreation, Vue-first/runtime-first child teardown, exactly-once geometry,
instance and material disposal, and stale release after a new adoption.
TypeScript, Vue TypeScript, 706 unit tests, production build and budgets passed.
The additional stale-release assertion also passed its focused rerun.
Serial Playwright passed 23 tests with one skipped device-loss case.
These tests use real Three/Tres objects with a mocked GPU renderer; they are
not physical WebGPU/WebGL evidence.

Continue the first task in NEXT.md: full host teardown, remaining primitive
owners and the unverified Contact visual report. Services geometry remains an
optional separate slice. Runtime ownership and evidence limits are in
[the transition status](docs/TRES_FULL_TRANSITION.md).

## Resume protocol

One task, targeted source reads, focused checks, then a short result.
Use [DEVELOPMENT.md](docs/DEVELOPMENT.md) for release commands.
After delivery replace this checkpoint with the next unfinished task and its
exact state; do not append session logs or copy the queue here.
