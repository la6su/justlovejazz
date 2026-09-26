# Inspection log

Dated audit record (like evidence, not a queue): successive inspection
entries below; the latest entry reflects current architecture, earlier
ones are history and carry superseded markers where a later decision
reversed them.

Inspection 1 is a test-suite review for "tests for the sake of tests"
plus a redundancy/overengineering pass over the runtime modules,
requested by the user. Scope: main @ 887443c + engineering-slices
working tree. Method: per-file metrics (lines / tests /
expects / mocks) over all 112 unit files, full reads of the smallest and
mock-heaviest files, dead-export scan over `src/core`, `src/UI`,
`src/Utils` cross-referenced against production, test and script
consumers, and consumer checks for every suspect module.

## Actions taken (same commit as this file)

Removed production API that nothing but its own test consumed, and the
tests that existed only to exercise it:

- `routePage.isCurrentPage` — dead convenience predicate (production reads
  `getCurrentPage()`); its test mirrored "the former dataset equality
  reads", i.e. a removed implementation. Function + test deleted.
- `worldSlots.WORLD_SLOT_IDS` / `worldSlotById` / `isWorldSlotId` — no
  production importer (production uses `WORLD_SLOTS`, `worldSlotAt`,
  `worldSlotIndex`, `WORLD_SLOT_COUNT`). The invariant tests now assert
  through those production-owned lookups; the "lookup by id round-trips
  every slot" test was redundant with the strict-index-lookup tests and
  was deleted.
- `brandTokens.BRAND_TOKEN_NAMES` — no production consumer; the Less-parity
  test now derives the names from `BRAND_TOKENS` locally.
- `storyState.StoryState` — interface referenced by no production code
  (`CinematicNav` consumes the pure functions + `StorySide` only); the
  "story state shape" test only re-combined two already-tested pure
  functions to satisfy it. Interface + test deleted.

Deduplicated test scaffolding (no coverage change):

- The identical manual-loop renderer double and jsdom pointer-capture
  shims existed in 9 declarative `TresCanvas` test files. Single source
  now: `src/__tests__/tresHarness.ts` (`createRendererMock`,
  `installCanvasPointerShims`). Net ≈ −170 lines.

Suite delta: 695 → 692 tests, all 112 files green; `tsc`, `vue-tsc`,
`eslint` (0 errors), `prettier` clean.

## Checked and found sound

- No tautological or mock-only tests found. The mock-heavy files
  (`SceneCoordinator.motionParity`, `ExperienceUI.lifecycle`,
  `Experience.rendererRecovery`, `Experience.destroyOwnership`) assert
  documented contracts: reduced-motion gating, demand-driven updates,
  once-per-pass owner snapshots, disposal ownership.
- Paired test files are layered, not duplicated: `*.test.ts` (Vue
  declarative mount) vs `*.lifecycle.test.ts` (class contract) cover
  different owners of the same object (GroundPlane, CinematicLights,
  WorksStageOwner etc.).
- Per-stage lifecycle tests assert each class's own disposal
  implementation (shared-geometry release, borrowed materials, uniform
  isolation, late-call immunity) — not the shared `LazyStage` mechanics,
  which have their own dedicated suite.
- No dead runtime modules: every flagged module has production consumers
  (`FrameGapStats`, `RuntimeResourceSnapshot` → DevPanel/renderer
  diagnostics required by the phase7 evidence gates; `toneMappingGuard`
  → both post pipelines; `routeContinuation`, `worksExperience`,
  `worldSlots`, `types.ts`, `UIManager` — all consumed).
- Exports flagged as "tests-only" but used inside their own module
  (e.g. `makeRendererDisposeIdempotent`, `canTransition`, `escapeXml`,
  `supportsPostProcessing`, `BRAND_TOKEN_PREFIX`) are the
  exported-for-testing pattern, kept deliberately.

## Observations left open (no action, recorded honestly)

- `Experience.ts` (~88 KB) remains a god-class owner. Splitting it is an
  architectural project, not hygiene; AGENTS preserves the current
  architecture and the migration audit found its ownership contracts
  sound. Revisit only if a concrete defect or the NEXT queue demands it.
- `docs/evidence/` payloads accumulate historical reports (~40 phase7
  JSON files). They are preserved by protocol; if growth becomes a
  problem, an archival decision belongs to the user, not a cleanup PR.
- The 2026-09-17 audit already closed the earlier duplication findings;
  this pass found no new dead files or duplicate GPU owners.

