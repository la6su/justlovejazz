# Next work

This file is the active outcome queue. The Vue 3, Vue Router and TresJS
migration is complete; its phase history, acceptance gates and removal ledger
are preserved in [`docs/archive/MIGRATION_VUE_TRES.md`](docs/archive/MIGRATION_VUE_TRES.md).
Do not reopen completed migration phases. Current runtime contracts are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); verification is in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## Active engineering queue

- [x] **Complete documentation reconciliation** — finish the remaining
  README/architecture wording review, keep evidence append-only and ensure
  agent-operation guidance stays separate from project contracts.
- [ ] **Harden async route-owner cancellation** — add generation guards to
  `ExperienceUI` route-change promises so late Works/Contact initializers
  cannot raise demand or touch a stage after a fast route exit.
- [ ] **Audit scene resource disposal** — verify `SectionGroups.dispose()`
  covers `Points` and `InstancedMesh` resources and add lifecycle evidence.
- [ ] **Close the shared transition QA matrix** — direct entry, in-app route,
  popstate, backend fallback, theme polarity, narrow layout and reduced motion.

## Deferred product queue

- [ ] **Extend published builder pages** — add only bounded local capabilities
  after the current EN/RU static publishing contract; remote/network sources
  remain deferred until an explicit security and caching design exists.
- [ ] **Extend the cinematic brand language** — tune motion and TSL response
  across every route while preserving backend and reduced-motion parity.
- [x] **Cross-backend runtime baseline** — desktop and physical Android
  resize/DPR evidence is recorded under `docs/evidence/`.
- [ ] **Finish the UIkit-first style ownership split** — keep component,
  layout and accessibility behavior single-owned by Vue/UIkit adapters.
- [ ] **Decide the fate of vendored `references/`** — archive or retain after
  licensing review; do not publish it accidentally.
- [ ] **Configure production SPA/SSG hosting** — verify every route, blog
  document, asset and canonical URL against the selected host.
- [ ] **Turn Works into evidence** — align approved facts and media around the
  same problem, response, role and proof.
- [ ] **Replace placeholder media and contact delivery** — ship measured media
  and a real contact endpoint after the route/resource boundaries are ready.

## Engineering policy

- Do not duplicate route, slot, metadata, preference or render-reason facts.
- Do not add a dependency without an owner, measured value, bundle impact and
  removal/replacement analysis.
- Check official release notes and the tested compatibility matrix before
  upgrading Vue, TresJS, Three.js or supporting packages.
- Prefer one coherent bounded outcome per commit; update this queue with the
  same change that completes the outcome.
- A release cannot pass with resource growth, duplicate animation loops,
  continuous settled draws or weakened startup/performance budgets.
