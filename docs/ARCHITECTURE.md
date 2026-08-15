# Architecture

This document records current and target system boundaries that are easy to
miss when reading one module. Source, configuration and tests describe current
implementation details. The
[migration plan](MIGRATION_VUE_TRES.md) controls sequencing and
[ADRs](adr/README.md) record decisions.

## Migration state

The current production application is vanilla TypeScript plus Three.js and
UIkit. The accepted target is Vue 3, Vue Router, TresJS and a unified Three.js
`WebGPURenderer`. Target components in this document are planned until the
corresponding migration phase is accepted. The working current path remains
authoritative during transition.

```text
Current
index.html
  -> entry-shell.ts
  -> entry-app.ts
     -> Experience
        -> Renderer + World + UI

Target
index.html inline splash
  -> lazy Vue AppShell
     -> Vue Router + semantic route components
     -> UIkit lifecycle adapters
     -> persistent SceneHost/TresCanvas
        -> RendererFactory + RenderScheduler + UnifiedTSLPipeline
        -> WorldRoot + stable slots + lazy route scopes
```

Standalone blog pages currently share the brand without loading the 3D
runtime. The target SSG pipeline preserves that capability: adopting Vue does
not require hydrating TresJS or Three.js on content-only documents.

The development-only Page Builder remains a separate application under
`admin/`. Its production-safe schema, validation, renderer and compiler remain
under `src/builder/`; neither current nor target public builds import the editor
graph.

## Stable product invariants

- The inline splash paints before application, Vue, UIkit, TresJS and Three.js
  code. Enter is enabled only after renderer and initial-scene readiness;
  failure stays explicit and retryable.
- Semantic DOM is the interaction and accessibility layer. The single canvas
  is decorative and `aria-hidden`.
- The world retains six stable slots. Route identity does not redefine slot
  identity.
- `EnvSphere` owns the ambient background. The contact state owns the ground.
- Actual initialized backend determines renderer capability, DPR and post
  quality.
- One renderer-loop driver exists. After the Tres cutover, TresCanvas manual
  mode is the only code allowed to integrate with the renderer loop;
  `RenderScheduler` owns demand policy and requests frames through `advance()`.
  Settled idle performs no draw work and hidden tabs pause.
- Reduced-motion branches synchronously reach the authored final state and
  release render activity.
- Route resources, listeners, timers, async work and GPU allocations have one
  owner and one terminal cleanup path.
- UIkit remains the layout/component/accessibility baseline where retained;
  project styles express the 3D shell and authored compositions.
- No phase may weaken startup, frame-time, memory or delivery budgets merely
  to accommodate framework overhead.

## Routes and world slots

The current `router.ts` owns SPA rendering, translations, metadata and hash
restoration. The target typed route manifest becomes the single input for Vue
Router records, lazy components, metadata/i18n keys, menu links, SSG paths,
sitemap, route-scene loaders and initial hash/story commands.

The canonical slots are:

| Index | ID        | Product role     | Current owner                   | Target owner        |
| ----: | --------- | ---------------- | ------------------------------- | ------------------- |
|     0 | `lab`     | Contact finale   | `sections/lab*`                 | stable slot 0 scope |
|     1 | `intro`   | Story frame 1    | `sections/intro`                | stable slot 1 scope |
|     2 | `about`   | Story frame 2    | `sections/about`                | stable slot 2 scope |
|     3 | `works`   | Story frame 3    | `sections/works`                | stable slot 3 scope |
|     4 | `contact` | Story frame 4    | `sections/contact`              | stable slot 4 scope |
|     5 | `menu`    | Navigation sheet | `sections/menu`, `sections/nav` | stable slot 5 scope |

The public Contact finale intentionally occupies the runtime `lab` slot.
`/lab` is a separate route whose experiments load through isolated scopes.
`WorldConfig.ts` and `SplashCube.FACE_ROTATIONS` remain the current sources;
Phase 3 moves their shared facts into a framework-neutral readonly tuple.

`CinematicNav` currently owns four story frames plus Contact and Menu sheets.
The target `StoryController` accepts router/hash/input commands and publishes
one readonly story state to DOM and scene. Vue Router never scrolls the story
DOM independently of that controller.

## Current ownership