## Inspection 2 — 2026-09-25, post-remake contract drift audit

Trigger: user decision "fonts must be self-hosted, updated for the new
splash" plus "current contracts may be imperfect — rewrite them following
Vue/TresJS best practices". Method: diff of the preloader remake commit
(`887443c`) against its parent (`9e2f3ea`) across `index.html`,
`src/entry-app.ts`, the build pipeline and the untouched e2e spec; local
full e2e run (chromium headless) before and after fixes.

### Real defects found (all fixed in the same PR)

- **Prerender injection silently broken.** The remake replaced
  `<div id="app"></div>` with `<main id="app"></main>`, but
  `vite.config.ts` `prerender-index` injects via a literal
  `html.replace('<div id="app"></div>', …)` — the replace became a no-op,
  so production builds shipped an empty `#app` with no prerendered home
  shell (SEO + no-scene contract lost) with no build error. Restored the
  neutral `div`; also removes the nested `<main>` landmark (the route SFCs
  own `<main id="spa-content">`) — two landmarks is an a11y anti-pattern.
- **Enter button never activatable.** `showEnterButton()` added the
  `is-ready` class but never flipped `aria-disabled="true"` → `"false"`
  (index.html ships the attribute as `true`). Screen readers announced a
  permanently disabled Enter, and Playwright actionability blocked every
  splash→Enter e2e test. Fixed at the owner (`entry-app.ts`).
- **Route announcer lost `aria-atomic="true"`** in the remake's markup
  rewrite; live-region contract (old markup, e2e, `useJlzPage` owner)
  restored.
- **Splash controls below the 44 px touch-target contract** on mobile
  (38×32 px, no mobile override). Restored 44×44 + `min-width: 44px` in
  the ≤700 px media query (WCAG 2.5.5; mirrors the pre-remake rule).
- **Fonts drifted to Google CDN.** The repo already owns the full
  self-hosting set (`/fonts/commissioner.css` variable build + JBM woff2
  subsets, OFL files, immutable `/fonts/*` cache headers, e2e contract).
  The new splash actually needs self-hosting more than the old one: it
  renders `font-weight: 650` (a variable axis the static CDN build
  synthesizes) before JS boots. Restored the self-hosted pair of
  stylesheets and added the Commissioner variable preload (the JBM latin
  preload was already present); e2e contract extended with a
  `fonts.googleapis.com` negative assertion.

### e2e contract rewritten to the intended (new) behavior

- Skip link target: `#section-intro` → `#app`. The old target only exists
  on the prerendered home; `#app` exists on every route before and after
  boot, which is the more robust skip contract. Test renamed/retargeted
  rather than reverting the product markup.

### Checked and found sound (no refactor made, deliberately)

- The Vue/TresJS contract layer already follows the framework's best
  practices: persistent `SceneHost` outside `RouterView` (single
  canvas/renderer/camera/scene owner), `render-mode="on-demand"` with the
  internal loop stopped in favor of `RenderScheduler` (superseded
  2026-09-25 by #224 / ADR 0005: the persistent Tres loop is now the RAF
  host and the scheduler drives it through `SceneLoopPort`), declarative
  `TresMesh`/`TresPerspectiveCamera` wrappers with typed `ready` emits,
  `useTresContext().camera.setActiveCamera`, `markRaw` on three objects,
  `primitive` adapters with `:dispose="null"` preserving Experience as
  the single disposal owner. Rewriting any of this would be churn.
- SceneHost's eight hand-rolled `ready` promise blocks were evaluated for
  a `createDeferred` helper: rejected. The synchronous fast-paths
  (`declarativeCamera ?? (await …)`) and reactive mount flags would keep
  the `let` variables, so the helper saves no lines while abstracting the
  most critical lifecycle file. Same verdict family as the 2026-09-25
  `ensureCarouselInitialized` decision.
- The repeated `document.getElementById('spa-content') ?? document`
  root-resolution (entry-app, Experience, ContentReveal) is a one-line
  loose fallback, not a contract worth a shared module at this size.

Verification after fixes: build + prerender injection confirmed in
`dist/index.html`; unit 112 files / 692 tests; e2e 23 passed / 1 skipped
(documented GPU-conditional skip); `tsc`, `vue-tsc`, `eslint` (0 errors),
`prettier` clean.

## Inspection 3 — 2026-09-25, reinvented-wheel audit (TresJS core + Cientos)

