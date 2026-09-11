# Next work

The only active task queue. Read AGENTS.md, then AGENT_HANDOFF.md for the
working-tree checkpoint. Source/tests override prose. Historical completed
checklists are available in Git before this documentation consolidation.

## Priority order

- [ ] Review ADR 0008 (three delivery budget) by its 2026-09-15 due date.
      The ADR requires a generated import-closure bundle breakdown on current
      HEAD (the recorded profile covers b37b860 only) compared against
      WebGPU/WebGL fallback, startup, idle, resource and
      one-renderer/one-loop evidence; then confirm the 350 kB budget or
      propose a change with user sign-off. Measured shared three vendor:
      298.43–298.44 kB gzip (~52 kB headroom). Slices: generate the breakdown
      into docs/evidence/bundle-breakdown/ → append the dated review note to
      the ADR (records stay immutable; a budget change gets a follow-up ADR).
      Acceptance: dated review note exists; no budget move without user
      sign-off. Decision owner: engineering; user signs off any budget
      change.

- [ ] Generalize the Showreel shader theater transition for Works case media
      (design-first; the only open engineering item with unresolved design
      questions). Goal: one media presentation path for the showreel film and
      Works case media, keeping the shared DOM FullscreenOverlay as the
      presentation/Escape owner and the GPU slice transition
      ShowreelTheater-specific unless the design generalizes it.
      Open questions to settle in the design slice, before code: 1. Media contract — what a case may declare: still image (today via
      FullscreenOverlay), video (today via ShowreelTheater and its
      load-on-first-open film), or mixed; one typed shape for all. 2. Metadata handoff — which module declares per-case media
      (src/Data/CaseStudies.ts vs per-case data) and how the presentation
      layer receives it without new event ports. 3. Ownership split — does every case get the shader transition
      (theater generalized) or does the theater stay showreel-only with
      FullscreenOverlay extended? 4. Behavior parity — reduced-motion snap, Space/Esc/focus contract,
      narrow viewport and mobile DPR handling.
      Slices (one reviewable outcome each): contract types + unit tests with
      no runtime change → case data wired to the contract → first case
      end-to-end → chrome generalization only if the design chose it.
      Acceptance: contract pinned by tests; budgets unchanged; 23 passed /
      1 documented skip serial e2e still green. Decision owner: engineering;
      the user decides whether every case receives the shader transition.

- [x] Validate ownership teardown: host-first/runtime-first unmount, stale
      primitive replacement, exactly-once geometries/materials/instance cleanup.
      Works installation controller replacement, Vue-first/runtime-first child
      teardown and the Contact/Manifesto/CasePlane final-owner shared-plane
      release were already covered. On 2026-09-11 the remaining evidence
      landed: Experience.destroyOwnership.test.ts pins the runtime-destroy
      boundary (Experience-owned owners released exactly once, Vue-owned
      EnvSphere and ServicesStage survive until the host's Vue unmount, PMREM
      environment released, repeated destroy idempotent, Renderer.dispose
      exactly-once), and the provably dead SceneCoordinator → ServicesStage
      terminal dispose was removed with the ownership docs aligned. Contact
      re-verified in the browser on the WebGLBackend path (dev, deep-link +
      Enter: Cyprus, typography and story cards render, console clean);
      physical WebGPU parity stays manual-only per the standing backend
      evidence limits.
- [x] Consolidate deterministic checks: reuse existing Bun and CI commands;
      targeted checks during edits and one full release gate. On 2026-09-08 the
      local gate passed format, lint (0 errors), TypeScript, Vue TypeScript,
      production build, budgets, 705 unit tests and serial Playwright (23
      passed, 1 expected skip). No new dependency or recurring model polling.
- [x] Complete Services declarative geometry as a separate optional slice.
      ServicesStageGeometry.vue now declares meshes and geometries in the Tres
      template; onMounted only adopts refs and applies runtime transforms.
- [x] Audit retained owners with concrete ownership evidence. TSL, loading and
      animation alone do not rule out declarative leaves, so declarative-leaf
      decisions stay per-owner and evidence-gated; keep the existing
      renderer/recovery/scheduler unless a measured problem justifies
      replacement. On 2026-09-11 the allocation audit closed with no per-frame
      allocations left: SplashCube._blendColor, BakuCarousel
      _tmpStreamPos/_tmpRingRot, ContactCyprusStage._cameraPosition, EnvSphere
      preallocated face colors, DrawTrail camera-basis vectors,
      ParticleBurst._dummy and JunniParticles (rebuild only on setCount) all
      render from scratch fields, matching the earlier ServicesStage offset
      reuse.