| Concern              | Current owner                                       |
| -------------------- | --------------------------------------------------- |
| Bootstrap            | `entry-shell.ts`, `entry-app.ts`                    |
| Routes and content   | `router.ts`, `pages/`, `sections/*/template.ts`     |
| Renderer and loop    | `Renderer.ts`, `RenderPipeline.ts`, `Experience.ts` |
| World composition    | `World.ts`, `WorldConfig.ts`, `SectionSceneFactory` |
| Navigation and UI    | `CinematicNav.ts`, `UIMenu.ts`, `UIManager.ts`      |
| Project presentation | `WorksPlaneStage.ts`, `FullscreenOverlay.ts`        |
| Contact presentation | `ContactTextStage.ts`, `PixelTextScreen.ts`         |
| Preferences/events   | `ThemeManager.ts`, `i18n.ts`, `EventBus.ts`         |

The current renderer initializes `WebGPURenderer` but replaces a
`WebGLBackend` or software WebGPU candidate with classic `WebGLRenderer`.
WebGPU uses the TSL post path; classic WebGL2 uses `ShaderMaterial` passes and a
compatibility nodes handler. This is factual current behavior, not the target
fallback described below.

`Experience._needsRender` combines demand rendering with bounded animation
reasons. Route replacement releases DOM behavior; `Experience.destroy()`
closes the shared runtime. `/works` and `/contact` own lazy scene stages that
dispose or cache according to their current measured policy.

## Target ownership

### Application and domain

- `app/` owns Vue bootstrap, AppShell, providers and Vue Router.
- `domain/` owns serializable route, slot, project and preference contracts and
  imports no Vue, TresJS, Three.js or browser globals.
- `features/` owns public DOM feature components and controllers.
- `ui/uikit/` contains lifecycle-safe adapters for retained UIkit behavior.
- `builder/` retains framework-neutral schema, validation, escaping and
  compilation; `admin/` becomes a Vue editor application.

Vue owns DOM structure. UIkit adapters initialize after mount and destroy
before unmount. UIkit does not imperatively replace Vue-owned subtrees, and
Vue does not add a competing focus trap to a UIkit-owned modal.

### Scene and renderer

- one persistent `SceneHost` owns the only Tres root for the public runtime;
- one renderer factory owns creation, initialization, backend inspection,
  software-adapter fallback and device-loss recovery;
- one framework-neutral render scheduler owns invalidation and bounded activity
  tokens, while the Tres manual-mode adapter is the sole renderer-loop driver;
- one TSL post graph covers WebGPUBackend and WebGLBackend;
- `WorldRoot` owns the stable six-slot containers;
- route scene scopes own abort/generation state and their GPU resources;
- temporary `scene/legacy/` adapters mount existing owners as primitives and
  name their removal phase.

Scene code does not query `document.body.dataset`, translations or router
state. Typed readonly ports carry route, locale, effective theme, reduced
motion and story progress into the scene. Scene code emits typed intents and
runtime failures; it does not mutate route DOM.

### Dependency direction

```text
domain
  <- app/providers <- features/UI
  <- scene ports   <- scene/Tres/Three

builder domain
  <- admin Vue editor
  <- trusted public component registry
```

Application UI and scene are siblings above the framework-neutral domain.
Neither imports the other's implementation. One manifest or contract replaces
each duplicated fact before the old copies are removed.

## Bootstrap and failure handling

The target bootstrap is an explicit state machine:

```text
shell-painted
  -> app-loading
  -> renderer-initializing
  -> scene-prewarming
  -> ready
  -> entered

any initialization state -> failed -> retry
```

The splash is not a Vue component. A retry disposes the incomplete renderer
attempt before creating a new one. `ready` is published only after the actual
backend, pipeline, camera and initial world are usable. Device loss allows one
bounded rebuild; a repeated failure returns to the explicit failure state.

## Renderer design

The target factory creates `WebGPURenderer`, awaits initialization, inspects
the actual backend and freezes a `RuntimeCapabilities` value. A synchronous
Tres renderer factory callback is not itself readiness evidence. The Phase 2
spike must prove either a pre-initialized renderer handoff or an explicit async
Tres lifecycle handshake before the target integration is selected. The
forced QA path uses `forceWebGL: true`. A software WebGPU adapter is not treated
as a successful premium path: its candidate is disposed and a forced
WebGLBackend renderer is created.

Capabilities record backend (`webgpu` or `webgl2`) separately from adapter
classification (`hardware`, `software` or `unknown`). Forced WebGL is evaluated
again; it is not assumed to be hardware. If both attempts are software or miss
the measured minimum tier, bootstrap enters an explicit degraded or failed
state instead of promising a premium path.

