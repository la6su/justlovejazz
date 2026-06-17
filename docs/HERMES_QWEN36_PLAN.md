# HERMES Qwen3.6 Execution Plan

> Last updated: 2026-06-17. See `docs/STATUS.md` for canonical state.
> Original plan was for a hermes-agent + local Qwen3.6 setup. Most phases
> are now done; this file tracks what was completed vs what remains.

## Objective

Bring `justlovejazz` from "build-stable" to production-ready engineering
quality with explicit renderer contracts, deterministic behavior, clean
lifecycle, and repeatable verification.

## Execution Mode

- Fully autonomous implementation within repository constraints.
- Small scoped iterations.
- Verify after every iteration with `npm run type-check` and `npm run build`.
- Do not start visual polish until core stability tasks are complete.

## Phase 1 — Renderer Contract Alignment ✅ DONE

1. ✅ Runtime capability model matches SPEC.md: `webgpu | webgl | unsupported`.
2. ✅ QualityTier: `high | medium | low`.
3. ✅ Capability fields normalized: mode, tier, maxDpr, postProcessing.
4. ✅ WebGPU-specific APIs isolated (adapter `any` only in RenderPipeline.ts).
5. ✅ Unsupported state shows explicit UX, fails safely.

## Phase 2 — Fallback Policy Hardening ✅ DONE

1. ✅ WebGL fallback explicit at runtime + types.
2. ✅ Post-processing capability-driven (PostProcessingManager QUALITY_SCALARS).
3. ✅ Init + resize behavior do not diverge between modes (Renderer.init()
   creates pipeline after backend init; Renderer.resize() propagates to both).

## Phase 3 — Timeline and Motion Determinism ✅ DONE

1. ✅ Delta-time normalized across world, camera, post chains (PR #1 fixed
   the hardcoded 1/60 in PostProcessingManager).
2. ✅ State-driven motion + reduced-motion compatibility (Camera gated
   behind prefersReducedMotion; SmoothScroll, GalleryManager, World too).
3. ✅ Frame-rate-coupled behavior removed (no 1/60 assumptions remain).

## Phase 4 — Asset Lifecycle Integrity ✅ DONE

1. ✅ Disposal paths audited for textures, materials, geometries, targets.
2. ✅ Context-driven disposal prevents active/in-use resource freeing.
3. ✅ All window listeners (Sizes/Renderer/Camera/Input) clean up on destroy.
4. ✅ Untyped interop isolated behind typed adapters (RenderPipeline
   NativeRenderPipelineHandle, tsl-utils TSLNode).

## Phase 5 — Type Safety Tightening ✅ DONE

1. ✅ `any` reduced to two documented adapter boundaries:
   - `RenderPipeline.ts` NativeRenderPipelineCtor (three/webgpu RenderPipeline
     not in @types/three yet)
   - `tsl-utils.ts` TSLNode type (three/tsl typings unstable across releases)
2. ✅ Strict TypeScript preserved, no suppression shortcuts.
3. ✅ `noUnusedLocals` + `noUnusedParameters` enforced.

## Phase 6 — Verification and QA Baseline 🔄 PARTIAL

1. ✅ type-check + build green after each phase.
2. 🔄 Playwright config exists (`playwright.config.ts`); tests in `tests/`;
   expansion pending (route smoke, works lifecycle, keyboard nav).
3. ⏳ Minimal E2E smoke needs browser execution environment.

## Phase 7 — Documentation Synchronization ✅ DONE (this pass)

1. ✅ SPEC, ARCHITECTURE, ROADMAP updated to match implementation.
2. ✅ Docs concise and contract-focused.
3. ✅ STATUS.md created as canonical single source of truth.
4. ✅ AGENTS.md updated (removed false claims about junni archive purge
   and temporary post-processing).

## Definition of Done

- ✅ `npm run type-check` passes.
- ✅ `npm run build` passes.
- ✅ Renderer capability contract explicit + consistent across code/docs.
- ✅ Fallback behavior deterministic and testable.
- ✅ Resource lifecycle has no known unsafe disposal patterns.
- 🔄 Verification path repeatable on developer environments (CI pending).
