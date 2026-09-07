# TresJS post-migration audit

## Scope

This audit removes code only when source, imports and runtime contracts prove
it is retired. The production topology remains one persistent `TresCanvas`,
one `WebGPURenderer`, one `RenderScheduler` loop owner and one explicit GPU
disposal owner per resource.

## Completed

- The retired `sections/nav/template.ts` string renderer duplicated the Vue
  `NavMenu` markup and navigation data, but no production import consumed its
  renderer. Its only live behavior was moved into `app/menuLifecycle.ts`.
  Lifecycle bindings are now scoped to the active route root rather than the
  document-level legacy `#spa-content` lookup.
- `three-webgpu-compat.ts` remains required by the installed `@tresjs/core`
  5.8.3 distribution: it statically imports and checks `WebGLRenderer` from
  bare `three` even when the application injects its custom renderer. This is
  a dependency compatibility seam, not removable dead code.
- Stale comments that described already-removed World adapters now document
  the current `SceneCoordinator` and declarative-node ownership boundaries.
- `WorksPlaneStage.prewarmShaders()` was an unused public no-op retained after
  an unsuccessful historical `compileAsync` experiment. The real first-render
  compilation path is unchanged; the dead API and its renderer type dependency
  are removed.
- `RenderPipeline.resize()` was another empty compatibility hook. Renderer
  sizing already owns the canvas and the TSL graph has no resize state, so the
  method and its lone call were removed.
- Bootstrap comments and renderer sizing comments were reconciled with the
  current owners: `entry-app.ts` drives the typed state machine, while Vue's
  `SceneHost` owns the canvas element.
- The current architecture table still named the deleted menu template and
  lifecycle function; those references now point to `app/navItems.ts` and
  `initMenuLifecycle()`.
- The same document retained the deleted `WorkCards` registry and menu
  template adapter as current owners; the ownership section now describes the
  live `NavMenu.vue`/`menuLifecycle.ts` boundary.
- The `Experience.destroy()` → `SceneCoordinator.dispose()` →
  `SectionGroups.dispose()` chain was traced for the shared scene owners.
  `SectionGroups` removes BakuCarousel and particle subtrees from its generic
  sweep, while lazy stages remain Experience-owned; no duplicate GPU disposal
  or unowned stage was proven, so no runtime change was made.
- `useJlzPage` still named its live disposer `disposeMenuToolbar` after the
  retired template API. The variable and comment now use
  `disposeMenuLifecycle`; behavior is unchanged and the route lifecycle tests
  remain green.
- `src/sections/lab-overlay/template.ts` had no production import: its
  `labOverlaySection()` output was fully replaced by `ContactFooter.vue`.
  The dead template and its three EN/RU-only `labOverlay.*` keys were removed;
  the canonical `lab` route identifier remains intact.
- The remaining HTML template helpers in `sections/_shared/constants.ts`
  (`sectionShell`, `homeTop`, `contentTop`, `storyBottom`, `i18nDesc`,
  `descBlock`, `serviceExplore`) were referenced only by their legacy unit
  fixture and had no runtime imports after the Vue route migration. The file
  now retains only the shared `PageId` type, and the obsolete template fixture
  was removed.
- A remaining scene comment still referred to a non-existent `template.ts`;
  it now names the Vue route view as the semantic DOM owner.
- Route SFC headers and the cinematic navigation comment still named deleted
  string-template source paths; they now describe the former source without
  advertising files that no longer exist.

## Audit queue

1. Reduce renderer-boundary declaration gaps (`any` warnings) only when a
   narrow Three.js type exists in the installed r185 declarations.
2. Repeat the physical WebGL device-loss gate on a browser/driver that can
   restore its framebuffer. This remains an environment blocker, not a reason
   to weaken the recovery path.

The imperative owner pass is complete for `WorksPlaneStage`,
`WorksInstallation`, `BakuCarousel`, `EnvSphere`, `SplashCube`, and the lazy
route stages. Call-graph and lifecycle evidence found no duplicate GPU owner
or unowned disposal path, so no speculative registry or ownership rewrite is
admitted.

## Declaration warning disposition

The remaining renderer/TSL warnings are concentrated in runtime Proxy and
uniform-node surfaces where Three r185 declarations do not expose the methods
used by the installed TSL implementation. They are not evidence of dead code:
the affected stages are live and covered by lifecycle tests. They remain queued
for narrow adapters only when the adapter can preserve the exact node shape.

The current verification baseline is 108 unit files / 692 tests, Vue
type-check green, and ESLint with 0 errors / 31 warnings. The warnings remain
limited to documented TSL node casts, one renderer recovery adapter, and an
intentional bootstrap diagnostic log; none indicates an unreferenced module.
The production build also passes after removing the template layers; the only
reported bundle notice is the pre-existing Three.js vendor chunk size warning.

## Guardrails

- Do not replace `RenderScheduler` with Tres `advance()` or `invalidate()`:
  the installed 5.8.3 loop contract proves they do not progress after its RAF
  is stopped.
- Do not remove `three-webgpu-compat` or create a second renderer/canvas/loop.
- Preserve reduced-motion settlement, typed event bus and route-state ports.
