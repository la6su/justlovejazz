# AGENTS — project context

JUSTLOVEJAZZ is a Vite + TypeScript 3D portfolio built with Three.js TSL,
WebGPU/WebGL2 fallback, UIkit 3 and Bun. Product copy is Russian/English; code,
commits and technical documentation are English.

## Working principle

Treat current source, configuration and tests as the primary context. Follow
the owners and patterns already present in the code, and load supporting
documentation only when the task touches its subject. Preserve unrelated work
in a dirty tree and keep each change to one coherent outcome.

## Project-specific design

- The renderer uses TSL NodeMaterials and `renderer.setAnimationLoop`.
  Capability, DPR and post-processing follow the backend that was actually
  created. Rendering stays demand-driven, and each owner releases its
  listeners, timers, DOM and GPU resources.
- `index.html` owns the early splash. Entry becomes available when the shared
  bootstrap reports `jlz:webgl-ready`; failure remains an explicit state.
- The world retains the canonical six-slot model described in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). `EnvSphere` owns the ambient
  background, while the ground plane belongs to the contact state.
- Reduced-motion paths settle authored animation synchronously so render
  demand also settles.
- UIkit provides the component, layout and accessibility baseline. Bespoke
  styles express the 3D shell and project-specific compositions.
- The router owns translations and page metadata. Semantic DOM remains the
  interaction and accessibility layer over the shared scene.

## Context on demand

- [NEXT.md](NEXT.md) — open product outcomes.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stable boundaries and
  non-obvious runtime contracts.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — setup, checks and budgets.
- [docs/BRAND.md](docs/BRAND.md) — visual and editorial direction.
- [skills/justlovejazz-ui/SKILL.md](skills/justlovejazz-ui/SKILL.md) — load for
  UI, Less, theme, accessibility or visual QA work.
- [skills/justlovejazz-release/SKILL.md](skills/justlovejazz-release/SKILL.md) —
  load when preparing a commit, push or pull request.

## Delivery

Inspect `git status --short`, understand the relevant owners, implement the
smallest complete slice and verify it in proportion to its risk. The full
local gate is the release check, not a prerequisite for every documentation
edit. Publishing uses a scoped non-default branch and a pull request; commit
messages follow Conventional Commits.

Keep active work in `NEXT.md`. After completing a planned outcome, update
`NEXT.md` in the same change: remove the completed item, capture newly
discovered follow-up work and reorder the remainder when evidence changes its
priority. Durable released behavior belongs in source, tests and the changelog;
session-by-session narration is unnecessary.
