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

## Inspection 7 — 2026-09-26, first Cientos adoption (Lab camera exploration)

Trigger: continuation of the open queue — queue item 4 ("first real
Cientos adoption, pointer-events decision pending") executed, plus the
production-readiness push on the `feat/production-ready` branch. Scope:
main @ 1da1f2e (Inspection 6 merged via #227) + the branch's boot/meta/
assets fixes. The pointer-events product decision is made here, in code,
as a stated policy rather than left pending.

### Actions taken (same PR)

- Lab camera exploration (ADR 0005's first Cientos component): the
  decision lives once in `SceneHost.vue` — lab route AND a fine pointer
  AND no reduced-motion preference — and publishes through the typed
  port `src/core/labCameraPolicy.ts` (a plain module boolean, read per
  rendered frame; SceneHost is the only writer, tests drive both sides).
  Consumers: the template's `v-if` + canvas `pointer-events` flip, the
  `body[data-lab-camera]` CSS port (section pass-through: canvas takes
  drag-to-orbit, interactive descendants keep links/buttons; touch
  devices never publish the attribute, so the page-scroll contract and
  the canvas' `touch-action: none` survive), and the cinematic writer
  (`Experience/Camera`), which fully yields while the controls own the
  pose and re-adopts the orbit pose as the smoothing origin on hand-back
  (no authored-framing snap; pinned by `Camera.labControls.test.ts`).
- The controls are the Cientos `<CameraControls>` (ecosystem
  `camera-controls` under the hood) behind an async-component boundary:
  rotate-only orbit around the authored content target, wheel mapped to
  NONE (the Cientos default DOLLY would hijack page scrolling wherever
  the Lab pass-through exposes the canvas), middle/right untouched,
  azimuth/polar/distance limits keep the gamepad framed. The whole
  Cientos/camera-controls/three-stdlib surface loads only when the
  policy activates (own lazy chunk `vendor-lab-controls`,
  `includeDependenciesRecursively: false` so three.js itself stays in
  `vendor-three` instead of being duplicated). Cold-start wake: the
  controls' pointer handlers only dispatch events, so the first drag
  opens a scheduler window through the wrapped `manager.invalidate()`
  (the typed `external` demand); later frames ride the controls' own
  `update` → invalidate path.
- three-stdlib compatibility seam (the hidden cost of any Cientos
  adoption): the Cientos bundle imports the whole three-stdlib barrel,
  whose index re-exports ~200 modules including classic-WebGL
  postprocessing passes that do not resolve against the WebGPU `three`
  build. `src/three-stdlib-compat.ts` re-exports exactly the 28 modules
  the Cientos bundle statically references (deep relative paths, so the
  graph stays tree-shakable), and `src/three-webgpu-compat.ts` supplies
  the two classic-only reads (`UniformsLib`/`UniformsUtils` in
  Water/LineMaterial, eval-safe for the same never-mounted reasons) plus
  loud dead-path stubs (`ShaderChunk`, `WebGLCubeRenderTarget`). The
  seam is guarded by `scripts/check-stdlib-modules.mjs` (`check:stdlib`
  npm script): it computes the import set from the installed Cientos
  bundle and diffs the shim in both directions, so a dependency upgrade
  reports what to add/drop instead of failing obscurely at build time.

### Checked and sound (no action)

- The yield/hand-back design keeps `Experience` the sole disposal owner
  and the scheduler the sole frame-policy owner: the controls never
  drive RAF, they only invalidate through the wrapped manager.
- Keeping `EnvSky` / `CinematicCamera` (Inspection 3 verdicts stand):
  Cientos `Sky` targets the classic shader path and `CameraControls`
  full-range orbit — neither is a drop-in for the authored cinematic
  track; the Lab wrapper is the right scope for the ecosystem controls.

### Open queue (recorded honestly, largest first)

- `EnvSky.vue` / `CinematicCamera` vs Cientos `Sky` / `CameraControls`:
  superseded by the verdicts above — closed as "deliberately not
  adopted"; revisit only if the authored framing requirements change.
- Evidence regeneration (bundle breakdown for the new lazy chunk) needs
  a long-lived dev/preview server; the committed JSON stays pre-Lab.

Verification: tsc, vue-tsc, eslint (0 errors, 16 pre-existing warnings),
prettier clean, vitest 114 files / 708 tests green (Lab camera yield +
SceneHost mount-policy coverage included), docs:check green (18 files),
check:stdlib green (28/28 shim coverage), build + prerender + budgets
green (vendor-lab-controls 37.5 kB gzip, lazy), e2e chromium 26 passed /
1 skipped. One defect caught and fixed during verification: the chunk
rule initially matched `@vueuse/core`, which is a static dependency of
the eager `@tresjs/core` — that turned `vendor-lab-controls` into an
eager boot dependency and, through the misc chunk's commonJS interop for
stats-gl, a circular init order that crashed every page at boot ("Ls is
not a function", 14 e2e failures). The rule now carries an explicit
only-modules-with-no-eager-importer constraint, and `check:stdlib` is
wired into CI as a fast-fail dependency-upgrade gate.

## Inspection 8 — 2026-09-26, blockers-out pass (stale docs, dead surface, seam guards)

Trigger: user request to keep modernizing per the DX goals — remove blockers
and outdated information from the codebase and documents, drop over-
engineering, and drive the project toward top-tier practice, analysis first,
autonomous execution. Scope: main @ d41fde4 (Inspection 7 merged via #228).
Method: two parallel deep audits — (1) scripted dead-export sweep over all
top-level src/{core,app,Experience} modules cross-referenced against every
consumer, plus duplication and file-size review; (2) claim-by-claim docs-
truth audit of every tracked .md except this append-only log. Every claim
was re-verified against the code before acting (the audits' false-positive
rate on prior rounds made this mandatory).

### Actions taken (same PR)

- Blocker: stale docs misdirecting contributors. `ARCHITECTURE.md` claimed
  vite aliases "only bare `three`" — wrong since #228 added the
  `three-stdlib` shim alias + `check:stdlib` gate; the ownership table also
  lacked the declarative stage-mount surface (`app/stageSlot.ts` +
  `sceneHost.ts` ports). `ADR 0005` said `render-mode="manual"` while the
  code and ARCHITECTURE both say `on-demand`, and still listed the Lab
  CameraControls adoption as "queued" though #228 shipped it.
  `DEVELOPMENT.md`'s release gate omitted `check:stdlib`, so a contributor
  could pass all 8 documented commands and still fail CI on shim drift.
  `NEXT.md` Engineering item 4 still carried the "needs a pointer-events
  product decision" blocker. All five fixed; NEXT items 1–2 updated to the
  fresh evidence state.
- Blocker: unclosed TEMP decision — the repo's only TODO/TEMP/FIXME marker
  was `allowedHosts: true, // TEMP` (dev server host allowlist wide open).
  Now `allowedHosts: ['project.6la.ru']` (loopback stays implicitly allowed),
  matching the reverse-proxy comment above it.
- Dead surface: five type exports with zero importers anywhere (repo-wide)
  dropped their `export` keyword (`WorldSlotId`, `ReadySlot`, `StageSlot`,
  `StageSlotOptions`, `WorksStagePort` — consumers receive these
  structurally from the factories). The unreferenced `lhci` npm script was
  removed (CI runs `lighthouse-ci-action` against the same
  `.lighthouserc.json` directly).
- Comment truth: the garbled Phase-10 sentence in `Experience.setupEnvironment`
  doc comment repaired; the `SceneCoordinator` tracker-style labels
  ("PERF-1 fix", "Bug 2") rewritten as contract descriptions, with the
  deliberate second ease now explicitly marked parity-locked so nobody
  "fixes" the double `_applyEasing`.
- Small dedups with stated contracts: `Experience._syncPolaritySurfaces()`
  owns the ground/baku/typography polarity fan-out (the event handler keeps
  its particles pass, the init replay its envSphere snap — leg-specific by
  design, now written down); `entry-app` `revealStudioTitle()` owns the
  `.studio-title` + 1.5 s BlurFade contract shared by the two section events
  (the splash first-reveal stays distinct: 0.55 s + text + registry).
- Seam guard completed: `check:stdlib` now also verifies the
  `three-webgpu-compat` curated surface — each of the five curated symbols
  (`WebGLRenderer`, `UniformsUtils`, `UniformsLib`, `ShaderChunk`,
  `WebGLCubeRenderTarget`) must still have a consumer in the real
  dependency graph (Tres bundle + Cientos bundle + exactly the shimmed
  stdlib files) and must still be provided by the compat entry. The
  previous round's guard covered only the stdlib shim; this closes the
  second direction (silently dead stubs after a dependency upgrade).
- Evidence tool generalized: `bundle-breakdown.ts` profiles BOTH delivery-
  critical vendor chunks in one sourcemapped build (`vendor-three` +
  `vendor-lab-controls`), run-unique filenames preserved. Fresh reports
  committed for d41fde4: the shared chunk is pure three.js again (three.webgpu
  - three.core + tsl + 4 example modules; three-stdlib fully migrated into
    the lazy lab chunk: camera-controls 45 kB, cientos 32 kB, stats-gl 30 kB
    raw tops).

### Checked and sound (no action)

- No dead runtime symbols remain in the swept surface; the surviving
  exported-for-testing seams all keep the internal-use + one-test shape.
- The 2× owner-component pattern (`ServicesStageOwner`/`EnvSphereOwner`,
  ~12 shared lines) stays: a shared composable would be speculative until a
  third owner appears (AGENTS.md rule).
- The dual stage read-surface (Experience getters ↔ SceneCoordinator getters
  over the same six slots) is alive on both legs (route logic vs frame
  path); consolidation waits for a third consumer.
- `Experience.ts` (1829 lines) and `SceneCoordinator.ts` (971) splitting
  remains the documented architectural item, not a hygiene task for this pass.
- The old `8b98b41` vendor-three evidence JSON predates the stdlib migration
  and its commit is only on the #228 branch — legitimate dated evidence per
  the evidence README; the fresh d41fde4 reports supersede its content.

### Open queue (recorded honestly, largest first)

- Live/soak evidence regeneration on their supported server (NEXT
  Engineering item 2); the delivery-review judgment on startup/backend/idle
  depends on it.
- Two-branch delivery workflow (user-deferred), physical WebGL device-loss
  restoration (user-deferred).

Verification: tsc, vue-tsc, eslint (0 errors, 16 pre-existing warnings),
prettier clean, vitest 114 files / 708 tests green, docs:check green
(18 files / 35 links), check:stdlib green (28/28 shim + 5/5 curated),
build + prerender + budgets green, e2e chromium 26 passed / 1 skipped.

## Inspection 9 — 2026-09-26, best-practices cross-check + dedup pass (post-#229)

Trigger: continue modernization against the 2026 TresJS/Cientos best-practice
baseline; remove over-engineering, dead surface and the blockers that keep the
architectural refactor (the Experience split) out of the declared queue.
Method: three parallel audits (render/post layer, runtime layer, docs/tests
truth) with every claim re-verified against the tree before acting; the
current TresJS/Cientos 5.9 docs read directly (TresCanvas API, Cientos
useProgress) as the framework-capability baseline.

### Decisions (framework capability vs in-repo contract)

- `renderMode="on-demand"` + `fpsLimit`: NOT adopted as replacements. The app
  already renders on `render-mode="on-demand"` (SceneHost), but the
  RenderScheduler owns the policies Tres 5.9 lacks — typed invalidation
  reasons, hidden-tab folding with exactly-one resume frame, synchronous
  reduced-motion settle and zero settled draws (ADR 0005). `fpsLimit` caps
  loop frequency but cannot express the ambient-breath timer or the settle
  contract. The two-layer stack (Tres demand accounting neutralized beneath
  the scheduler) stays, documented deliberately.
- Cientos `useProgress`: NOT adopted. It wraps `THREE.DefaultLoadingManager`
  and requires `<Suspense>`; the app has no Suspense boundary, the real
  readiness gates are boot milestones (UIManager init, sceneHost ready +
  backend inspection, first successful render) rather than loader items, and
  the loader DOM lives in the pre-Vue splash shell. A hybrid would be a
  redesign, not a swap — the stepped milestone loader stays.
- Post-processing: no `@tresjs/post-processing`/pmndrs adoption — they do not
  target WebGPU/TSL; the hand-built TSL graph remains the justified option.

### Actions

- P0 boot bug: splash sound/language toggles were dead on EVERY page load —
  `startAppOnce()` called `resetBootstrapBindings()` before registering the
  toggle listeners, and the reset aborted the bootstrap AbortController;
  per the DOM spec, listeners added on an already-aborted signal are
  dropped. The controller had no legitimate role (bootstrap runs exactly
  once per page; retry = full reload), so it is deleted outright and both
  toggles register plain listeners. Regression test pins click→state→
  storage; the stale "30s" comment now matches the 60s watchdog.
- Dead surface out: `WebGPUPostPipeline.resize()` (documented no-op, zero
  callers + vestigial mock key), DevPanel forceRender change handler (the
  refresh interval has run since the constructor), `Sizes.isMobile`,
  `Time.elapsed`, SceneCoordinator `linear`/`cubic-bezier` easing branches +
  the 17-line `_cubicBezier` + the zero-reader `sceneTransition.duration`
  (type narrowed to `SceneTransitionEasing`), `createReadinessGate` moved to
  `core/readinessGate.ts` (one less export on the god-class path),
  Experience `firstRender`/`overlay`/`time` de-exported, test-helper dead
  exports (`LAZY_STAGE_SLOT_NAMES` array, `MountedSceneCanvas` export).
- Post-param unification: one canonical `PostParams` (core/postParams.ts)
  replaces four hand-maintained shapes and two hand-copied mapping sites;
  `copyPostParams` keeps the PERF-11 in-place handoff;
  `RenderPipelineConfig` (1 field, 1 call site, self-described residue)
  collapses into a `create(renderer, postProcessingEnabled)` boolean.
- Single quality-scaling owner: the split-brain (DeviceCapability
  `postMultiplier` applied per frame in Renderer × `QUALITY_SCALARS` gates
  per preset in PostProcessingManager) folds into `applyPreset` — one
  application site. Linear scaling commutes with the crossfade lerp, so the
  settled and mid-crossfade output is numerically unchanged; only a
  mid-crossfade tier change (init-time only) would differ.
- Dedup: `createImportedLazyStage` replaces four hand-copied dynamic-import
  create lambdas (guard-after-import rule in one place);
  `ExperienceUI._routeContinuationIsCurrent` collapses the 4× route-guard
  idiom; `SceneCoordinator._bakuVisibleOnRoute` shares the route-static baku
  visibility predicate (the frame-path copy silently carried the
  home/carousel clause — drift risk removed, behavior unchanged);
  `WORKS_SLOT_INDEX` exported once from the worldSlots contract;
  Cursor's `INTERACTIVE_SEL` hoisted to one module const.
- Docs truth: NEXT.md's media item claimed four `public/assets/projects/`
  placeholder folders that were removed in d41fde4 — rewritten to the real
  state (the four current folders are the ACTIVE case covers, swapped in the
  same change as their replacements). The Experience/SceneCoordinator split
  is now NEXT.md Engineering item 5 with sequencing (test seeds first,
  docs + chunk regexes in the same change) — previously it lived only in
  this append-only log. Stale comments fixed: TresJS 5.8 → 5.9 (vite alias),
  Cursor 100×100 → 120×120 canvas + never-implemented speaker states,
  `_webgpuParamsDirty !== false` → truthy check.

### Checked and sound (no action)

- The two-layer demand-render stack (ADR 0005) and the stepped milestone
  loader are deliberate contracts, not reinvented wheels (see Decisions).
- `EventBus` remains the app's central typed port: all 23 channels carry
  production traffic (~36 emit / ~44 subscribe sites); only `jlz:navigate`
  has no in-app emitter (the documented e2e/soak seam).
- `SceneCoordinator.defaultResult()`/`buildResultFromConfig` are defensive
  guards on the updateTransform flow — removal would trade a cheap fallback
  for a new failure mode.
- `ensureCarouselInitialized` stays hand-rolled (decision recorded on the
  method in Inspection 2 — LazyStage's release semantics would null the
  live scene-graph reference).
- The three dispose-idempotency guards sit at different layers (factory
  helper / SceneHost Vue-side WeakSet / Renderer terminal flag) — each
  protects a different owner's contract; consolidating would couple layers.
- Test suite: no stale imports (tsc green), no duplicated coverage found
  across 910 describe/it titles; the private-state seeding pattern
  (14 files) is the real split cost and is now sequenced in NEXT item 5.
- `FrameGapStats` ≈ `FrameTiming` duplication noted (DevPanel-only
  consumer); left for the dev-tooling pass to avoid churning the probe
  surface in the same change as runtime dedup.

Verification: tsc, vue-tsc, eslint (0 errors, 16 pre-existing warnings),
prettier clean, vitest 114 files / 711 tests green, docs:check green,
check:stdlib green (28/28 shim + 5/5 curated), build + prerender + budgets
green, e2e chromium — see the PR's CI run.

## Inspection 10 — 2026-09-27, Cientos-parity audit + agent-doc blocker sweep (post-#230)

Trigger: continue the refactor — find code that duplicates TresJS/Cientos
functionality, re-check specs and agent-facing documentation for blockers,
propose solutions, proceed autonomously.
Method: three parallel audits (runtime Cientos parity, loading/assets layer,
docs/specs blockers). The full Cientos 5.9 export surface (113 names) was
extracted from the installed `dist/trescientos.js` and diffed against the
hand-rolled surface; every candidate was read at file:line before a verdict.

### Decisions (Cientos parity — zero actionable duplicates)

Every overlap surface is KEEP; the reasons fall into three classes:
**(a) raster-era Cientos** — components built on classic `shaderMaterial` /
`WebGLCubeRenderTarget` cannot run on the WebGPU/TSL pipeline
(JunniParticles vs `Sparkles`/`Precipitation`/`Smoke`; setupEnvironment's
renderer-native PMREM vs `Environment`/`useEnvironment` HDRI presets;
ShowreelTheater's TSL fullscreen quad vs `ScreenQuad`); **(b) demand-loop /
reduced-motion coupling** — Cientos components run unconditional Vue loops
with no `isAnimating`/`setReducedMotion` surface and would fight the Lab
`CameraControls` yield (Camera cursor-follow/shake/FOV vs
`MouseParallax`/`CameraShake`; camera-local stage groups vs `Billboard` —
the change-gated 3×8-line copies beat per-object Vue wrappers); **(c)
Vue-setup-context / lifecycle ownership** — `useTexture`/`useGLTF`/
`useAnimations`/`useVideoTexture` need setup context and cannot express the
refcounted caseTexture cache (in-flight dedup, `pendingDrop` late-owner
protection, teardown sweep), the LazyStage stale-guard disposal, or the
ShowreelTheater manual play/state bridge (Cientos `useVideoTexture`
autoplays and swallows load errors). Ghosts verified absent: `useCursor` is
NOT a Cientos export; no projected DOM (`Html`), no 3D audio
(`GlobalAudio`/`PositionalAudio` — SfxSystem is a procedural oscillator
synth), no FBO/Reflector plumbing, no mixer sites, no BVH sites.
`useProgress` gains a fourth blocker: it mutates module-global
`DefaultLoadingManager` callbacks (cross-boot global state) and cannot
represent the `?no-scene` zero-asset ready state. The NEXT item-4 open
question ("whether `Sparkles`, `Html`, `Environment` earn their place") is
closed: none adopted; the item is removed from the queue (the split item
renumbers 5 → 4), and the standing adoption rule (#228 model: lazy chunk,
stdlib-shim entry, eval-safety review, no new eager imports) moves to
ARCHITECTURE § Delivery decisions as the durable contract.

### Decisions (agent-doc blockers — 4 found, all fixed)

- NEXT.md claimed the last `sections/` file shipped in #216 — false:
  `src/sections/_shared/constants.ts` survived as the sole `PageId` source
  with 26 importers, invisible in the ARCHITECTURE ownership table (an
  ownership inversion exactly where the Experience split would trip).
  Fixed in code: `PageId` moved into `core/routeManifest.ts` (the manifest
  is the paths+pages source of truth), `src/sections/` deleted, ARCHITECTURE
  row + routes section updated, NEXT sentence rewritten.
- NEXT item 3 pointed the Git-delivery wording edit at AGENTS.md, which
  contains no such wording; the real sources are DEVELOPMENT § Git delivery
  and the release skill's "PR against `main`" rule. Pointer rewritten.
- `package.json` `test` script was an undocumented alias to the parallel
  Playwright suite that DEVELOPMENT.md flags as flaky — a canonical-looking
  trap for "package.json owns commands" agents. Removed; `test:unit` /
  `test:serial` (documented, CI-run) stay, as do the dev conveniences.
- sceneHost.ts cited AGENTS.md "exactly one canvas, renderer and loop owner
  during migration" — the doc has no "during migration" qualifier. Citation
  corrected; a stale `sections/works/scene.ts` pointer in SceneCoordinator
  and one in HomeView.vue fixed on the same sweep.

### Checked and sound (no action)

- `FrameGapStats` ≈ `FrameTiming` (thread left open by Inspection 9 "for the
  dev-tooling pass") — CLOSED as evaluated-and-deliberately-kept: different
  semantics (inter-render gap vs per-frame CPU segments), different
  lifecycle owners (DevPanel's FPS loop vs Experience's lazy DEV snapshot);
  a shared ring util for two consumers is the speculative abstraction
  AGENTS.md forbids, and a merge would couple the owners. No NEXT line —
  the queue must not re-grow with settled threads.
- AGENTS.md is clean: all four Preserve rules verified against code, no
  contradictory rules across AGENTS/CLAUDE/ARCHITECTURE, no rule forces
  duplicating framework functionality, all links resolve. CLAUDE.md is a
  4-line pointer. ADR 0005 status "accepted" still matches the code.
- DEVELOPMENT.md commands/budgets byte-match package.json and
  check-build-budgets.ts; PAGE_BUILDER/BRAND/evidence paths live; the CI
  workflow maps only to existing scripts; the three skills are consistent
  with ADR/ARCHITECTURE and duplicate no AGENTS rule.

Verification: tsc, vue-tsc, eslint (0 errors, 16 pre-existing warnings),
prettier clean, vitest green, docs:check green, check:stdlib green,
build + prerender + budgets green, e2e chromium — see the PR's CI run.

## Inspection 11 — 2026-09-27, legacy portfolio cross-check (la6su/portfolio)

Trigger: the user supplied the pre-migration portfolio implementation
(github.com/la6su/portfolio, last pushed 2024-11-27) as the reference for
the ongoing refactor. Method: shallow clone, full read of all 27 source
files (App/TheExpiriense/Scene3D, stateManager/boxesObject stores, 4
composables, floor GLSL shaders, FakeGlowMaterial, UI components), stack
and asset census, then a dimension-by-dimension diff against this repo.

### What the legacy app is

A TresJS-starter character-model showcase (15 GLB figures, 309 MB
public/models) with raycast picking, AR hand-off intents, GSAP tweens and a
module-scope god-store. Classic WebGL (three 0.169, core 4.3, cientos 4.0).

### Architectural diff — the migration already supersedes every dimension

- Loop: legacy runs `useRenderLoop` 24/7 plus an infinite GSAP yoyo on the
  glow radius and per-frame mixer updates for all 15 models; this repo's
  bounded on-demand scheduler idles at zero RAF ticks (ADR 0005).
- Camera: legacy clamps camera POSITION by hand on every `@change`
  (`MathUtils.clamp` × 3 — fights the controls, jittery at the bounds);
  the Lab adoption uses real azimuth/polar/distance limits and the rest of
  the app keeps the pose-owner contract.
- State: legacy `stateManager` is one module singleton exporting 20+
  members including a raw `Raycaster` and pointer Vector2, consumed
  cross-concern by every component; this repo split route/theme/motion
  into typed ports (routePage, sectionTheme, motionPolicy, EventBus).
- Loading: legacy loads all models upfront behind one progress value;
  this repo keeps route-owned LazyStage contracts with refcounted caches.
- Boot/bridges: legacy boots through `<Suspense>` + PageLoader fallback,
  monkey-patches `window.ResizeObserver` with a debounce, depends on
  `@basitcodeenv/vue3-device-detect`, and mounts DOM into 3D via Cientos
  `Html`; this repo keeps the pre-Vue splash a11y contract, DeviceCapability,
  native resize ownership and DOM as the semantic owner. Code hygiene:
  legacy carries component-name typos, a broken `setTimeout(...), 600 600`
  leftover and duplicated select logic across useOnClick/useSelectBox.

### Reviewed and deliberately not adopted (code level)

- Cientos `Html`/`RoundedBox`/`useTexture` (legacy usages): all already
  carry Inspection 10 verdicts — no consumer surface or weaker than the
  in-repo contracts here.
- DRACO decoder serving: legacy self-hosts `/draco/`; this repo bundles
  three's own decoder files through `DRACO_GLTF_CONFIG` (`new URL(…,
import.meta.url)` asset emission) — equivalent self-hosted outcome.
- Cache-API model preloading and GSAP-driven per-character room theming:
  the current equivalents (route-lazy stages, TSL section themes) already
  cover the capability at a fraction of the runtime cost.

### Product features only the legacy app has (reported to the user, not queued)

1. AR hand-off per model — Android Scene Viewer intents + iOS Quick Look
   (.reality/.usdz). Meaningful only for standalone viewable character
   models; the current product's works are 2D case covers + one 60 kB
   stage GLB, so there is no consumer surface today.
2. PWA offline — service worker + Cache API for the 309 MB model corpus.
   The current heaviest asset is a 16.3 MB reel video; offline-first is a
   product decision, not a refactor target.
3. Model head/eye look-at tracking toward a glowing pointer — a
   storytelling detail the current pointer choreography replaces.

If any of these three become wanted, they enter NEXT "Product / input
needed" with a scoped slice each; none block the architectural refactor.

Verification: docs-only change — prettier clean, docs:check green.

## Inspection 12 — 2026-09-27, out-of-box Tres adoption cross-check (TvT.js) + live DPR cap

Trigger: the user set the direction — use Vue/TresJS/Cientos out of the box
wherever possible, keep WebGPU/TSL the priority (and asked whether the
WebGL fallback is automatic), continuing optimization with the TvT.js
ecosystem (hawk86104/three-vue-tres) as the practice reference.
Method: shallow clone of TvT.js (Fes.js + Tres 5.2/Cientos 5.2, three 0.180,
WebGL-era); read of its openspec baseline, AGENTS.md, index.vue and the
TSL plugin pages; three 0.185's WebGPURenderer source read directly for the
fallback mechanics; @tresjs/core 5.9's useRendererManager dist source read
for how TresCanvas props reach factory-created renderers.

### The user's fallback question — verified in three's source

Automatic, by construction: `WebGPURenderer`'s constructor keeps
`WebGPUBackend` unless `forceWebGL` is set, and installs
`parameters.getFallback = () => new WebGLBackend(parameters)` — when no
WebGPU device can be acquired, the renderer falls back to WebGL2 and warns
("WebGPURenderer: WebGPU is not available, running under WebGL2 backend.").
This repo already owns the post-init half of that story:
`inspectUnifiedBackend` reads the actual backend + software-adapter flag,
`planUnifiedBackend` re-creates on SwiftShader adapters, the TSL post graph
degrades to direct rendering on WebGLBackend (Phase 2 contract), and
`?force-webgl-backend=1` forces the path in DEV. No change needed.

### Out-of-box adoption state (TvT.js cross-check)

- Already adopted: the official `<TresCanvas :renderer="factory">` setup
  with the typed `TresRendererSetupContext` (SceneHost) — the same pattern
  TvT.js's TSL cases use; `render-mode="on-demand"`; the ADR 0005 loop
  seams (`replaceRenderFunction`, `useLoop` hook, `invalidate` wrap) that
  let ecosystem components work unmodified; declarative stage owners
  (lights/camera/ground/env/stages as Vue components with `@ready` ports).
- Verified and deliberately KEPT hand-rolled: `applySharedSettings`
  (tone mapping/exposure/color space) — Tres applies these as TresCanvas
  props to factory renderers, but the rollback construction path
  (Renderer's direct instance) must share the identical settings, so one
  function serving both paths beats a props/hand-rolled split. Sizes stays
  the imperative viewport snapshot for scene-owner layout math (Tres's
  internal element-size manager equals it — `.jlz-scene-host` is
  `fixed inset 0` — but scene classes live outside Vue context).
- TvT.js patterns that do NOT transfer: the plugin/fes micro-frontend
  architecture (different product class), `@tresjs/post-processing` +
  `lamina` (raster-era, cannot run on WebGPU/TSL), gallery-style Suspense
  demos with always-on `@loop`. Its openspec capability baseline duplicates
  what AGENTS/ARCHITECTURE/NEXT already cover with less ceremony.

### Defect found and fixed — stale DPR cap on the fallback path

Tres core re-applies its `dpr` option inside a `watchEffect` on every
internal sizes change (window resize, browser zoom), debounced ~10ms AFTER
this app's own resize write. The SceneHost `:dpr` prop held the BOOT-time
cap (`DeviceCapability.maxDpr` before backend finalization): on the mobile
WebGL-fallback path the final cap is 1 while the boot hint is 1.5, so any
later resize/zoom silently regressed the buffer to 1.5× — extra fill work
on exactly the weakest devices. Fix: `maxDprForMode` extracted as the pure
single source (singleton + SceneHost share it); the SceneHost finalizes a
live `dprCap` ref in `onReady` (the backend-decision owner) and re-publishes
it on the device-loss renderer swap (recovery may change the backend).
Unit-tested pure contract + a new e2e pin: mobile fallback context, resize,
buffer must stay ≤ cssWidth × 1 (the pre-fix behavior produced 750/500 and
fails this test).

Verification: prettier clean, tsc + vue-tsc green, eslint 0 errors (16
pre-existing warnings), vitest 116 files / 714 tests green, docs:check
green, check:stdlib green, build + prerender + budgets identical to
baseline, e2e chromium serial 27 passed / 1 skipped (new DPR pin).

## Inspection 13 — 2026-09-27, TvT.js docs-pattern adoption + dead/tautological test sweep (post-#232)

Scope: the user's follow-up to the TvT.js cross-check — "continue the refactor
per the TvT.js example: change the documentation, remove redundant/dead code,
over-engineering and dead tests." Two parallel audits (reference repo deep
read; symbol-level dead-code/dead-test sweep of this repo at c73d2a2), every
candidate re-verified before acting.

### What was adopted from TvT.js — and what was deliberately rejected

- Adopted: the disclosure norm. TvT.js's AGENTS.md requires every agent
  report to state which verification ran. The positive form is now in our
  AGENTS.md ("report which checks ran") — our gate set (unit + e2e + budgets)
  stays, unlike TvT.js's build-debug ban, which substitutes prose for gates
  in a repo with zero tests.
- Adopted in spirit, rejected as ceremony: the "primary code evidence" file
  list at the top of every spec. This repo already implements the principle —
  the ARCHITECTURE.md ownership table maps every concern to source owners,
  ADR 0005 names its owners inline, and `docs:check` verifies cited paths
  resolve. A parallel evidence-header layer would duplicate the table and
  decay (TvT.js's flagship spec drifted from its own code within months:
  4 documented preview categories vs 8 in code). The uniform
  Purpose/Covers/Requirements skeleton was rejected for the same reason:
  spec structure without an execution story is cargo cult.
- Rejected: TvT.js's metadata ceremony (koroFileHeader stamps consumed by
  nothing), its openspec changes/ flow (empty since inception), lint config
  without a lint script. Our docs drift items found by this sweep were fixed
  in code, not codified.

### Dead/tautological coverage out

- `routePage.test.ts`: the third test ("World.syncRouteVisuals hides …")
  exercised only the port's own setter/getter under the name of a class that
  left production in Phase 8; its assertions duplicated test 1 exactly.
- `stageSlot.lifecycle.test.ts`: the "resolves promises (flushPromises
  compatible)" test — tests 1/3 already await mount/unmount; a never-resolving
  promise would time out there.
- `experienceSeed.ts`: the `contactHaloStage`/`manifestoInkStage` bag keys
  were never passed by any test (both voices are injected via the returned
  `slots` record) — dropped from the routing map.
- `tresHarness.mountSceneCanvas`: the `renderMode` option had no caller —
  all 9 mount sites use the hardcoded manual mode; the option is gone.

### Mirrored machinery tests collapsed into base-class suites

- New `textReveal.lifecycle.test.ts`: the disconnect-finalize and
  reschedule-while-connected tests existed as copy-equivalent pairs in the
  BlurFade and NoiseText files while the `TextReveal` base (which owns that
  machinery) had no dedicated suite. The base suite adds tests neither voice
  had: the safety-timeout finalize path, the empty-element early return, the
  explicit `show(sourceText)` source capture, and the read-before-cancel
  re-show contract (D-3/D-9) at the base level. BlurFade/NoiseText keep their
  genuine voice contracts (markup-safe split, XSS-as-text, frame buffer,
  rotation cache, disposeAll instanceof filters, restore-on-hide).
- New `PointerInkStage.lifecycle.test.ts`: same pattern — the reveal-damp,
  pointer-chase, reduced-motion, disposed-guard and shared-geometry tests
  existed twice (ManifestoInkStage ↔ ContactHaloStage, diff = tint hexes and
  one damping constant) while the shell had no suite. Voice files reduce to
  their real contract: the theme tints. Harness voices use unique geometry
  keys/element types so the module-global shared-geometry map and per-class
  registries never collide across suites.
- `Experience.resizeOwners.test.ts`: the "does not initialize a missing lazy
  Cyprus owner" test asserted only `.not.toThrow()` — it now pins the slot
  directly (stage stays null, request id stays 0).

### Dead surface out — copyPostParams wired, not deleted

#230 shipped `copyPostParams` (core/postParams.ts) with the claim that it
"keeps the PERF-11 in-place handoff", but both RenderPipeline handoff sites
(18-line snapshot copy, 14-line TSL-cache handoff) remained hand-written —
an unwired helper was the worst of both worlds. Both sites now go through
the canonical helper (the header's "adding a channel is a one-file change"
claim is finally true), `PostGradeTuple` is unexported (module-local; only
`NEUTRAL_GRADE` crosses the module boundary), and the stale DevPanel
tombstone comment (8 lines about a 2026-07-11 removal) is compressed to the
decision that matters (navigation deliberately absent).

### Deliberately kept

- Private-field perf pins (EnvSphere weights, NoiseText chars, BlurFade
  rotations): they pin documented allocation-free invariants, not behavior.
- The four "ignores late public calls after terminal teardown" twins:
  different classes, per-owner contracts.
- FrameGapStats vs FrameTiming split (DevPanel p50/p95 vs gate-critical
  timing capture — different owners, evaluated in Inspection 9).
- All 21 `jlz:*` events, all observability surfaces (RuntimeResourceSnapshot,
  FrameTiming, FrameGapStats have live readers: DevPanel, phase7-live-gate).

Verification: prettier clean, tsc + vue-tsc green, eslint 0 errors (16
pre-existing warnings), vitest 117 files / 711 tests green (714 → 711: the 6
dead/duplicated and 10 mirrored tests are out, 13 dedicated base-contract
tests in, including the safety-timeout, empty-element and read-before-cancel
contracts that had no coverage), docs:check 18 files / 36 links green,
check:stdlib 28/28 + 5/5 green, build (incl. home/blog prerender, builder
pages, sitemap) green, budgets identical to baseline (splash 2.82/5, vendor
three 298.65/350, uikit 53.66/56), e2e chromium serial 27 passed / 1 skipped
(baseline parity).

## Inspection 14 — 2026-09-27, Experience god-class split, phase 1 (TvT implementation alignment)

Scope: the user's "переделывай проект в соответствии с реализацией TvT
framework" — TvT.js's implementation model is many small self-contained
owners behind a thin host bridge; this repo's largest deviation was the
`Experience.ts` god-class (1794 lines). NEXT item 4's documented sequencing
(seeds to slot seams first, then clusters) was followed; every extraction
landed behind an existing seam, no new mechanism was invented.

### Extractions (all in `src/Experience/`, same `chunk-experience` membership)

- `FpsTracker.ts` (51 lines): the rolling-window FPS measurement (ring
  buffer + threshold + verdict). The auto-reduce policy (halve particle
  counts, one-way) stays on Experience — it owns the scene groups.
- `SceneEnvironment.ts` (163 lines): the procedural IBL environment owner
  (equirect canvas + renderer-native TSL PMREM) with `apply()` and
  `disposeCurrent()` contracts; wired with lazy renderer/baku getters so the
  recovery callback and destroy path share one owner. The PMREM-failure test
  now drives the real owner directly.
- `ShowreelController.ts` (107 lines): the showreel render mode (lazy
  theater, typed bus commands, reduced-motion forwarding, terminal
  disposal) plus the frame swap — `renderFrame()` returns false when the
  world should draw, so Experience keeps a single if in the frame path.
- `StageRegistry.ts` (336 lines): the six route-owned lazy stages — slot
  triples, contracts (works plane, contact typography/halo/cyprus, manifesto
  ink, lab object), the Cyprus section flip, the reduced-motion fan-out and
  the final teardown in the legacy order — behind a getter context (scene,
  page, camera, host ports, polarity/motion caches, route reconciliation).
  Experience keeps one-line delegates: the ExperienceUI host port, the
  buildWorld entry-route pre-inits, the SceneCoordinator owner getters and
  the frame-path reads keep their shapes. The polarity cache stays on
  Experience (theme-listener written); the registry reads it through the
  context.

### Checked and sound

- `Experience.ts` 1794 → 1416 lines. The remaining body is the split's
  documented center of mass: `_needsRender`/`_activitySnapshot` writers, the
  settle policy, the frame body and the pinned destroy ordering.
- The test seed now attaches a registry built over the seeded instance and
  routes stage bag keys through its public slots — the seed surface is the
  seam the clusters moved to, per the NEXT sequencing rule.
- `Experience.destroyOwnership.test.ts` stayed green unrenamed (registry
  dispose order preserved; the env-owner fake reproduces the
  dispose-and-clear contract).
- The SceneCoordinator side was NOT touched. Its parity-locked double-ease
  was prose-only protection, so a characterization pin landed first
  (`SceneCoordinator.doubleEase.test.ts`): `worldState.phaseProgress`
  carries the singly-eased camera t, the to-group mesh opacity carries the
  doubly-eased fade, and the test asserts they diverge — a future dedupe
  fails loudly.

### Deliberately rejected

- Extracting the carousel (created by SectionGroups, initialized by
  Experience, driven by the coordinator, disposed by SectionGroups) —
  a four-leg triangle whose legs would all survive the move; no win.
- Extracting the post-handoff block — it is already two thin call sites
  around `renderer.update()`; a "pipeline controller" would be ceremony.
- Auto-generating stage scaffolds (TvT.js's pluginMaker): the registry +
  slot pattern already reduces a new stage to one contract in one file; a
  generator adds a maintenance surface for a task that is now small.

Verification: prettier clean, tsc + vue-tsc green, eslint 0 errors (16
pre-existing warnings), vitest 118 files / 712 tests green (+1
characterization pin), docs:check 18 files / 36 links green, check:stdlib
28/28 + 5/5 green, build (incl. prerenders + sitemap) green, budgets
byte-identical to baseline (splash 2.82/5, vendor-three 298.65/350, uikit
53.66/56 — extractions stayed inside `chunk-experience`), e2e chromium
serial 27 passed / 1 skipped (baseline parity).

## Inspection 15 — 2026-09-27, SceneCoordinator god-class split, phase 2 (NEXT item 4 closed)

Scope: the second half of NEXT item 4 — the `SceneCoordinator.ts` side of
the god-class split (957 lines), following the user's "продолжай в том же
духе" continuation cycle: characterization first, then one owner per
commit, blockers and dead code out along the way.

### Characterization before any move

`SceneCoordinator.scrollStates.test.ts` (5 tests) pins the scroll state
machine: the from-section's READY → VIEWING promotion (0.8s deadline) and
its flip via `updateSections(dt)`, the to-section's gated promotion past
eased t 0.1, the VIEWING → PASSED retirement past t 0.7 (0.5s deadline),
and the arrival write (`sectionIndexAt` midpoint rule) re-targeting the
scene fog to the active config while reusing the `FogExp2` instance. The
pin work surfaced two facts the prose had never recorded: section 1 is
force-VIEWING by the init intro rule (so the t > 0.1 gate must be pinned
on the second range transition), and home's per-transition authored
easings include `ease-out`. Deadline steps in the test use coarse 0.5s
increments on purpose — exact-deadline steps hit float dust
(`0.8 - 0.6 - 0.2 = 1.6e-16 > 0`) and would over-pin the flip to IEEE
semantics.

### Dead code removed

- `SceneCoordinator.changeSection(index)`: zero callers anywhere —
  production drives section states exclusively through the scroll contract
  inside `updateTransform` (now pinned by scrollStates), and the only
  `changeSection` callers left are `EnvSphere`'s and `CinematicLights`' own
  same-named methods, invoked by Experience directly. The Junni-era
  imperative index → state fan-out duplicated that policy with a different
  transition table. The stale `Lights.changeSection` doc comment ("Called
  by World.changeSection()") was refreshed with the real callers.

### Extractions (all in `src/Experience/`, same `chunk-experience` membership)

- `SectionStateMachine.ts` (110 lines): the scroll story state — Section
  instances built from the page's PhaseConfig list, the derived config
  map, the active-section index, the arrival write and the
  READY/VIEWING/PASSED threshold policy. The coordinator orchestrates
  `beginRoute → cache invalidation → syncRouteVisuals → buildSections`,
  preserving the legacy World ordering of the visibility gate.
- `SceneTransformPass.ts` (450 lines): the pooled scroll→world transform —
  the GC-free result pool, the revision-keyed reuse cache, the range-bucket
  mapping with per-section easing (including the parity-locked second
  ease), the group visibility fade loop with its per-group mesh cache, the
  arrival fog re-target and the camera/baku/env lerp. Public
  `invalidate()` / `resetForRoute()` replace the coordinator's private
  revision bump.
- `SceneFramePass.ts` (160 lines): the demand-gated owner fan-out — the
  per-frame forwarder (advances every scene owner on a demanded frame,
  keeps route ownership state synchronized on idle ones), the camera
  reference (DrawTrail unprojection, ServicesStage head-tracking) and the
  Works stage's active chapter index. `setWorksPlaneStageSection` returns
  the change so the coordinator invalidates the transform cache only on
  real changes. The baku route-visibility predicate is the shared
  `bakuVisibleOnRoute()` used by both the frame path and
  `syncRouteVisuals`.
- `sceneOwners.ts` (39 lines): the `SceneCoordinatorOwners` bag contract,
  moved so both passes type owner access without importing the
  coordinator (no import cycle); SceneCoordinator re-exports the type, so
  every consumer keeps its import path.

`SceneCoordinator.ts` 957 → 374 lines. The remainder is the frame-facing
delegate surface, the owner read surface (adapter getters, query
predicates), route/scene policy (init orchestration, contact chapter
gating, route visuals, prewarm, resize) and disposal.

### Seam note (test follows the owner, per the phase 1 rule)

The motionParity suite's prototype seeding worked only while `update()`
read `_currentSectionIndex` as an accidentally-undefined field; the
machine extraction put that read behind a getter over a constructor-built
owner, so the seed threw. The suite now constructs the real coordinator
(and drives reduced motion through `setReducedMotion`) — the real wiring
is the seam those contracts were pinning; every assertion held unchanged.

### Deliberately kept (NEXT item 4.2 decision record)

- `_needsRender`/`_activitySnapshot` writers and the settle policy stay on
  Experience — extraction there has no honest owner.
- The carousel triangle (created by SectionGroups, initialized by
  Experience, driven by the coordinator/fade pass, disposed by
  SectionGroups) stays as is — same verdict as Inspection 14.
- The owner query predicates (`hasVisibleParticles`,
  `hasVisibleAmbientMotion`, `syncTypographyTheme`) stay on the
  coordinator: they are its read surface, and moving them would only
  re-home two-line loops.

Verification: prettier clean, tsc + vue-tsc green, eslint 0 errors (16
pre-existing warnings), vitest 118 files / 717 tests green (+5
scrollStates pins), docs:check 18 files / 36 links green, check:stdlib
28/28 + 5/5 green, build (incl. prerenders + sitemap) green, budgets
within gate (splash 2.83/5 — a 0.01 kB gzip drift from the new module
boundaries inside `chunk-experience`; vendor-three 298.65/350 and uikit
53.66/56 byte-identical), e2e chromium serial 27 passed / 1 skipped
(baseline parity).
