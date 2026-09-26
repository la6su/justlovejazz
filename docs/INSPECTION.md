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

## Inspection 5 — 2026-09-26, redundancy/docs/tests audit (post-#225)

Trigger: user request to keep surfacing redundant and duplicated code and
over-engineering, and to clear blockers in the form of outdated
documentation, specifications and tests. Scope: main @ 4ad1de0 (all of
#223/#224/#225 merged). Method: three parallel deep audits (code
redundancy across src/app + Experience + core with ts-prune-style
cross-grep; every tracked Markdown doc claim verified against the tree;
test-suite staleness with symbol-level cross-referencing), then
manual verification of every claim before acting.

### Actions taken (same PR)

Docs truth pass:

- `docs/adr/0005-tres-native-demand-loop.md` created — the decision ~15
  prose/code references call "ADR 0005" had no file, and the number
  collided with the deleted snapshot's 0005 (uikit-vue). README now
  explains the one active ADR file vs the snapshot retrieval protocol.
- INSPECTION 2/3 verdicts reversed by #224 (loop stopped, `useLoop`
  bypassed, "Cientos deliberately not installed") carry superseded
  markers instead of reading as current architecture; retitled to a log.
- PAGE_BUILDER save contract ("legacy compatibility still exists;
  removal is in NEXT" — false since the strict `{ slug, document }`
  handler landed), ARCHITECTURE `router.ts` (file does not exist →
  `app/index.ts`), evidence README bundle-filename and metadata-producer
  sentences, and the stale code comments that contradicted ADR 0005
  (RenderScheduler header, renderDemand continuous-loop story,
  Experience setAnimationLoop notes, Tres 5.8 version notes,
  phase7-live-gate doc comment).

Test contracts and coverage:

