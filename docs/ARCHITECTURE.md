# Architecture

## Runtime and bootstrap

```text
index.html inline splash → entry-shell.ts → entry-app.ts
  → app/AppShell.vue + app/index.ts (Vue Router mount) + semantic app/views/
  → persistent app/SceneHost.vue / TresCanvas
    → core/unifiedRenderer.ts → Experience/Renderer.ts
    → core/RenderScheduler.ts → core/RenderPipeline.ts
    → Experience/Scene/ + Experience/World/ + app/scene/
```

The splash stays outside the initial Vue/Tres/Three/UIkit graph. Bootstrap
states live in `core/bootstrapStates.ts`: shell-painted, app-loading,
renderer-initializing, scene-prewarming, ready, entered or failed.
`jlz:webgl-ready` follows a usable initial scene and successful rendering,
not merely the synchronous Tres renderer factory. Enter unlocks the route.
Concurrent starts share an attempt; retry cancels its bindings and late work.
Retry after importing the one-shot SceneHost bridge is terminal rather than
creating a second host. `window.__jlzHost` exposes backend/recovery facts for QA.

Blog and approved builder documents are standalone SSG HTML without the app
or scene runtime. `admin/` is a separate dev-only editor.

## Ownership and dependency direction

All paths below are relative to `src/`. Framework-neutral `core/` contracts
sit below Vue views, DOM controllers and scene owners. Typed ports connect
these layers; scene state must not be inferred from DOM datasets.

