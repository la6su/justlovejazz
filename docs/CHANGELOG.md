     1|# WORKLOG.md
     2|
     3|## 2026-05-07
     4|
     5|- Fixed: TS build blocker in `AssetManager.ts` (BicubicFilter types).
     6|- Improved: Renderer fallback UI with cinematic error screen.
     7|- Implementation: Connected Post-Processing pipeline to `WorldState` via TSL uniforms (Bloom, Vignette, Grain).
     8|- Verified: `npm run build` passes.
     9|- Fixed: exposed interpolated post presets through `WorldState`.
    10|- Files: `src/core/types.ts`, `src/core/CameraStateManager.ts`.
    11|- Verified: `npm run type-check` passes; `npm run build` passes.
    12|- Next: verify build, then connect post state to a safe renderer/post adapter.
    13|
    14|- Fixed: wired `WorldConfig.ui.showGallery` into `WorldState` and DOM gallery visibility.
    15|- Files: `src/core/types.ts`, `src/core/CameraStateManager.ts`, `src/Experience/Experience.ts`.
    16|- Verified: `npm run type-check` passes; `npm run build` passes.
    17|- Next: verify build, then expose post presets through world state.
    18|
    19|- Fixed: reshaped `WorldConfig` into typed camera/baku/lighting/post/ui presets.
    20|- Files: `src/core/WorldConfig.ts`, `src/core/CameraStateManager.ts`.
    21|- Verified: `npm run type-check` passes; `npm run build` passes.
    22|- Next: verify build, then wire `ui.showGallery` and post presets into runtime.
    23|
    24|- Fixed: moved section scroll ranges into `WorldConfig` and corrected light intensity interpolation.
    25|- Files: `src/core/WorldConfig.ts`, `src/core/CameraStateManager.ts`.
    26|- Verified: `npm run type-check` passes; `npm run build` passes.
    27|- Next: verify build, then make `WorldConfig` shape closer to camera/baku/lighting/post presets.
    28|
    29|- Fixed: normalized smooth scroll progress to a stable `0..1` range.
    30|- Files: `src/Experience/Input.ts`, `src/Experience/SmoothScroll.ts`, `src/Experience/Experience.ts`.
    31|- Verified: `npm run type-check` passes; `npm run build` passes.
    32|- Next: move section ranges into `WorldConfig`.
    33|
    34|- Fixed: removed temporary red/cube debug scene and added explicit WebGPU renderer capability state.
    35|- Files: `src/Experience/Renderer.ts`, `src/core/Bootstrapper.ts`, `src/types/renderer.ts`.
    36|- Verified: `npm run type-check` passes; `npm run build` passes.
    37|- Next: verify build, then continue with scroll normalization/world timeline.
    38|
    39|- Fixed: restored visible Three.js scene and stabilized TypeScript build.
    40|- Files: `src/Experience/Time.ts`, `src/Experience/Camera.ts`, `src/core/Bootstrapper.ts`, `src/Experience/World/Environment.ts`, `src/shaders/*`, `src/UI/*`, `package.json`.
    41|- Verified: `npm run type-check` passes; `npm run build` passes.
    42|- Next: remove temporary debug red background/cube after visual confirmation, then implement renderer capability contract.
    43|
    44|- Added: autonomous Hermes protocol for safe continuous project work.
    45|- Files: `HERMES_AUTONOMY.md`, `WORKLOG.md`.
    46|- Verified: documentation only; no runtime verification needed.
    47|- Next: start Phase 1 from `JUNNI_LEVEL_IMPLEMENTATION_PLAN.md` by fixing `npm run build`.
    48|\n---\n- Implementation: Baku Role system (Normal, Glass, Wire, Grid) integrated with WorldConfig.
    49|- Improvement: Baku material morphing with smooth lerps and role-based material switching.
    50|- Polish: Added cinematic FOV kick in CameraStateManager for transitions (Detail/Explore).
    51|- Cleanup: Removed random purge logic from GalleryScene.
    52|- Verified: `npm run build` passes.
    53|
    54|- Production Engineering:
    55|    - Implementation: `GPUResourceManager` for centralized RTT and material lifecycle tracking.
    56|    - Implementation: `DeviceCapability` system with Quality Tiers (LOW, MID, ULTRA).
    57|    - Integration: Connected `DeviceCapability` to `Renderer` (DPR limits, post-processing scaling) and `AssetManager` (Anisotropy limits).
    58|    - Integration: Added `GPUResourceManager` context disposal to `Experience.ts` on section change.
    59|    - Result: Project transitioned from "Experimental Prototype" to "Production-grade Infrastructure" for stability and VRAM management.
    60|
    61|--- 2026-05-07 05:48 ---
    62|## Experience Transformation Phase
    63|- Fixed all TypeScript errors (npm run type-check exit 0).
    64|- Transitioned from 'Site' to 'Experience' paradigm:
    65|    - Replaced WorldSection with NarrativePhase (AWAKENING, DISCOVERY, DEEP_DIVE, CONNECTION).
    66|    - Implemented Relative Camera Tracking: Camera now follows Baku in Discovery and Connection phases.
    67|    - Updated WorldConfig and CameraStateManager for cinematic flow.
    68|    - Integrated GalleryScene with DEEP_DIVE phase.
    69|- Result: Project now has a cinematic backbone with a tethered camera and narrative structure.
    70|