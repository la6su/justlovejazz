# Architecture decision records

ADRs record durable decisions and their status. They explain why the system is
changing; [../ARCHITECTURE.md](../ARCHITECTURE.md) describes the resulting
system and [../archive/MIGRATION_VUE_TRES.md](../archive/MIGRATION_VUE_TRES.md)
records the completed execution history.

| ADR                                            | Status              | Decision                                             |
| ---------------------------------------------- | ------------------- | ---------------------------------------------------- |
| [0001](0001-adopt-vue-application-platform.md) | Accepted            | Vue 3 and Vue Router become the application platform |
| [0002](0002-adopt-tresjs-scene-composition.md) | Accepted with gates | TresJS becomes the target scene-composition layer    |
| [0003](0003-unify-webgpu-webgl2-renderer.md)   | Proposed            | One WebGPURenderer targets WebGPU and WebGL2         |
| [0004](0004-preserve-demand-rendering.md)      | Accepted with gates | Preserve one demand-driven render scheduler          |
| [0005](0005-integrate-uikit-with-vue.md)       | Accepted            | Keep UIkit behind Vue lifecycle adapters             |
| [0006](0006-use-incremental-migration.md)      | Accepted            | Migrate through reversible vertical slices           |
| [0007](0007-unify-brand-token-system.md)       | Accepted            | One Neon Stage identity and one brand token chain    |
| [0008](0008-three-delivery-budget.md)          | Accepted with gate  | Keep Three.js delivery budget evidence-gated         |
| [0009](0009-use-webgpu-three-compat-entry.md)  | Accepted with gates | Route bare Three imports through the WebGPU entry     |

`Proposed` decisions cannot remove a working production path. Change an ADR's
status with a superseding decision; do not rewrite its original context after
implementation begins.

`Accepted with gates` means the strategic direction is accepted, while
production ownership remains blocked until the named compatibility,
performance and lifecycle gates pass.
