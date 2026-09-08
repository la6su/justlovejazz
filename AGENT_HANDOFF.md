# Resume checkpoint

Baseline: `ff9a12c5`, 2026-09-08. Recheck git status; this is a working-tree
checkpoint, not release evidence. Read AGENTS.md and [NEXT.md](NEXT.md);
do not reread the full chat or migration archive.

## In progress

The flat-menu slice is complete. Its files were:

- src/app/views/NavMenu.vue
- src/app/menuLifecycle.ts
- src/**tests**/navTemplate.lifecycle.test.ts
- tests/e2e.spec.ts

Previous checks: 705 unit tests, both type checks and the serial browser gate
passed. LazyStage now guards route disposal during awaited attachment before
starting `load()`. Continue with the first task in NEXT.md; it defines
remaining behavior and acceptance.

Documentation consolidation corrects the Services declarative claim and
separates historical evidence from current guarantees.
Runtime ownership and evidence limits are in
[the transition status](docs/TRES_FULL_TRANSITION.md).

## Resume protocol

One task, targeted source reads, focused checks, then a short result.
Use [DEVELOPMENT.md](docs/DEVELOPMENT.md) for release commands.
After delivery replace this checkpoint with the next unfinished task and its
exact state; do not append session logs or copy the queue here.
