# WORKLOG.md

## 2026-05-07

- Fixed: exposed interpolated post presets through `WorldState`.
- Files: `src/core/types.ts`, `src/core/CameraStateManager.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: verify build, then connect post state to a safe renderer/post adapter.

- Fixed: wired `WorldConfig.ui.showGallery` into `WorldState` and DOM gallery visibility.
- Files: `src/core/types.ts`, `src/core/CameraStateManager.ts`, `src/Experience/Experience.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: verify build, then expose post presets through world state.

- Fixed: reshaped `WorldConfig` into typed camera/baku/lighting/post/ui presets.
- Files: `src/core/WorldConfig.ts`, `src/core/CameraStateManager.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: verify build, then wire `ui.showGallery` and post presets into runtime.

- Fixed: moved section scroll ranges into `WorldConfig` and corrected light intensity interpolation.
- Files: `src/core/WorldConfig.ts`, `src/core/CameraStateManager.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: verify build, then make `WorldConfig` shape closer to camera/baku/lighting/post presets.

- Fixed: normalized smooth scroll progress to a stable `0..1` range.
- Files: `src/Experience/Input.ts`, `src/Experience/SmoothScroll.ts`, `src/Experience/Experience.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: move section ranges into `WorldConfig`.

- Fixed: removed temporary red/cube debug scene and added explicit WebGPU renderer capability state.
- Files: `src/Experience/Renderer.ts`, `src/core/Bootstrapper.ts`, `src/types/renderer.ts`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: verify build, then continue with scroll normalization/world timeline.

- Fixed: restored visible Three.js scene and stabilized TypeScript build.
- Files: `src/Experience/Time.ts`, `src/Experience/Camera.ts`, `src/core/Bootstrapper.ts`, `src/Experience/World/Environment.ts`, `src/shaders/*`, `src/UI/*`, `package.json`.
- Verified: `npm run type-check` passes; `npm run build` passes.
- Next: remove temporary debug red background/cube after visual confirmation, then implement renderer capability contract.

- Added: autonomous Hermes protocol for safe continuous project work.
- Files: `HERMES_AUTONOMY.md`, `WORKLOG.md`.
- Verified: documentation only; no runtime verification needed.
- Next: start Phase 1 from `JUNNI_LEVEL_IMPLEMENTATION_PLAN.md` by fixing `npm run build`.