> Superseded in part on 2026-09-25 by #224 (ADR 0005): `@tresjs/cientos`
> 5.9.0 is installed as the declared ecosystem foundation, the persistent
> Tres loop is the RAF host, and `useLoop`/`invalidate()` are the supported
> wake edge. The verdicts below record the pre-#224 state; the
> "no wheels" product verdicts remain current.

Trigger: user request to audit final-refactor overengineering, verify the
validity of hand-rolled solutions ("are we reinventing the wheel?") and
assess adopting more of [TresJS core](https://tresjs.org) and
[Cientos](https://cientos.tresjs.org). Method: full inventory of the 20
`Experience/World` + `Scene` classes against the core 5.8.3 export surface
(`node_modules` dist inspection) and the Cientos 5.9.0 catalog (npm
registry: peer-locks `@tresjs/core` 5.9.0; transitive deps three-stdlib,
camera-controls, stats-gl, stats.js, three-mesh-bvh, @vueuse/core,
three-custom-shader-material); import-graph orphan scan over all of
`src/`; cross-read of the documented decisions in
[ARCHITECTURE](ARCHITECTURE.md).

### Verdict: no wheels — the custom layer is product, not plumbing

- All 20 World/Scene classes are product-specific constructs with no
  library equivalent: Baku/SplashCube (CPU-jelly transmission glass with
  per-role materials), BakuCarousel (editorial infinite media stream),
  JunniParticles/PointerInk/ManifestoInk (TSL NodeMaterial subgraphs for
  the WebGPU pipeline), DrawTrail (world-space cursor ribbon with console
  signals), CasePlane (TSL vertex wobble), ShowreelTheater (render-mode
  swap owner of the ONE pipeline), ParticleBurst (deterministic frames —
  deliberately not a simulation). Cientos's generic counterparts
  (Sparkles, Stars, Text3D, Environment, Html) solve different problems.
- `caseTexture.ts` refcount cache is STRONGER than `useTexture`: in-flight
  dedup across BakuCarousel + WorksPlaneStage, `pendingDrop` late-owner
  protection, root teardown sweep — a documented ~12 MB GPU win. A
  composable swap would weaken the single-disposal-owner contract.
- GLTF/DRACO loading (ContactCyprusStage) is 8 lines with a disposed-guard
  that disposes late results; `useGLTF` requires Vue setup context, and
  the owner is a three-object class by design (LazyStage lifecycle).
- `WireframeTypography` needs per-glyph meshes (the word "breathes as a
  small flock"); `Text3D` renders one rigid mesh.
- `RenderScheduler` vs `useLoop` is a documented delivery decision, not a
  wheel: Tres's manual `advance()` kept idle RAF work; the bounded
  scheduler is locked by `TresLoop.contract.test.ts` (ARCHITECTURE.md →
  Renderer and scheduling).

### Can we use more TresJS core? The used surface is already the right one

Production imports: `TresCanvas` + custom renderer factory (single
construction owner), declarative `Tres*` nodes, `primitive` adapters with
`:dispose="null"`, `useTresContext().camera.setActiveCamera`, on-demand
mode with the internal loop stopped. Unused core composables, evaluated:

- `useLoop` / `useCreateRafLoop` — deliberately bypassed (bounded scheduler
  owns the loop; competing RAF loops are contractually forbidden).
  _(Superseded 2026-09-25, #224 / ADR 0005: the scheduler now drives the
  Tres loop via `SceneLoopPort`; `useLoop` subscribers share that RAF —
  see ARCHITECTURE → Renderer and scheduling.)_
- `useLoader` / `useTexture` / `useSizes` / `useCamera` / `useCameraManager`
  — each is weaker than the existing owner (refcount cache / Sizes with
  DPR caps / cinematic camera contract); adopting them would move
  ownership backwards.
- `useAsyncState` / `useEventManager` / `useGraph` — trivial helpers; the
  project's generation guards and typed event ports are stricter.

### Cientos: deliberately not installed

> Superseded 2026-09-25 by #224 (ADR 0005): the project upgraded
> `@tresjs/core` to 5.9.0 and installed `@tresjs/cientos` 5.9.0 as the
> declared foundation for the Tres-native demand loop. First component
> adoption is queued; the peer-lock obstacle named below is gone.

Cientos 5.9.0 peer-locks `@tresjs/core` to 5.9.0 (project pins 5.8.3) and
pulls six transitive dependencies. None of its catalog entries replaces
existing code today (see verdicts above). Installing "for the future" is a
speculative dependency, which the project rules forbid. Re-evaluate when a
concrete need appears — e.g. interactive camera exploration in the Lab
(CameraControls), scene-anchored DOM overlays (Html), or a core upgrade to
5.9.x.

### Overengineering scan: clean

- Import-graph orphan scan: 0 dead modules (28 raw candidates were all
  false positives — router lazy imports with extensions, the
  `three-webgpu-compat` alias seam, ambient type files, and consumers in
  `scripts/`/`admin/`).
- Small abstractions (`createDeferredInitialHashGate`,
  `createSingleFrameOwner`) are tested, consumed and carry documented
  contracts.
- Micro-helpers (1–2-line `lerp`/`ease`/`clamp` idioms in ~10 files) are
  local idioms, some exported as domain functions with their own tests;
  centralizing them adds import coupling for no gain.
- No action items produced. Nothing added to the NEXT queue.

## Inspection 4 — 2026-09-26, DX plumbing pass (stage ports)

Trigger: user direction to continue the refactor per the earlier plan and
remove what the analysis surfaces, with developer experience as the goal
(visual polish explicitly deferred). Method: fresh read of the post-#224
app layer (`SceneHost.vue`, `sceneHost.ts`, `readySlot.ts`, the scene SFCs,
`entry-app.ts`, `Experience.ts` host seam) against the one-question test —
how many files must a routine change touch?

### Real DX defects found (all fixed in the same PR)

- **Stage plumbing threaded four files.** Adding or renaming one
  declarative stage required: 8 method signatures on `SceneHostReady`
  (sceneHost.ts), ~57 lines of hand-written mount/unmount functions in
  `SceneHost.vue`, 8 mirrored signatures on `ExperienceHost`
  (Experience.ts) and 11 wrapper lambdas in `entry-app.ts`. Fixed by
  grouping the boundaries behind `SceneStagePorts` (works / contactHalo /
  manifestoInk) with a shared `createStageSlot` factory — the
  mount/unmount sibling of #224's `createReadySlot` (aliveness guard,
  markRaw store, identity-checked unmount, nextTick template flush). The
  Works port keeps the documented two-level guard (an installation never
  attaches to or outlives a retired stage). A routine stage now touches
  the slot factory's client list and its port entry, not four files.
- **`ExperienceHost` re-declared `SceneHostReady`.** 24 duplicated lines
  of host shape in Experience.ts while the file already imported from
  `app/sceneHost`. Now `Omit<SceneHostReady, 'context' | 'backend' |
'renderer'> & { renderer: RenderSurface; replaceRenderer }` — a host
  capability is declared once, in sceneHost.ts. Adding a host capability
  went from three files (bridge + Experience + entry-app wrappers) to one.
- **Dead export: `createSplashRevealTimer`** (entry-app.ts). Zero
  production callers — the curtain/title handoff runs on the
  ready-event path; only its own two tests consumed it. Function + tests
  removed (the Inspection 1 dead-API pattern). Suite 692 → 690, then
  +4 for the new `stageSlot.lifecycle` tests → 694.

### Checked and found sound (no refactor made, deliberately)

- The scene SFCs (`CinematicCamera`, `CinematicLights`, `GroundPlane`,
  `EnvSphereOwner`, `ServicesStageOwner`, `WorksStageOwner`, `EnvSky`) are
  18–99 lines with one concern each; their `onMounted` ready-emit pattern
  is the declarative contract the ready slots consume. Abstracting it
  would save ~4 lines per SFC behind a composable indirection.
- `entry-app.ts` (645 lines) is cohesive around the one bootstrap
  lifecycle: splash config toggles, the loader ring, the state machine and
  the title reveal observers all share the bootstrap state and its abort
  controller. A module split would move shared private state without a
  consumer-facing seam.
- The stepped loader progress (15/40/55/95/100) is deliberate splash
  choreography, not a stub for `useProgress`: readiness is the Experience
  first-render handshake, and asset-level progress would change the
  splash→Enter contract the e2e suite pins.
- `contentRoot()` duplication (entry-app + Experience) stays one-line, per
  the Inspection 2 verdict.

Verification: tsc, vue-tsc, eslint (0 errors; 16 warnings pre-existing),
prettier clean, vitest 113 files / 694 tests green, docs:check green.
