# Open work

Only unfinished outcomes. The user's task takes priority; the declarative
transition continues slice by slice (see Engineering 4). Implement one useful
slice at a time and remove completed items.

## Brand implementation

Direction: [BRAND](docs/BRAND.md). Refine the existing console and shared world;
these are product slices, not prerequisites for unrelated work. Business
positioning and copy for Home/Services is aligned with BRAND (business-first
language, concrete automation, delivery speed separated from runtime
performance, no music-led interpretations); the case chapters in
`src/Data/CaseStudies.ts` already follow the BRAND chapter structure with
factual claims until approved proof arrives.

1. **Typography and controls:** polish one representative Works screen in EN/RU,
   desktop/mobile and dark/inverse. Audit tiny metadata (`.jlz-meta-text` defaults
   to 0.62rem), spacing, focus and all control states; extend the proven pattern.
2. **Signature spatial transition:** prototype Works room → case using the
   existing installation/showreel owners. Coordinate aperture/material, camera
   and DOM timing; verify reversal/interruption, reduced motion and both backends.
   Resolve the shared still/video contract in this slice before generalizing it.
3. **Section spaces and microinteraction pass:** develop the route characters
   in BRAND incrementally; share materials/motion rules, not identical scenes.
   Polish entry, hover/press, loading, exit and return; keep mobile composition
   and settled render demand intentional.

## Engineering

Reconciled with the 2026-09-17 audit against main @ f155b188: the CI gate and
the builder compatibility residue are closed in code (CI already runs
`type-check:vue` + `test:serial`; the admin save endpoint is strictly
`{ slug, document }` with no legacy `page.json` wrap), so those queue items are
retired. `scripts/bundle-breakdown.ts` now selects the shared vendor exactly
(`scripts/build-assets.ts` excludes the Contact addon chunks), depends on
`source-map-js` directly and writes run-unique reports. Remaining:

1. **Three delivery review.** The breakdown data is current (see the
   2026-09-26 reports under `docs/evidence/bundle-breakdown/`): the shared
   chunk is pure three.js again (the three-stdlib modules moved into the lazy
   `vendor-lab-controls` chunk, 37.5 kB gzip) and every budget holds. What
   remains is the judgment call on startup/backend/idle behavior, which needs
   the live/soak evidence below. Keep existing budgets unless a change has a
   measured rationale within the task scope.
2. **Evidence report regeneration.** The live/soak reports now record the
   evidence protocol's revision/dirty state, command and browser identity
   (shared `scripts/evidence-meta.ts`, bundle-tool convention; per-run
   backend identity stays the `data-engine` attribute plus the captured
   host-ready log). Bundle breakdowns are regenerated on every delivery
   slice (`bun scripts/bundle-breakdown.ts`, one build, one report per
   vendor chunk). Remaining: regenerate each live/soak report on its
   supported server.
3. **Two-branch delivery workflow (user-deferred).** The remote `dev` branch
   is a 2026-07-28 relic whose commits are superseded by the migration; the
   user wants `dev` as the integration branch (scoped PRs land there, then the
   user verifies in a real browser before `dev` → `main`). When picked up:
   back up the relic with a tag, reset `dev` to `main`, add `dev` to the CI
   trigger in `.github/workflows/lighthouse.yml`, and update the Git delivery
   wording in [DEVELOPMENT](docs/DEVELOPMENT.md) (§ Git delivery) and the
   release skill (`skills/justlovejazz-release/SKILL.md` — the "PR against
   `main`" rule is the one that changes).
4. **Declarative transition — boot-static owners (closed 2026-09-27: the six
   route-owned lazy stages).** All six lazy stages now mount through
   `SceneStagePorts` (one `createStageSlot` + one `<primitive>` per port;
   Inspection 17) — no runtime `scene.add` is left in the lazy-stage path.
   The next seam from the same audit: `SplashCube`, `ParticleBurst` and
   `DrawTrail` are still constructed + `scene.add`-ed imperatively in
   `Experience.buildWorld`. Following the CinematicLights/GroundPlane
   pattern, the declarative object (mesh/instanced-mesh leaves + readySlot)
   moves into `app/scene/` while the behavior (jelly/opener, TSL trace
   material, pointer history) stays an imperative controller that adopts the
   nodes. Scope it as its own slice: SplashCube alone is a ~535-line
   object+controller fusion that needs the split. The TvT reference
   (`hawk86104/three-vue-tres`) was audited under the "adoption is audited,
   not assumed" rule (Inspection 17): nothing adopted wholesale — the four
   candidate patterns are already present or rejected on Inspection 10
   grounds; this queue item comes from our own seam audit.

## Audit cleanup (2026-09-17)

The 2026-09-17 post-transition audit found no dead files, duplicate GPU
owners or untyped event paths; the bounded slices it listed (dead i18n keys,
stale owner comments, the dead `Renderer.update` parameter) shipped in #216.
The `sections/` residue closed 2026-09-27: `PageId` moved into
`core/routeManifest.ts` (its true owner — the manifest is the path + page
source of truth) and the directory is gone. The god-class split closed
2026-09-27 on both sides (Inspections 14–15): Experience (StageRegistry,
ShowreelController, SceneEnvironment, FpsTracker) and SceneCoordinator
(SectionStateMachine, SceneTransformPass, SceneFramePass over the shared
`sceneOwners` bag) are honest single-concern owners behind the unchanged
public surfaces; the intentionally-unextracted remainder
(`_needsRender`/`_activitySnapshot` writers, settle policy, carousel
triangle) is recorded in Inspection 15. The last deferred item is closed:

1. **Lazy lifecycle consistency (closed 2026-09-25).** The Lab gamepad now
   runs through the shared `ensureLazyStage`/`disposeLazyStage` flow — its
   hand-rolled promise memoization, request counter and teardown lines are
   gone. The BakuCarousel init intentionally stays hand-rolled (decision
   recorded on `Experience.ensureCarouselInitialized`): the instance is
   created and disposed by the SectionGroups owner, LazyStage's failure path
   would null the live scene-graph reference, and a home-only owner that is
   never disposed per route does not fit the stage contract — converting it
   would add the second abstraction layer this item was gated against.

## Product / input needed

- **Works:** check ultrawide/short-landscape layouts on physical WebGPU and
  WebGLBackend as the brand slices land. Follow BRAND for scene direction;
  approved case-specific copy and proof still come from the user.
- **Media:** replace labelled Porsche 911 Spider, Alise, 19 Lab, Pro193 and reel
  placeholders when approved assets/proof arrive. Prepare posters/sizes/lazy
  load. The current `public/assets/projects/` folders (`ebb-vibes/`,
  `mono-sunday/`, `nocturne-blue/`, `till-at-night/`) hold the ACTIVE case
  covers — each is swapped in the same change that lands its approved
  replacement, so no unreferenced residue remains in between.
- **Deployment:** verify SPA deep links, blog/builder HTML, assets and canonical
  URLs locally, then on the actual host; deployment target is needed.
- **Contact:** connect real delivery once the user chooses/authorizes a provider;
  keep the current non-sending form honest.

Physical WebGL device-loss restoration remains user-deferred until a suitable
browser/driver is available. Unit tests and manual route smoke do not close it.