- New `readySlot.lifecycle` (first direct tests for `createReadySlot`/
  `readyNode` — the #224 helper had only indirect coverage) and three
  SceneHost loop-integration tests driving the before-loop bridge, the
  wrapped `invalidate()` wake path (reason `'external'`) and the
  documented port-calls-after-unmount no-op — the heart of #224 was
  guarded only by slow e2e before.
- e2e pins for the #223 contracts that could silently regress: the
  prerender `<div id="app">` injection (invisible to runtime tests —
  Vue mounts the sections itself either way), the aria-disabled ship
  `true` → ready `false` flip, jetbrains-mono.css + both font preloads;
  the modulepreload guard now matches the real chunk names.
- `renderScheduler` ALL_REASONS derives from a `satisfies
Record<FrameReason, true>` pin including `external` — a new
  FrameReason variant is now a type error, not silent test drift.

Redundancy removal (each claim manually verified before acting):

- Dead exports: `routes.ts` PageId re-export (zero importers; two
  canonical paths for one type), `useJlzPage.uiKitUpdate` (in-file
  only), `ExperienceUI.getFrameCarousel` (pass-through of the private
  `getCarousel`).
- Theme fan-out duplication: `Experience.syncContactTheme` re-applied
  the same theme to contact typography + halo right before the
  coordinator's `syncTypographyTheme` did it again on every
  `jlz:theme-applied` — Experience now only caches the effective
  polarity; one live fan-out owner.
- `CinematicLights.vue` template carried a hand-copy of the intro light
  preset the controller snaps on construction; it now binds
  `CINEMATIC_INTRO_PRESET` (one authored source, zero boot-frame change).
- Test harness: the 8× duplicated TresCanvas mount preamble collapsed
  into `mountSceneCanvas` (−219/+124 in the touched files); suite 694 →
  701 tests.

### Checked and found sound (no refactor made, deliberately)

- `TresLoop.contract.test.ts` keeps its file-local mount: it is the
  vendor upgrade canary with a deliberately minimal assumed surface,
  not a duplication of the shared harness.
- `entry-app.startApp` (public shell entry), `clearBootstrapStyle` /
  `clearReadyEventTimer` (live local helpers) — flagged by the scan,
  verified alive, kept.
- `EnvSky.vue` / `CinematicCamera` vs Cientos `Sky` / `CameraControls`:
  still not drop-in duplicates (authored backdrop sharing EnvSphere's
  material; controller-driven cinematic camera, not user orbit) —
  Inspection 3 verdicts stand.
- `caseTexture` refcount cache remains stronger than `useTexture`
  (cross-consumer dedup + pendingDrop); Cientos adoption stays queued
  per ADR 0005, not forced here.
- The `.github` CI workflow is comprehensive (format, types, lint, unit,
  build, budgets, e2e, lighthouse) — a test-audit claim of "no CI" was
  wrong and is corrected by this entry.

### Open queue (recorded honestly, largest first)

- `createLazyStageSlot` — the six hand-copied lazy-stage field triples +
  12 wrapper pairs in Experience (~250–300 lines) still await the slot
  factory; test seed bags (`Object.assign(Object.create(...))`, 22
  sites) want a shared seed helper in the same pass.
- `StateBus` is a 3-value enum animated as an eased float nobody samples
  (~330 LOC with tests) — a plain field + deadline would replace it;
  needs a visual-timing check of the 0.8 s state flips first.
- `BlurFade`/`NoiseText` share ~70 lines of registry/cancel/finalize
  skeleton; `contentRoot()` ×3 and the eyebrow/title reveal blocks ×4–5
  want a small `textReveal.ts` (splash-timing contracts pinned).
- First real Cientos adoption (ADR 0005 queue): CameraControls in the
  Lab needs the pointer-events product decision.

Verification: tsc, vue-tsc, eslint (0 errors), prettier clean, vitest
114 files / 701 tests green, docs:check green (18 files), build +
prerender + budgets green, e2e chromium green.

## Inspection 6 — 2026-09-26, open-queue execution (slots, StateBus, text reveals)

Trigger: user request to continue in the same spirit — best practices,
refactoring, removing duplicates, dead code and over-engineering. Scope:
main @ cad208b (Inspection 5 merged via #226). Method: the Inspection 5
open queue executed top-down, with each behavioral decision verified
against the call sites before acting.

### Actions taken (same PR)

- `createLazyStageSlot` (queue item 1, done): the six route-owned stages
  no longer keep hand-copied field triples (stage / promise / request) on
  Experience plus an 11-line owner adapter per contract. The slot owns
  that state once (`LazyStage.ts`); Experience keeps one slot field per
  stage, the private stage getters read through their slots (33 read
  sites unchanged), and each contract's owner block collapses to
  `slot.owner`. The Cyprus stale guard reads the live request id off the
  slot. Test seed bags collapsed into the shared `seedExperience` helper
  (`src/__tests__/experienceSeed.ts`): lazy-stage bag keys route into
  fresh slots (truthy values pre-set the stage reference), so a
  lifecycle test seeds one slot field instead of three flat fields.
  Adding a lazy stage is now one slot + one contract.
- `StateBus` removed (queue item 2, done): a 330-line animation engine
  (10 easings, channels, event wildcards) whose only production channel
  was `section:{id}:state` — a 3-value enum animated as an eased float
  nobody samples. The visual-timing check the queue asked for found the
  real artifact instead of a contract to preserve: `updateTransform()`
  re-armed the bus animation on every scroll frame, so the documented
  0.8 s flip asymptotically deferred (~2.2 s) under continuous scroll.
  Section now owns a plain pending flip advanced by `update(dt)` from
  the frame path (`SceneCoordinator.updateSections`), and the flip lands
  exactly one duration after the FIRST switchState toward a target —
  pinned by a 100-frame re-trigger test. Reduced motion still flips
  instantly; forceState cancels a pending flip; disposed sections
  ignore late transitions. Also dropped: a redundant `bus.set` in the
  coordinator's section build (forceState already covered it) and the
  `bus.cancelAll` sweep in destroy() (no channels left).
- `textReveal.ts` (queue item 3, done): BlurFade/NoiseText shared
  ~70-line lifecycle skeletons (RAF + safety-timeout pair, the D-3/D-9
  read-source-before-cancel contract, finalize/cancel/hide, teardown
  registry) — now one TextReveal base; the subclasses keep only their
  per-class element registry, the frame-0 DOM setup and the per-frame
  render. disposeAll() filters the one shared active set by instanceof,
  so teardown semantics are unchanged. The query+guard+show blocks
  repeated across the boot shell (splash / section-change /
  page-section-change / title observer) and Experience's two eyebrow
  handlers collapsed into `BlurFade.reveal` / `NoiseText.revealEyebrow`
  statics on the reveal classes (textReveal.ts stays import-free — the
  first draft put the helpers there and Vitest exposed the module-eval
  TDZ cycle: `extends` resolves at load time, not call time). The
  `contentRoot()` lookup, defined identically in entry-app.ts and
  Experience.ts, moved to the shared `src/core/contentRoot.ts`.
- Cientos CameraControls in the Lab (queue item 4): still blocked on the
  pointer-events product decision; not forced.

### Checked and sound (no action)

- The six lazy-stage contracts' per-stage wiring (create/attach/load/
  configure/release) is genuinely stage-specific; the slot factory
  deduplicates only the state plumbing, which was the repeated part.
- `Section.update` on the frame path costs one deadline check per
  section per frame (6 branches) versus the former bus tick's Map
  iteration over animated channels — no regression.

### Open queue (recorded honestly, largest first)

- First real Cientos adoption (ADR 0005 queue): CameraControls in the
  Lab — pointer-events product decision still pending.
- `EnvSky.vue` / `CinematicCamera` vs Cientos `Sky` / `CameraControls`:
  Inspection 3 verdicts stand (not drop-in duplicates).

Verification: tsc, vue-tsc, eslint (0 errors, 16 pre-existing warnings),
prettier clean, vitest 113 files / 700 tests green (StateBus.test.ts
deleted with its class; Section lifecycle coverage rewritten to the
deadline contract: 5 tests), docs:check green (18 files), build +
prerender + budgets green, e2e chromium 25 passed / 1 skipped.