The unified TSL graph owns scene render, refraction, chromatic response, bloom,
grading, grain, vignette, border, fog and output color transform on both
backends. The classic renderer, nodes compatibility handler, GLSL post passes
and second PMREM WebGL context are removal targets, but remain until the
representative renderer gate proves their replacements.

Unstable backend inspection and Three.js compatibility casts are confined to
one adapter. Library versions are pinned as an officially supported and tested
Vue/TresJS/Three matrix. Upgrades occur in focused changes that run both
backend suites.

## Render scheduling

The scheduler uses typed invalidation and activity reasons rather than a set of
shared booleans. An owner acquires an activity token for a bounded animation
and releases it on completion or disposal. Frame tasks update only while their
owner is active. A frame is requested through the Tres manual-mode `advance()`
adapter only while dirty or active. The scheduler never calls
`renderer.setAnimationLoop` after Tres owns the canvas.

Phase 1 and the representative spike verify the exact Tres loop contract; the
target is manual mode with one `advance()` adapter. The current Experience loop
remains authoritative before the Tres cutover and is removed in the same slice
that activates that adapter. Vue reactivity may request invalidation but never
wraps or replaces the frame callback. Runtime assertions and diagnostics report
canvas count, loop-driver count, active reasons, draw count and p50/p95 frame
time.

## Resource lifecycle

Every route scene scope includes cancellation, a disposable registry and an
explicit policy:

- `ephemeral` — dispose on scope exit;
- `bounded-cache` — retain a measured fixed set for repeat navigation;
- `shared-refcounted` — dispose after the last owner releases it.

Late async results are disposed immediately. Vue unmount alone is insufficient
for GPU work; the scene scope closes first, then the component releases its
port. Shared resources are never implicitly disposed by a primitive adapter.

Migration acceptance includes twenty route cycles without monotonic growth in
canvas/context, listener, timer, texture, geometry, program or memory counts.

## Rendering and route-specific behavior

`/works` continues to own only its lazy case-plane stage; the shared cube does
not compete with case media. `/contact` continues to own its camera-local text
and model stages while semantic DOM supplies readable content and actions.
Locale and effective-theme updates arrive through typed ports. Route exit
closes the corresponding scope even if an async decode is still in progress.

## Events and preferences

The current typed `EventBus.ts` owns `jlz:webgl-ready`, `jlz:webgl-failed`,
`jlz:section-change` and `jlz:route-change` and bridges selected events to
window listeners. During migration it is the compatibility seam.

The target uses typed providers and ports for locale, theme mode/effective
polarity, sound, reduced motion, readiness, story and overlay state. The raw
window bridge is removed only after it has no consumers. A central store is not
required for the public app; the Page Builder may use one for transactional
editor state.

## Performance and dependency policy

- New dependencies require an explicit owner, current official compatibility
  evidence, a comparison with local code and a measured bundle/runtime cost.
- Prefer platform, Vue, TresJS and Three.js capabilities before adding helpers.
- Do not retain duplicate libraries or compatibility packages after cutover.
- Separate Vue, TresJS, Three.js and UIkit chunks/budgets so regression sources
  remain visible.
- Demand-driven idle, startup graph, frame time and memory/resource soak are
  release gates rather than post-migration cleanup.
- Removing code is part of each owner migration; a transition cannot finish
  with two routers, loops, post pipelines or state sources.

## Testing boundaries

- pure unit tests cover manifests, slot invariants, state machines, scheduler
  and resource policies;
- Vue component tests cover semantics, focus, locale/theme and UIkit wrappers;
- router tests cover history, direct entry and hash/story commands;
- renderer contract tests exercise automatic and forced backends and fail on
  GPU/material/device errors;
- visual QA enters through the splash before route capture;
- real hardware supplies performance and memory evidence that headless CI
  cannot prove.

## Editorial model

The site demonstrates the studio's capability. Routes use the rhythm
capability → problem → response → proof without becoming a repeated card
template. Works contains authored cases, Blog explains process, and Lab holds
isolated experiments. Framework migration does not change that product model.

## Non-goals

- Do not move the inline splash into Vue.
- Do not load the 3D runtime on content-only pages without product evidence.
- Do not replace UIkit JS, add a public global store or raise budgets as an
  implicit part of framework adoption.
- Do not rewrite all Three.js owners declaratively at once.
- Do not keep legacy and target implementations indefinitely for convenience.
