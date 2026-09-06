# ADR 0010: Close the unified WebGPU/WebGL renderer decision

- Status: Accepted with evidence
- Date: 2026-08-26
- Supersedes: [ADR 0003](0003-unify-webgpu-webgl2-renderer.md)

## Decision

The production application constructs exactly one renderer class:
Three.js `WebGPURenderer`. The renderer selects `WebGPUBackend` when usable
hardware WebGPU is available. The same renderer is recreated with
`forceWebGL: true` and `WebGLBackend` when policy requires the WebGL fallback,
including an unusable software WebGPU candidate. The classic
`WebGLRenderer` path and the auxiliary second canvas are removed from the
production runtime.

The backend that was actually initialized owns capability, DPR and post policy.
Native non-low WebGPU may use the TSL post graph. The forced WebGLBackend path
renders the shared node-material scene directly and does not claim TSL post
parity. Both paths share the same Vue/Tres scene ownership and demand-driven
loop contract.

## Evidence and gates

- The Phase 10 migration archive records the removal ledger and cutover gates.
- `docs/evidence/phase10-route-cycle-soak/2026-08-25T09-32-03-390Z-report.json`
  records five warm-up plus twenty steady-state route cycles with one canvas,
  no fatal errors, no monotonic resource growth and settled loop behavior.
- The release gate covers TypeScript/Vue type checking, unit tests, production
  build budgets, serial route E2E and the automatic/forced backend suites.
- Hardware WebGPU and physical-mobile observations are retained as historical
  evidence in `PERFORMANCE_BASELINE.md`; they are not inferred from a headless
  environment.

## Consequences

- Renderer integrations must target `WebGPURenderer` and inspect the actual
  backend; adding a classic renderer or second canvas is a design violation.
- WebGPU and WebGLBackend remain intentionally asymmetric for post processing.
- A future Three/Tres release may change the matrix only through a new ADR and
  representative hardware evidence. No compatibility fallback may be added to
  preserve the superseded classic path.
