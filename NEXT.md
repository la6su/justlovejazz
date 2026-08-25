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
- [x] **Harden async route-owner cancellation** — `ExperienceUI` route-change
  promises now use a shared generation/page predicate, so late Works/Contact
  initializers cannot raise demand or touch a stage after a fast route exit;
  renderer recovery, carousel wake, UIkit hydration, overlay reveal, content
  hydration, submenu reconciliation, detached text animation and hash dispatch
  now cancel stale continuations at their owning boundary.
- [x] **Audit scene resource disposal** — `SectionGroups.dispose()` now uses
  owner-local texture slots and generalized Mesh/Points/Line/Sprite disposal;
  lifecycle coverage includes `Points` and `InstancedMesh` exactly-once tests.
- [x] **Close the shared transition QA matrix** — direct entry, in-app route,
  popstate, backend fallback, theme polarity, narrow layout and reduced motion;
  coverage is recorded in `docs/evidence/shared-transition-qa/`.
- [x] **Remove the final DOM route read** — `routePage` owns the current
  `PageId` entirely in memory; Vue route roots own semantic page markers and
  no runtime route state is projected to body/document datasets.
- [x] **Remove the dormant Contact pixel-title owner** — deleted the unused
  `ContactTextStage`/`PixelTextScreen` path and its render-demand flag; Contact
  presentation remains owned by the semantic Vue view and live typography/
  Cyprus stages.
- [x] **Cancel readiness fallback timers** — first-frame readiness now clears
  its bounded timeout, and Experience teardown cancels the gate without
  allowing a destroyed instance to publish `jlz:webgl-ready`.
- [x] **Remove the Camera DOM route read** — camera home-route tuning now uses
  the typed `routePage` port instead of `document.body.dataset.page`.
- [x] **Cancel route-announcer RAF** — `useJlzPage` now invalidates the deferred
  accessibility announcement when a route root unmounts.
- [x] **Coalesce lazy portfolio initialization** — concurrent UI entry points
  now share one owner promise; failures are contained and can retry cleanly.
- [x] **Retry failed carousel initialization** — a rejected home-carousel
  load now clears its owner promise while successful initialization remains
  idempotent.
- [x] **Cancel portfolio readiness RAF** — ExperienceUI teardown now cancels
  the deferred scene-readiness frame and releases its pending continuation.
- [x] **Cancel stale CinematicNav frames** — route track rebinding now clears
  pending scroll/focus RAFs before attaching the new route track.
- [x] **Remove ineffective Projects dynamic import** — ExperienceUI now uses
  the existing static project-data owner instead of a non-splitting import.
- [x] **Keep Contact typography addons route-local** — the lazy Contact
  typography stage now owns `FontLoader` and `TextGeometry` in a separate
  chunk, so other routes do not download those addons; the shared Three.js
  budget excludes only this measured route-local asset.
- [x] **Reduce the shared Three.js vendor below budget** — a scoped bare-
  `three` compatibility entry now re-exports `three/webgpu` and retains only a
  dead-path `WebGLRenderer` symbol required by TresJS 5.8.3. The production
  vendor measures 298.43 kB gzip against the 350 kB gate; WebGPU/WebGLBackend
  runtime and route/lifecycle gates remain green. The exact global alias and
  any removal of the compatibility symbol remain prohibited until upstream
  TresJS ships an equivalent slim entry.
- [x] **Make UIMenu teardown deterministic** — the persistent shell now uses
  one delegated click owner and removes it explicitly instead of retaining
  five anonymous control listeners until DOM garbage collection.
- [x] **Scope FullscreenOverlay listeners** — media/control/poster listeners
  now share one `AbortController` owner and are cancelled atomically during
  teardown, alongside the existing document keyboard and modal cleanup.
- [x] **Clear the bootstrap readiness watchdog** — the 60-second failed-boot
  timer is now owned by `entry-app` and cancelled as soon as readiness or an
  explicit failure arrives, including before a retry.
- [x] **Delegate WorkCards clicks per grid** — card activation keeps its
  debounce and project event contract while each grid owns one listener
  instead of one listener per card; disposal removes the grid owners and
  their release timers together.
- [x] **Keep secondary route views out of startup** — `HomeView` remains the
  eager landing target, while the five secondary Vue route views use explicit
  route-level imports; the measured `app` chunk fell from 10.00 kB to 3.37 kB
  gzip without changing the persistent Tres scene owner.
- [x] **Cancel video poster reveal callbacks** — `FullscreenOverlay` now owns
  and cancels its nested first-frame RAF or `requestVideoFrameCallback` during
  media replacement, modal hide and disposal.
- [x] **Move persistent UIkit hydration to UIMenu** — the shell now hydrates
  its own icons/tooltips at construction; the bootstrap no longer schedules a
  duplicate global idle traversal of `#spa-content`, reducing `entry-app` from
  7.30 kB to 6.99 kB gzip.
- [x] **Scope ContentReveal to the route root** — section activation, lookup
  and UIkit refresh now operate inside `#spa-content`, leaving unrelated
  persistent or detached sections untouched during navigation.
- [x] **Align Experience DOM lookups with the route root** — section eyebrows
  and initial-section activation now use the same `#spa-content` owner, with a
  bootstrap-only document fallback before Vue mounts.
- [x] **Complete route-content DOM scoping** — bootstrap section/page-section
  signals and title observers now use the same route root; splash controls and
  persistent-shell selectors remain intentionally global.
- [x] **Scope WorkCards to the route root** — card discovery, delegated grid
  owners and roving tabindex now stay inside `#spa-content`; detached and
  persistent-shell grids remain outside the route owner.

## Deferred product queue

- [x] **Extend published builder pages** — publish an escaped EN/RU `hreflang`
  matrix with an `x-default` alternate while keeping canonical
  self-referential; remote/network sources remain deferred until an explicit
  security and caching design exists.
- [ ] **Extend the cinematic brand language** — tune motion and TSL response
  across every route while preserving backend and reduced-motion parity.
- [x] **Cross-backend runtime baseline** — desktop and physical Android
  resize/DPR evidence is recorded under `docs/evidence/`.
- [ ] **Finish the UIkit-first style ownership split** — keep component,
  layout and accessibility behavior single-owned by Vue/UIkit adapters.
  - [x] Builder card base radius/shadow and button radius now come only from
    UIkit hooks; project Less retains only builder-specific surface and variant
    rules, preserving separate `cardRadius`/`buttonRadius` tokens.
  - [x] Bootstrap UIkit refresh is scoped to `#spa-content`, preventing a
    document-wide traversal across the splash and persistent shell.
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