| Concern                             | Source owners                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route paths and views               | `core/routeManifest.ts` (paths + the `PageId` vocabulary), `app/routes.ts`, `app/index.ts` (router mount), `app/views/`                                                                                                                                                                                                                                                               |
| Route state and deferred navigation | `core/routePage.ts`, `core/routeContinuation.ts`                                                                                                                                                                                                                                                                                                                                      |
| Locale and route metadata           | `core/i18n.ts`, `core/pageMeta.ts`, `core/pageMetaData.ts`                                                                                                                                                                                                                                                                                                                            |
| Blog and sitemap                    | `core/blogPages.ts`, `blogContent.ts`, `blogMeta.ts`, `sitemap.ts`, `sitemapEntries.ts`; `content/blog/` at repository root                                                                                                                                                                                                                                                           |
| Project data and case resolution    | `Data/Projects.ts`, `Data/CaseStudies.ts`, `core/caseStudies.ts`, `core/worksExperience.ts`                                                                                                                                                                                                                                                                                           |
| Theme, sound and motion             | `core/ThemeManager.ts`, `brandTokens.ts`, `SfxSystem.ts`, `motionPolicy.ts`                                                                                                                                                                                                                                                                                                           |
| Typed app events                    | `core/EventBus.ts` (`AppEvents`); `window.__jlzEmit` for non-module producers                                                                                                                                                                                                                                                                                                         |
| Semantic route lifecycle / UIkit    | `app/useJlzPage.ts`, `app/menuLifecycle.ts`, `UI/UIMenu.ts`                                                                                                                                                                                                                                                                                                                           |
| Story navigation and snapshots      | `UI/CinematicNav.ts`, `core/storyState.ts`, `core/storyProgress.ts`                                                                                                                                                                                                                                                                                                                   |
| Renderer factory, policy, recovery  | `core/unifiedRenderer.ts`, `core/rendererBackend.ts`, `Experience/Renderer.ts`, `app/sceneHost.ts`                                                                                                                                                                                                                                                                                    |
| Demand and timing                   | `core/RenderScheduler.ts`, `renderDemand.ts`, `FrameTiming.ts`, `FrameGapStats.ts`, `Experience/FpsTracker.ts`                                                                                                                                                                                                                                                                        |
| Device quality and diagnostics      | `core/DeviceCapability.ts`, `RuntimeResourceSnapshot.ts`, `DevPanel.ts`                                                                                                                                                                                                                                                                                                               |
| Scene coordination and slots        | `Experience/SectionStateMachine.ts` (scroll story state), `Experience/SceneTransformPass.ts` (pooled scroll transform), `Experience/SceneFramePass.ts` (demand-gated owner fan-out), `Experience/SceneCoordinator.ts` (delegates + owner read surface), `Experience/sceneOwners.ts` (owner-bag contract), `Experience/Scene/SectionGroups.ts`, `core/WorldConfig.ts`, `worldSlots.ts` |
| Scene render modes and IBL          | `Experience/ShowreelController.ts` (showreel render swap over `World/ShowreelTheater.ts`), `Experience/SceneEnvironment.ts` (procedural PMREM owner)                                                                                                                                                                                                                                  |
| Post graph and tone mapping         | `core/RenderPipeline.ts`, `WebGPUPostPipeline.ts`, `PostProcessingManager.ts`, `toneMappingGuard.ts`                                                                                                                                                                                                                                                                                  |
| Async stages and disposal helpers   | `Experience/LazyStage.ts` (lifecycle core), `Experience/StageRegistry.ts` (the six route stages' contracts + lifecycle owner), `app/stageSlot.ts` + `app/sceneHost.ts` ports (declarative stage mount surface), `Utils/dispose.ts`                                                                                                                                                    |

The table maps boundaries, not every implementation detail. Owner-specific
regressions belong in `src/__tests__/`, not a second prose inventory.

## Routes and world slots

`routeManifest.ts` owns the six top-level SPA paths and the closed `PageId`
vocabulary (formerly in the removed `src/sections/_shared/constants.ts`). `app/routes.ts` adds
`/works/:projectId`; `core/caseStudies.ts` resolves project data. Metadata,
blog paths and builder publishing have their own typed sources listed above.
Vue Router owns history; `CinematicNav` owns story scrolling and sheets.
Hash commands use the cancellable route continuation, not a second scroll owner.

`core/worldSlots.ts` owns stable slot order, ranges, anchors and cube rotations:

| Index | ID        | Role             |
| ----: | --------- | ---------------- |
|     0 | `lab`     | Contact finale   |
|     1 | `intro`   | Story frame 1    |
|     2 | `about`   | Story frame 2    |
|     3 | `works`   | Story frame 3    |
|     4 | `contact` | Story frame 4    |
|     5 | `menu`    | Navigation sheet |

Slot 0's Contact role is intentional; `/lab` is a separate route.
`EnvSphere` owns the ambient background; ground belongs to the Contact state.

## Renderer and scheduling

`SceneHost` owns the scene canvas and supplies the custom `WebGPURenderer`
factory. Inspect the initialized backend: a confirmed software WebGPU adapter
causes same-class recreation with `forceWebGL: true`; unknown adapter metadata
stays unknown. No classic renderer is constructed. SceneHost and Renderer use
consistent DPR caps; device recovery replaces both the Tres context instance
and the host's live-renderer reference.

Non-low WebGPU uses the TSL post graph. WebGLBackend directly renders the
node-material scene, without that post graph; its draw path temporarily clears
fog and restores shared state afterwards. Post processing restores tone mapping
even on failure. Backend equivalence must not be inferred from class identity.

Tres uses `on-demand` mode, and the persistent Tres loop is the one RAF host
(ADR 0005). `RenderScheduler` owns bounded activity windows on that loop
through the `SceneLoopPort` (SceneHost bridge): it starts the loop on typed
invalidation and pauses it when settled or hidden, so idle tabs run zero RAF
ticks. The scheduler's frame callback runs inside Tres's before-render hooks,
so `useLoop` subscribers — Cientos components included — share the loop and
drive windows through ecosystem `invalidate()` calls, which the bridge
translates into typed `external` demands. The render STEP stays on the
Experience pipeline: SceneHost replaces Tres's default render function
(public `replaceRenderFunction` / `useLoop().render` seam) with a
frame-accounting delegate, so a Tres tick can never double-render behind the
pipeline's back. Owners declare activity through `renderDemand.ts`; no scene
owner starts a competing RAF loop. Reduced motion settles transitions and
releases demand synchronously, including live preference changes. Visible
continuous effects may keep demand active. State-only updates must not
advance animation clocks without a presented frame.

Declarative scene nodes report themselves through `app/readySlot.ts` slots
(live value + one-shot promise); `onReady` awaits them and resolves the
bridge.

Recovery and async setup are generation-guarded. Failed replacement owners are
disposed; terminal renderer failure prevents later invalidation from reviving
the loop and emits `jlz:webgl-failed`.

## Scene resources and teardown

- Camera, lights, ground and section roots are declarative nodes adopted by
  controllers. Borrowed nodes/materials must not acquire a second disposer.
- `app/scene/EnvSphereOwner.vue` and `ServicesStageOwner.vue` own terminal
  disposal of those classes. Services geometry and the EnvSky leaf are
  declarative; EnvSky borrows the pavilion material.
- Works installation geometry is declarative; its controller owns shared
  NodeMaterials and authored state. Works cards/textures remain imperative.
- All six route-owned lazy stages (works plane, contact typography/cyprus/
  halo, manifesto ink, the Lab object) mount through `<primitive>` stage
  slots with class-owned materials and disposal. Other authored/asset owners
  remain imperative where that is the current boundary; a Vue wrapper does
  not imply declarative geometry.
- `LazyStage` guards requests before construction, attachment and loading.
  Route exit invalidates pending work; late results release their resources.
  Shared textures and planes release through their refcount owners.
- `Experience.destroy()` closes runtime-owned listeners, timers, stages,
  scheduler and environment. Vue-owned stages finish at host unmount.
  Runtime destroy and Vue root unmount are distinct checks; renderer disposal
  is idempotent across teardown orders. See `Experience.destroyOwnership.test.ts`.

## Delivery decisions

`vite.config.ts` aliases bare `three` to `three-webgpu-compat.ts` and the
`three-stdlib` barrel to `three-stdlib-compat.ts` (the 28-module re-export
shim covering exactly what the Cientos bundle references; guarded by the
`check:stdlib` release gate). TresJS's static default-renderer import
otherwise retains the classic runtime; the throwing `WebGLRenderer` symbol
is a required package integration seam, and the compat entry additionally
provides the classic-only symbols the stdlib deep modules read. Preserve
official package subpaths. Remove the seams only when an equivalent
upstream entry passes delivery and lifecycle checks.

Ecosystem adoption is audited, not assumed. Cientos is raster-era in large
parts: components built on classic `shaderMaterial`/`WebGLCubeRenderTarget`
cannot run on this WebGPU/TSL pipeline. The 2026-09-27 parity audit
(Inspection 10) verified every overlap surface and adopted nothing new:
`Sparkles`/`Precipitation` are raster shaders behind an authored TSL-native
`JunniParticles`; `Environment` needs renderer-native PMREM
(`isPMREMTexture` pass-through) that preset HDRIs cannot produce; `Html` has
no consumer surface (Vue owns semantic DOM by design); `useProgress` mutates
module-global `DefaultLoadingManager` state behind a milestone splash that
owns its own choreography; `useTexture`/`useGLTF`/`useAnimations` need Vue
setup context and would weaken the refcounted cache and lazy-stage
contracts. The standing rule for any future adoption is the #228 model:
lazy chunk, stdlib-shim entry, eval-safety review, no new eager imports.

The bounded loop was originally driven through the renderer's
`setAnimationLoop` because Tres's manual `advance()` path kept idle RAF work.
ADR 0005 (2026-09-25) moved the driver onto the Tres loop itself while keeping
the bounded-window policy: `@tresjs/core` 5.9.0 exposes the public
`replaceRenderFunction` seam, so the pipeline owns the render step, the
scheduler owns start/stop, and the ecosystem (`useLoop`, Cientos) works
unmodified. The renderer's `setAnimationLoop` boundary is deleted; terminal
device-loss failure closes the loop window through `jlz:webgl-failed`.
Hybrid scene ownership is deliberate: declarative leaves coexist with
imperative animation/resource controllers. The mount boundary keeps moving
toward the declarative side (all six lazy stages now enter through host
ports; the boot-static owners are queued in NEXT), while TSL material
graphs, the demand loop and animation controllers stay imperative by
design. Budget values and checks live in [Development](DEVELOPMENT.md).

## Media and semantic UI

Vue owns copy, focus, accessibility and route DOM; the scene canvas is
`aria-hidden`. UIkit lifecycle bindings initialize and dispose with their owner.
Typed route/preference/story ports feed both DOM controllers and scene code.

`WorksPlaneStage` and `WorksInstallation` present the active work;
`UI/FullscreenOverlay.ts` owns fullscreen presentation and Escape.
`Experience/ShowreelController.ts` owns the showreel render mode — the lazy
`Experience/World/ShowreelTheater.ts` swaps a private video-quad scene
at the shared render call; it loads the film on first open. `ShowreelConsole`
provides DOM controls over typed events. The shared case/showreel contract is part
of the spatial-transition slice in [NEXT](../NEXT.md).
