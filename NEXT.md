# Next work

The only active task queue. Read AGENTS.md, then AGENT_HANDOFF.md for the
working-tree checkpoint. Source/tests override prose. Historical completed
checklists are available in Git before this documentation consolidation.

## Priority order

- [ ] Validate ownership teardown: host-first/runtime-first unmount, stale
      primitive replacement, exactly-once geometries/materials/instance cleanup.
      User-reported Contact instability remains unverified visually.
- [x] Consolidate deterministic checks: reuse existing Bun and CI commands;
      targeted checks during edits and one full release gate. On 2026-09-08 the
      local gate passed format, lint (0 errors), TypeScript, Vue TypeScript,
      production build, budgets, 705 unit tests and serial Playwright (23
      passed, 1 expected skip). No new dependency or recurring model polling.
- [ ] Complete Services declarative geometry as a separate optional slice.
      ServicesStageGeometry.vue currently creates meshes in onMounted; its Vue
      lifecycle wrapper is not fully declarative composition.
- [ ] Audit retained owners with concrete ownership evidence. TSL, loading and
      animation alone do not rule out declarative leaves. Keep the existing
      renderer/recovery/scheduler unless a measured problem justifies replacement.
- [ ] Strengthen evidence scripts: narrow overly broad GPU error exclusions;
      identify skipped cases, record revision/backend, measure frame deltas during
      an idle interval and distinguish runtime destroy from Vue root unmount.
- [ ] Incrementally condense ARCHITECTURE.md and PERFORMANCE_BASELINE.md by
      topic; preserve contracts and dated evidence. Add local Markdown link checks
      to existing tooling once their expected scope is defined.

## Product outcomes

- [ ] Verify Works composition at ultrawide and short landscape sizes on both
      physical backends; author distinct project scenes and meaningful case chapters.
- [ ] Replace the current clearly labelled studio placeholders for Porsche 911
      Spider, Alise, 19 Lab and Pro193 with approved renders, screenshots and
      proof. Keep bilingual copy factual; do not publish client or performance
      claims without approval.
- [ ] Verify production SPA/SSG routes, blog documents, assets and canonical URLs.
- [ ] Implement real contact delivery with separately authorized service setup.

## Deferred

- Physical WebGL device-loss restoration is deferred by the user, not passed.
  Manual Contact/Manifesto checks were reported successful; automated physical
  evidence must be identified separately.

## Done means

One reviewable outcome, relevant tests, no unrelated changes, explicit remaining
limitations. Full gates follow docs/DEVELOPMENT.md. Keep one canvas, renderer,
loop owner and typed route/event ports. Do not restart completed Works slices.
