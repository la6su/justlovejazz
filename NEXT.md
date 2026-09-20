# Open work

Only unfinished outcomes. The user's task takes priority; no Vue/Tres migration
remains open. Implement one useful slice at a time and remove completed items.

## Brand implementation

Direction: [BRAND](docs/BRAND.md). Refine the existing console and shared world;
these are product slices, not prerequisites for unrelated work.

1. **Business positioning and copy:** align Home, Services and case narratives
   with BRAND: business context/data → directing decisions → solution → verified
   value. Explain automation and speed concretely; distinguish delivery speed
   from runtime performance. Remove music-led interpretations and unsupported claims.
2. **Typography and controls:** polish one representative Works screen in EN/RU,
   desktop/mobile and dark/inverse. Audit tiny metadata (`.jlz-meta-text` defaults
   to 0.62rem), spacing, focus and all control states; extend the proven pattern.
3. **Signature spatial transition:** prototype Works room → case using the
   existing installation/showreel owners. Coordinate aperture/material, camera
   and DOM timing; verify reversal/interruption, reduced motion and both backends.
   Resolve the shared still/video contract in this slice before generalizing it.
4. **Section spaces and microinteraction pass:** develop the route characters
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

## Audit cleanup (2026-09-17)

Post-transition audit of the current tree: no dead files, duplicate GPU
owners or untyped event paths remain; the findings below are bounded
single-owner slices. Confirmed decisions: minimal comment scope (wrong claims
only), orphaned placeholder assets stay until approved media arrive, the
cleanup batch runs before the brand slices and ships as one scoped branch/PR.
Verify each slice with focused tests, full local gate before publication.

1. **Dead i18n keys.** `blog.undercurrent.title`, `blog.glass.title`,
   `blog.rendering.title` (article titles belong to the SSG content sources)
   and `works.roomHint` have no runtime reader. Remove them from both EN/RU
   dictionaries; `src/__tests__/i18n.test.ts` uses `blog.undercurrent.title`
   as a parity probe key — replace it with a live key in the same slice.
2. **Stale migration comments (minimal scope).** Correct only claims that
   reference deleted owners or non-existent docs: `src/Experience/Renderer.ts:384` names
   the deleted `World.ts` and the removed classic `WebGLRenderer` path;
   `src/sections/works/scene.ts:17-18` cites the non-existent `RULES.md` and
   `R-3` issue code; `admin/vite-plugin.ts:13-15` still describes the legacy
   `page.json` wrap the code no longer performs. Pre-migration issue codes
   (A-001…A-015) and `Phase N` provenance notes stay as-is.
3. **Sections residue.** `src/sections/works/scene.ts` is the last file of the
   retired `sections/` tree and exports the legacy-named `createSection3`.
   Move the group factory next to its consumer in `Experience/Scene/`, rename
   the export, update the `SectionGroups` wiring and its tests. `PageId` stays
   in `sections/_shared/constants.ts` (a `routeManifest.ts` move would touch
   every importer without changing behavior — rejected for this slice).
4. **Dead Renderer parameter.** `Renderer.update()` accepts `_worldState` but
   never reads it (post parameters moved to `PostProcessingManager`);
   `Experience.ts` still passes it at the two draw sites. Drop the parameter
   from the signature and both call sites; the `worldState` consumers in
   Experience/coordinator are untouched. Verify renderer lifecycle tests.
5. **Lazy lifecycle consistency (deferred, optional).** `BakuCarousel` init
   (`Experience.ensureCarouselInitialized`) and the Lab gamepad use
   hand-rolled promise memoization and request counters that duplicate the
   `LazyStage` contract the five route stages already share. Convert both to
   `ensureLazyStage`/`disposeLazyStage` only if the conversion keeps the
   lifecycle tests green without new indirection; otherwise leave them and do
   not add a second abstraction layer. Not part of the first cleanup batch.

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
