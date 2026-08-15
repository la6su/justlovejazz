# ADR 0003: Unify WebGPU and WebGL2 under WebGPURenderer

- Status: Proposed; blocked by the representative renderer gate
- Date: 2026-08-15

## Context

Three.js `WebGPURenderer` can target `WebGPUBackend` and fall back to
`WebGLBackend`, but the current project replaces that fallback with classic
`WebGLRenderer`. The replacement exists because the current WebGL path uses
`ShaderMaterial` post passes and because NodeMaterial plus fog failed on the
WebGL backend. Software WebGPU adapters also require an explicit performance
policy.

## Proposed decision

Use one `WebGPURenderer`, one TSL material/post graph and the actual initialized
backend as the runtime capability source. Forced QA uses `forceWebGL: true`.
A software WebGPU candidate is disposed and recreated with forced WebGL. The
fallback is classified independently because WebGL may also be software or
unknown; neither path is labelled premium without evidence.

## Acceptance before status becomes Accepted

The representative scene must pass WebGPU and forced WebGL rendering, fog,
materials, post effects, resize/DPR, reduced motion, lazy disposal, idle draw
and performance gates. The classic renderer remains available until that
evidence exists.

TresJS WebGPU integration is experimental and its renderer factory is
synchronous in the documented API. Acceptance therefore also requires a proven
async initialization/readiness handshake and an exact compatibility matrix.
