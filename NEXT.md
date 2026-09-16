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

1. **Reliable bundle review.** Fix `scripts/bundle-breakdown.ts`: its broad
   `vendor-three-*` lookup can select Contact addon chunks; `source-map` is only
   an optional transitive Less dependency; reruns overwrite the same report.
   Select the shared vendor exactly, make dependencies explicit and retain run
   identity. Then refresh the pending Three delivery review with current gzip,
   startup/backend/idle/resource evidence. Keep existing budgets unless a change
   has a measured rationale within the task scope.
2. **Trustworthy runtime evidence.** Live/soak filters currently ignore broad
   `/WebGPU/` and bootstrap-failure messages. Narrow exclusions, expose skips,
   record revision/backend, measure idle frame deltas and distinguish runtime
   destroy from Vue unmount. Regenerate reports on each tool's supported server.
3. **Align CI with the documented runtime gate.** `.github/workflows/lighthouse.yml`
   omits `type-check:vue` and runs parallel `test` instead of `test:serial`.
   Reconcile these with the local gate, avoiding duplicate checks.
4. **Remove builder compatibility residue.** `admin/vite-plugin.ts` reads legacy
   `page.json` and accepts a bare save body; `documents.ts` retains the migration
   helper. Check callers, remove obsolete paths/tests, keep the collection and
   `{ slug, document }` API. Do not remove the required Three package seam.
5. **Cheap docs check.** Add local file/heading-link validation for tracked
   Markdown to existing Bun tooling; exclude external URLs and historical
   evidence payloads. No new framework.

## Product / input needed

- **Works:** check ultrawide/short-landscape layouts on physical WebGPU and
  WebGLBackend as the brand slices land. Follow BRAND for scene direction;
  approved case-specific copy and proof still come from the user.
- **Media:** replace labelled Porsche 911 Spider, Alise, 19 Lab, Pro193 and reel
  placeholders when approved assets/proof arrive. Prepare posters/sizes/lazy load.
- **Deployment:** verify SPA deep links, blog/builder HTML, assets and canonical
  URLs locally, then on the actual host; deployment target is needed.
- **Contact:** connect real delivery once the user chooses/authorizes a provider;
  keep the current non-sending form honest.

Physical WebGL device-loss restoration remains user-deferred until a suitable
browser/driver is available. Unit tests and manual route smoke do not close it.
