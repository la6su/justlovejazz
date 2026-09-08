# Resume checkpoint

Baseline: `ff9a12c5`, 2026-09-08. Recheck git status; this is a working-tree
checkpoint, not release evidence. Read AGENTS.md and [NEXT.md](NEXT.md);
do not reread the full chat or migration archive.

## In progress

Flat-menu changes are uncommitted in:

- src/app/views/NavMenu.vue
- src/app/menuLifecycle.ts
- src/**tests**/navTemplate.lifecycle.test.ts
- tests/e2e.spec.ts

Preserve these edits. Previous checks: 705 unit tests and both type checks
passed. Actual menu-click browser verification is still pending. Start with
the first task in NEXT.md; it defines remaining behavior and acceptance.

Documentation consolidation is also uncommitted. It corrects the Services
declarative claim and separates historical evidence from current guarantees.
Runtime ownership and evidence limits are in
[the transition status](docs/TRES_FULL_TRANSITION.md).

## Resume protocol

One task, targeted source reads, focused checks, then a short result.
Use [DEVELOPMENT.md](docs/DEVELOPMENT.md) for release commands.
After delivery replace this checkpoint with the next unfinished task and its
exact state; do not append session logs or copy the queue here.
