# Open work

Only unfinished outcomes. The user's task takes priority; no Vue/Tres migration
remains open. Implement one useful slice at a time and remove completed items.

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

1. **Three delivery review.** Run the fixed breakdown tool and refresh the
   pending Three delivery review with current gzip, startup/backend/idle and
   resource evidence. Keep existing budgets unless a change has a measured
   rationale within the task scope.
2. **Evidence report regeneration.** The live/soak reports now record the
   evidence protocol's revision/dirty state, command and browser identity
   (shared `scripts/evidence-meta.ts`, bundle-tool convention; per-run
   backend identity stays the `data-engine` attribute plus the captured
   host-ready log). Remaining: regenerate each report on its supported
   server.
3. **Two-branch delivery workflow (user-deferred).** The remote `dev` branch
   is a 2026-07-28 relic whose commits are superseded by the migration; the
   user wants `dev` as the integration branch (scoped PRs land there, then the
   user verifies in a real browser before `dev` → `main`). When picked up:
   back up the relic with a tag, reset `dev` to `main`, add `dev` to the CI
   trigger in `.github/workflows/lighthouse.yml`, and update the Git delivery
   wording in AGENTS.md and DEVELOPMENT.md.

## Audit cleanup (2026-09-17)

The 2026-09-17 post-transition audit found no dead files, duplicate GPU
owners or untyped event paths; the bounded slices it listed (dead i18n keys,
stale owner comments, the last `sections/` file, the dead `Renderer.update`
parameter) shipped in #216. The last deferred item is closed:

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
  load. The unreferenced placeholder folders under `public/assets/projects/`
  (`crimson-hours/`, `indigo-drift/`, `velvet-echo/`, `undercurrent/`) stay
  until that replacement and are removed in the same change.
- **Deployment:** verify SPA deep links, blog/builder HTML, assets and canonical
  URLs locally, then on the actual host; deployment target is needed.
- **Contact:** connect real delivery once the user chooses/authorizes a provider;
  keep the current non-sending form honest.

Physical WebGL device-loss restoration remains user-deferred until a suitable
browser/driver is available. Unit tests and manual route smoke do not close it.
