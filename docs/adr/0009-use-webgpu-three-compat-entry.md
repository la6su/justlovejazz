# ADR 0009: Use a scoped WebGPU Three.js compatibility entry for TresJS

- Status: Accepted with gates
- Date: 2026-08-25

## Context

TresJS 5.8.3 statically imports `WebGLRenderer` from the bare `three` entry,
even when the application supplies a custom renderer factory. That import
retained `three.module.js` in the shared production vendor and kept the
delivery budget above its 350 kB gzip gate. A global alias to `three/webgpu`
was not compatible because it also changed package subpath resolution.

## Decision

Vite resolves only the exact bare `three` specifier to
`src/three-webgpu-compat.ts`. The compatibility entry re-exports
`three/webgpu` and exposes a throwing `WebGLRenderer` class solely for the
unreachable TresJS default-renderer path. Three addon, TSL and WebGPU subpaths
remain resolved by their package exports. The application continues to
construct exactly one `WebGPURenderer`; its automatic `WebGLBackend` fallback
is unchanged.

## Gates

- `bun run budget:build` must remain at or below 350 kB gzip for shared Three.
- Type-check, unit, lint, production build and serial browser E2E must pass.
- Runtime evidence must retain one renderer/canvas/loop and no fatal backend,
  material or device errors.
- Remove this entry when an upstream TresJS release provides an equivalent
  tree-shakeable renderer entry; do not replace it with a global alias.

## Consequences

The measured shared vendor is 298.43 kB gzip, leaving headroom under budget.
The compatibility entry is intentionally small and local, but it is a
temporary integration boundary with TresJS's current package shape rather than
a second renderer or a backward-compatibility runtime path.
