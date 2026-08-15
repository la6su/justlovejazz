# Next work

This is the evidence-driven execution queue. The accepted program is the full
Vue 3, Vue Router and TresJS migration described in
[docs/MIGRATION_VUE_TRES.md](docs/MIGRATION_VUE_TRES.md). Work top to bottom;
do not start a phase whose entry gate has not passed.

## 1 — Active migration queue

- [x] **Finish Phase 0: freeze the pre-migration baseline** — the architecture
      plan and ADR foundation now exist. Capture a clean production manifest,
      route screenshots after Enter, WebGPU and forced-WebGL diagnostics,
      accessibility contracts and the full current release gate. Record only
      evidence that can be repeated during later phases. Forced WebGL home
      parity passed once Enter was awaited in its `is-ready` state; the remaining
      owner-visible resource soak and explicit root teardown now pass on a
      physical Android high-DPR device. The two-canvas composition is recorded
      as an intentional legacy boundary to remove in Phase 2/6.

- [ ] **Phase 1: select and scaffold the compatible toolchain** — verify current
      official releases and compatibility for Vue, Vue Router, TresJS and
      Three.js; pin the tested matrix; add SFC, type, test and bundle reporting
      without changing the production runtime. Reject dependencies that do not
      replace owned code or provide measured product/runtime value.

- [ ] **Calibrate OMP on ten bounded tasks** — delegate only low-risk S0/S1
      work during Phases 0–1, score first-pass accuracy, retries, latency,
      context size and Queen review cost in `docs/OMP_EVALUATION.md`. Pilot
      Graphify only if the recorded retrieval gate fails; do not add memory or
      indexing dependencies speculatively.

- [ ] **Continue fast-only OMP calibration on bounded S1 reads** — `fast` has
      passed the deterministic read fixture three times; collect the remaining
      evidence one narrow factual packet at a time. Keep `analyze` disabled
      until it passes its own fixture gate. Do not add memory, plugins or
      broader tools before a task class meets the documented accuracy and
      latency gate.

- [ ] **Phase 2: pass the representative unified-renderer gate** — exercise
      `WebGPURenderer` with WebGPUBackend and forced WebGLBackend against fog,
      representative materials, the full TSL post graph, environment, Works,
      GLTF/DRACO, reduced motion, lazy teardown and software-adapter policy.
      Keep the classic fallback until parity, idle, performance and resource
      soak gates pass.

- [ ] **Phase 3: extract framework-neutral contracts** — introduce the one
      route manifest, canonical world-slot tuple, bootstrap state machine,
      typed application/scene ports, render scheduler and resource scopes
      behind reversible legacy adapters. Remove duplicated facts as each new
      source gains tests and consumers.

- [ ] **Phase 4: migrate the development Page Builder to Vue** — use the
      isolated admin application as the first state-heavy Vue surface while
      keeping schema, validation, escaping and Less compilation pure. Preserve
      atomic save and keep the admin graph out of production.

- [ ] **Phase 5: migrate the public DOM shell and routing** — adopt AppShell,
      Vue Router, semantic route SFCs, UIkit lifecycle adapters, i18n/meta and
      prerendering one vertical slice at a time while the current Three runtime
      remains persistent behind a typed port.

- [ ] **Phases 6–10: cut over renderer, Tres scene owners and static content** —
      only after their gates pass, ship the unified renderer, persistent
      TresCanvas, one-by-one scene-owner migration, builder/blog SSG
      consolidation and final legacy removal. The migration is not done while
      duplicate routers, loops, renderer paths, owner adapters or undocumented
      dependencies remain.

## 2 — Deferred product queue

These outcomes remain valid but must not deepen a legacy boundary scheduled
for replacement. Pull one forward only when its migration dependency is clear.

- [ ] **Publish custom Page Builder pages through the frontend** — continue in
      Phase 9 after the Vue builder, route manifest and trusted component
      registry exist. Multi-page metadata, drag-and-drop, media and dynamic
      sources remain separate bounded outcomes.

- [ ] **Extend the cinematic brand language across every route** — tune motion
      and TSL response through the new component/scene owners, preserving both
      effective theme polarities and reduced-motion parity.

- [ ] **Complete the cross-backend runtime baseline** — finish real-mobile DPR
      evidence and preserve the current desktop reference as the pre-migration
      comparison rather than tuning two architectures simultaneously.

- [ ] **Validate the shared transition language** — complete direct entry,
      navigation, popstate, backend, theme, narrow-layout and reduced-motion QA
      as each Vue route slice replaces its legacy owner.

- [ ] **Finish the UIkit-first style ownership split** — carry the component
      boundaries into SFC and adapter ownership without duplicating layout or
      accessibility behavior.

- [ ] **Decide the fate of the vendored `references/` tree** — choose an
      external archive or separately approved history rewrite after licensing
      review.

- [ ] **Decide the final UIkit JS footprint** — measure retained Vue adapters
      against the current 75.8 KB gzip vendor chunk; replace behavior only with
      an equivalent accessible owner.

- [ ] **Configure production SPA/SSG hosting** — decide the hosting target and
      verify every route, blog document, asset and canonical URL against it.

- [ ] **Turn Works into evidence** — align approved facts and media around the
      same problem, response, role and proof after the Works scene owner moves.

- [ ] **Replace placeholder media and contact delivery** — ship measured media
      and a real contact endpoint after the target route/resource boundaries
      exist.

## 3 — Engineering policy

- Do not duplicate route, slot, metadata, preference or render-reason facts.
- Do not add a dependency without an owner, measured value, bundle impact and
  removal/replacement analysis.
- Prefer current stable library releases only after checking official release
  notes and the tested compatibility matrix; pin the accepted result.
- Preserve the working production path until its replacement passes, then
  remove the legacy path promptly rather than maintaining two architectures.
- A renderer or route phase cannot pass with memory/resource growth, duplicate
  animation loops, continuous idle draws or weakened startup/performance
  budgets.

## Plan maintenance

After completing an item, update this file in the same change: remove the
completed outcome, update the migration traceability/removal ledgers, capture
discovered work and reorder the remainder when evidence changes priority.
