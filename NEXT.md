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
2. **Evidence report metadata.** The live/soak console filters are strict now
   (every `console.error` is captured; nothing broad is excluded), but the
   generated reports do not record the revision/dirty state or backend identity
   the evidence protocol requires. Add that metadata to the
   `scripts/phase7-live-gate.ts` and `scripts/phase10-route-cycle-soak.ts`
   reports; regenerate on each tool's supported server.
3. **Cheap docs check.** Add local file/heading-link validation for tracked
   Markdown to existing Bun tooling; exclude external URLs and historical
   evidence payloads. No new framework.
4. **Two-branch delivery workflow (user-deferred).** The remote `dev` branch
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
parameter) shipped in #216. One deferred item remains:

1. **Lazy lifecycle consistency (deferred, optional).** `BakuCarousel` init
   (`Experience.ensureCarouselInitialized`) and the Lab gamepad use
   hand-rolled promise memoization and request counters that duplicate the
   `LazyStage` contract the five route stages already share. Convert both to
   `ensureLazyStage`/`disposeLazyStage` only if the conversion keeps the
   lifecycle tests green without new indirection; otherwise leave them and do
   not add a second abstraction layer.

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
