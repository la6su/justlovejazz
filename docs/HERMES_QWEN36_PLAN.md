# HERMES Qwen3.6 Execution Plan

## Objective

Bring `justlovejazz` from "build-stable" to production-ready engineering quality with explicit renderer contracts, deterministic behavior, clean lifecycle, and repeatable verification.

## Execution Mode

- Fully autonomous implementation within repository constraints.
- Small scoped iterations.
- Verify after every iteration with `npm run type-check` and `npm run build`.
- Do not start visual polish until core stability tasks are complete.

## Phase 1 — Renderer Contract Alignment

1. Align runtime capability model with `docs/SPEC.md`:
   - `RendererMode`: `webgpu | webgl | unsupported`
   - `QualityTier`: `high | medium | low`
2. Normalize capability fields:
   - `mode`, `tier`, `maxDpr`, `postProcessing`, `floatRenderTargets`
3. Remove invalid/fragile feature checks in render mode detection.
4. Keep WebGPU-specific APIs isolated from generic renderer paths.
5. Ensure unsupported state shows explicit UX message and fails safely.

## Phase 2 — Fallback Policy Hardening

1. Make WebGL fallback behavior explicit at runtime and in types.
2. Ensure post-processing behavior is capability-driven (no hidden assumptions).
3. Validate initialization and resize behavior do not diverge between modes.

## Phase 3 — Timeline and Motion Determinism

1. Normalize time-step usage across world, camera, and post chains.
2. Ensure state-driven motion and reduced-motion compatibility are preserved.
3. Remove implicit frame-rate-coupled behavior where identified.

## Phase 4 — Asset Lifecycle Integrity

1. Audit disposal paths for textures, materials, geometries, and targets.
2. Prevent disposal of active/in-use resources.
3. Restrict any untyped disposal logic to typed adapters.

## Phase 5 — Type Safety Tightening (Critical Paths)

1. Reduce `any` in core runtime contracts and renderer integration paths.
2. Keep unavoidable untyped interop behind narrow adapters with comments.
3. Preserve strict TypeScript and avoid suppression shortcuts.

## Phase 6 — Verification and QA Baseline

1. Keep `type-check` and `build` green after each phase.
2. Stabilize Playwright local server config for cross-environment runs.
3. Run minimal E2E smoke once environment allows browser execution.

## Phase 7 — Documentation Synchronization

1. Update `SPEC`, `ARCHITECTURE`, and `ROADMAP` only where implementation changed.
2. Keep docs concise and contract-focused.

## Definition of Done

- `npm run type-check` passes.
- `npm run build` passes.
- Renderer capability contract is explicit and consistent across code/docs.
- Fallback behavior is deterministic and testable.
- Resource lifecycle has no known unsafe disposal patterns.
- Verification path is repeatable on developer and CI environments.
