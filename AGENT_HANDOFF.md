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

NEXT.md item 1: generalize the Showreel shader theater transition for Works
case media. The shared DOM FullscreenOverlay owns case presentation and
Escape; the GPU shader transition remains ShowreelTheater-specific until its
still-image media contract and metadata handoff are designed. Start by
reading src/Experience/World/ShowreelTheater.ts, src/UI/FullscreenOverlay.ts
and src/UI/ShowreelConsole.ts; design the media contract before touching
code. One reviewable outcome, then the full release gate.

## Resume protocol

One task, targeted source reads, focused checks, then a short result.
Use [DEVELOPMENT.md](docs/DEVELOPMENT.md) for release commands.
After delivery replace this checkpoint with the next unfinished task and its
exact state; do not append session logs or copy the queue here.
