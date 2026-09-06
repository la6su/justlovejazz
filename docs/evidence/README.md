# Evidence runbook

This directory stores reproducible, machine-readable verification artifacts.
Evidence is append-only: never overwrite a prior report or silently replace a
baseline value. Every new artifact must carry a UTC timestamp, the commit under
test, the command, environment/viewport, backend and result.

## Producers

| Directory                   | Producer                                  | Purpose                                                                      |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `phase7-live-gate/`         | `bun scripts/phase7-live-gate.ts`         | representative WebGPU/WebGLBackend readiness, rendering, pacing and teardown |
| `phase10-route-cycle-soak/` | `bun scripts/phase10-route-cycle-soak.ts` | route-cycle resource plateau and root-destroy baseline                       |
| `mobile-resize-gate/`       | mobile resize/viewport gate               | real mobile DPR and resize propagation                                       |
| `visual-parity/`            | `bun scripts/visual-parity.ts`            | backend screenshots, masks, diffs and metadata                               |
| `bundle-breakdown/`         | `bun scripts/bundle-breakdown.ts`         | chunk and delivery budget observations                                       |

JSON reports are the source for numeric claims. PNGs and their `.meta.json`
files are visual evidence, not substitutes for a report. `docs/` links to
evidence; it does not duplicate large payloads in prose.

## Naming and review

Use `<UTC-ISO>-report.json` for a run report, or
`<commit>-<scope>-<backend>-<UTC>.png` for a visual capture. Keep the commit
SHA and tool version in the report. Review agents should check that the report
is from the current commit or explicitly label it historical.

When updating `docs/PERFORMANCE_BASELINE.md`, append a dated observation and
retain the previous row. A failed or partial run is recorded as such; it is
never converted into a passing baseline by editing the JSON.

## Agent procedure

1. Check `git status --short` and record the commit under test.
2. Run the narrowest producer that proves the changed contract.
3. Inspect the generated JSON and verify backend, viewport, DPR and result.
4. Add a short dated baseline note only when the metric is comparable.
5. Link the artifact path in the commit or review notes; do not publish
   credentials, private URLs, cookies, API keys or raw user data.

The shared transition matrix is recorded in
`shared-transition-qa/2026-08-25-transition-matrix.json`.
