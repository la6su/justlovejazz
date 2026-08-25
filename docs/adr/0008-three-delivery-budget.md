# ADR 0008: Keep the Three.js delivery budget evidence-gated

- Status: Accepted with gate
- Date: 2026-08-24

## Context

The production build currently emits one shared `vendor-three` asset at
381.15 kB gzip (gzip level 6), while the existing delivery budget is 350 kB.
The splash startup remains 2.70 kB gzip, and the build contains one Three.js
runtime with the unified `WebGPURenderer` and automatic `WebGLBackend`
fallback. The excess is concentrated in the required Three WebGPU/TSL runtime;
moving modules between chunks would change loading shape but not reduce total
bytes delivered for the scene.

## Decision

Keep the 350 kB budget as a failing performance guard. Do not raise it and do
not hide the failure behind a chunking-only change. Treat the measured 31.15 kB
variance as an open optimization gate until a safe reduction is demonstrated
without removing the WebGPU path, fallback, scene features, or lifecycle
guarantees.

The next review must include a generated bundle breakdown and compare any
candidate change against WebGPU/WebGL fallback, startup, idle, resource and
one-renderer/one-loop evidence. Revisit this ADR by 2026-09-15 or sooner when
an upstream Three/TresJS update or a proven import reduction is available.

## Review — 2026-08-25

The required generated import-closure profile is recorded in
`docs/evidence/bundle-breakdown/b37b860-vendor-three.json`. It attributes the
shared chunk primarily to `three.webgpu.js`, `three.core.js` and
`three.module.js`. Two safe experiments were measured from the same checkout:
converting all runtime `import * as THREE` sites to named imports and testing
the corresponding WebGPU import path. Both builds passed the type/build stages,
but the vendor chunk remained about 381 kB gzip; the reduction was not
material. A global alias was rejected because it broke `three/webgpu`,
`three/tsl` and addon subpaths. The 350 kB guard therefore remains red by
evidence, with no safe feature removal, budget increase or chunk-only change.

The next optimization candidate is an upstream Three/TresJS delivery change
or a separately measured TSL/WebGPU closure reduction. Until such evidence
exists, releases must continue to surface the failing guard rather than hide
it.

## Consequences

`bun run budget:build` remains intentionally red until the variance is removed;
the release gate cannot silently regress or normalize the overage. Route and
splash budgets remain enforced, and future optimization work must be measured
against the same gzip method and current installed dependency matrix.