- [x] Adopt the unsubs[] eventBus teardown convention (ShowreelConsole is the
      reference) in ExperienceUI, UIMenu and CinematicNav at their next touch;
      the per-field _*Unsub bookkeeping is correct but triplicated. On
      2026-09-11 the ponytail sweep converted all three to the single
      `private readonly _unsubs` array (push on subscribe, drain in dispose).
- [x] Close the documentation residue of the transition. On 2026-09-11 the
      Tres transition record was re-issued as a frozen completion record
      (Services ownership row corrected to the shipped declarative template
      geometry, dangling baseline hash and dead soak link fixed, archive
      tense aligned); ARCHITECTURE.md contracts were realigned with the code
      (storyState contract, RenderActivity reasons, count-free event-port
      prose); DEVELOPMENT.md dangling sentences were repaired and the dev-only
      ?force-webgl-backend=1 seam documented; PAGE_BUILDER.md now describes
      the shipped multi-document collection with build-time /p/<slug>
      publishing; migration-era process framing was retired from
      CONTRIBUTING/AGENTS/BRAND and the docs/README.md archive link repaired.
      A full-doc audit found no remaining transition blocker.
- [ ] Strengthen evidence scripts (phase10-route-cycle-soak, phase7-live-gate,
      visual-parity): narrow overly broad GPU error exclusions; identify
      skipped cases in the summary; record revision/backend in every report;
      measure frame deltas during an idle interval; distinguish runtime
      destroy from Vue root unmount in the destroy summary. Slices: one
      script concern per commit, each run against the production preview as
      today. Acceptance: a regenerated soak report whose failures mean what
      they claim — no exclusion hides a real error, and skipped cases are
      visible instead of silent. Decision owner: engineering.
- [ ] Incrementally condense ARCHITECTURE.md (918 lines) and
      PERFORMANCE_BASELINE.md (691 lines) by topic; preserve contracts and
      dated evidence. Two known gaps to fold in: (a) the codebase map —
      roughly seventeen src/core and data modules (DeviceCapability,
      pageMeta/pageMetaData, the blog trio, bootstrapStates, caseStudies,
      routeContinuation, FrameGapStats, RuntimeResourceSnapshot,
      sitemapEntries, worksExperience, toneMappingGuard, the
      CaseStudies/Projects data modules, Utils/dispose) are never named in
      current docs — either name them by topic or record that they sit
      intentionally below the documented layer; (b) a local Markdown link
      check added to existing tooling once its expected scope is defined
      (2026-09-11's audit found exactly one broken link, so the check can
      stay cheap). Decision owner: engineering.

## Product outcomes

- [ ] Verify Works composition at ultrawide and short landscape sizes on both
      physical backends; author distinct project scenes and meaningful case
      chapters. Autonomously executable: the viewport × backend matrix as e2e
      plus screenshots, and the engineering side of distinct per-project
      scenes. Needs the user: art direction and copy for the distinct
      project scenes and case chapters. Acceptance: evidence report per
      viewport × backend; authored scenes visible in the case flow. Decision
      owner: user (art direction); engineering (execution).
- [ ] Replace the current clearly labelled studio placeholders for Porsche
      911 Spider, Alise, 19 Lab and Pro193 with approved renders, screenshots
      and proof. Keep bilingual copy factual; do not publish client or
      performance claims without approval. Blocked on user-supplied approved
      media; preparable autonomously: the media pipeline (sizes, posters,
      lazy load) and data slots. Note: the 16.3 MB coming-soon.mp4 — the
      largest public asset and the ShowreelTheater film placeholder —
      resolves through this item once an approved reel exists. Decision
      owner: user (media and claims); engineering (pipeline).
- [ ] Verify production SPA/SSG routes, blog documents, assets and canonical
      URLs. Locally verifiable against vite preview plus the prerender
      outputs; final evidence requires the real hosting environment, so this
      needs the deployment target from the user. Decision owner: user
      (environment); engineering (verification matrix run).
- [ ] Implement real contact delivery with separately authorized service
      setup. Blocked until the user authorizes a provider and credentials —
      nothing to build before that decision; the current UI path stays
      honest about being non-delivering. Decision owner: user.

## Deferred

- Physical WebGL device-loss restoration is deferred by the user, not passed.
  Manual Contact/Manifesto checks were reported successful; automated physical
  evidence must be identified separately. Unblocks when a physical
  browser/driver that restores its framebuffer is available for the repeat
  gate (archive audit queue item 2). The recovery path stays unit-pinned; no
  code change is planned for this item.

## Done means

One reviewable outcome, relevant tests, no unrelated changes, explicit remaining
limitations. Full gates follow docs/DEVELOPMENT.md. Keep one canvas, renderer,
loop owner and typed route/event ports. Do not restart completed Works slices.
