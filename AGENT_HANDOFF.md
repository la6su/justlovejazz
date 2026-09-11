# Resume checkpoint

Baseline: `d6e5665`, 2026-09-11. Recheck git status; this is a working-tree
checkpoint, not release evidence. Read AGENTS.md and [NEXT.md](NEXT.md).

## In progress

Nothing. The teardown-evidence slice is complete: the runtime-destroy
ownership boundary is pinned by Experience.destroyOwnership.test.ts, the dead
SceneCoordinator → ServicesStage terminal dispose is removed with the
ownership docs aligned to ServicesStageOwner.vue, the fresh-clone dev flow no
longer 500s without the prerender artifact, and Contact was re-verified in
the browser on the WebGLBackend path. NEXT.md teardown and allocation-audit
items are closed with dated evidence.

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
