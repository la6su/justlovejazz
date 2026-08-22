# AGENTS — project context

JUSTLOVEJAZZ is a Vite + TypeScript 3D portfolio built with Vue 3, Vue Router
and TresJS over one Three.js `WebGPURenderer` (TSL NodeMaterials, UIkit 3,
Bun). The renderer runs `WebGPUBackend` when hardware WebGPU is usable and
`WebGLBackend` through the automatic software-adapter policy; the classic
`WebGLRenderer` path was removed in Phase 10 (2026-08-22). The phased
transition that shipped this topology and its ADRs are recorded in
[docs/MIGRATION_VUE_TRES.md](docs/MIGRATION_VUE_TRES.md). Product copy is
Russian/English; code, commits and technical documentation are English.

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
- Visual QA passes the splash through its Enter control before capturing a
  route screenshot. Capture the splash itself only when it is the subject.
- The world retains the canonical six-slot model described in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). `EnvSphere` owns the ambient
  background, while the ground plane belongs to the contact state.
- Reduced-motion paths settle authored animation synchronously so render
  demand also settles.
- UIkit provides the component, layout and accessibility baseline. Bespoke
  styles express the 3D shell and project-specific compositions.
- The router owns translations and page metadata. Semantic DOM remains the
  interaction and accessibility layer over the shared scene.
- There is exactly one canvas, renderer and animation-loop owner. Vue owns
  semantic DOM, TresJS owns scene composition and GPU resources retain one
  explicit disposal owner.
- `WebGPURenderer` is the only constructed renderer class: `WebGPUBackend`
  when hardware WebGPU is usable, otherwise the same class is re-created with
  `forceWebGL: true` on `WebGLBackend` (the automatic software-adapter
  policy). Never claim unified backend parity between the two backends.
- All `jlz:*` application events flow through the typed `eventBus`
  (`AppEvents` map); non-module producers (the inline splash script, e2e and
  soak scripts) use the `window.__jlzEmit` facade.
- The splash stays outside the Vue mount and initial Vue/Tres/Three/UIkit
  dependency graph. Scene code receives typed route and preference state; it
  does not infer application state from DOM datasets in the target design.

## Context on demand

- [NEXT.md](NEXT.md) — open product outcomes.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — stable boundaries and
  non-obvious runtime contracts.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — setup, checks and budgets.
- [docs/BRAND.md](docs/BRAND.md) — visual and editorial direction.
- [docs/MIGRATION_VUE_TRES.md](docs/MIGRATION_VUE_TRES.md) — phased migration,
  gates, rollback points and removal ledger.
- [docs/adr/README.md](docs/adr/README.md) — accepted and proposed architecture
  decisions.
- [skills/justlovejazz-ui/SKILL.md](skills/justlovejazz-ui/SKILL.md) — load for
  UI, Less, theme, accessibility or visual QA work.
- [skills/uikit3/SKILL.md](skills/uikit3/SKILL.md) — load for UIKit 3
  component/Less contracts, the page-builder reference (catalogue,
  inspector, preview, generated theme) or yotheme.pro editor-pattern work.
- [skills/justlovejazz-release/SKILL.md](skills/justlovejazz-release/SKILL.md) —
  load when preparing a commit, push or pull request.

## Delivery

Inspect `git status --short`, understand the relevant owners, implement the
smallest complete slice and verify it in proportion to its risk. The full
local gate is the release check, not a prerequisite for every documentation
edit. Publishing uses a scoped non-default branch and a pull request; commit
messages follow Conventional Commits.

Keep active work in `NEXT.md`. Migration changes implement one phase or bounded
owner slice at a time, keep the application runnable and update the migration
traceability/removal ledgers in the same change. After completing an outcome,
remove it from `NEXT.md`, capture discovered follow-up work and reorder the
remainder when evidence changes priority. Durable released behavior belongs in
source, tests, ADRs and the changelog; session-by-session narration is
unnecessary.
