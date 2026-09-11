# Resume checkpoint

Baseline: the docs-closure PR head on `feature/docs-transition-closure`,
2026-09-11. Recheck git status; this is a working-tree checkpoint, not
release evidence. Read AGENTS.md and [NEXT.md](NEXT.md).

## In progress

Nothing. The documentation closure pass landed: the Tres transition record is
re-issued as a frozen completion record with the Services ownership row
corrected and dead links fixed, ARCHITECTURE.md contracts match the code,
DEVELOPMENT.md prose is repaired and documents the ?force-webgl-backend=1
seam, PAGE_BUILDER.md describes the shipped multi-document model, and
migration-era process framing is retired from CONTRIBUTING/AGENTS/BRAND. A
full documentation audit found no remaining blocker for the completed
Vue/Tres transition.

## Next task

Two queue items, in order. First the dated one: the ADR 0008 review (due
2026-09-15) — generate a fresh import-closure bundle breakdown on current
HEAD and append the dated review note to the ADR. Then NEXT.md item 1:
design the Showreel→Works media contract before touching code — start by
reading src/Experience/World/ShowreelTheater.ts, src/UI/FullscreenOverlay.ts
and src/UI/ShowreelConsole.ts. Every open item's detailed plan (open
questions, slices, acceptance, decision owner) lives inline in NEXT.md. One
reviewable outcome, then the full release gate.

## Resume protocol

One task, targeted source reads, focused checks, then a short result.
Use [DEVELOPMENT.md](docs/DEVELOPMENT.md) for release commands.
After delivery replace this checkpoint with the next unfinished task and its
exact state; do not append session logs or copy the queue here.
