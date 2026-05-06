# Development Plan: justlovejazz (Current State)

This document serves as the living record of the project's technical evolution and the immediate roadmap to reach "Production Grade".

## 📌 Current Architecture Snapshot (v2.0)
The project has transitioned from a simple 3D scene to a professional cinematic pipeline.

### 1. Core Systems (Implemented)
- **`Bootstrapper`**: Asynchronous system initialization. Ensures all managers (Assets, UI, World) are ready before the first frame.
- **`CameraStateManager`**: A finite state machine (FSM) managing `INTRO` $\rightarrow$ `EXPLORE` $\rightarrow$ `DETAIL` $\rightarrow$ `TRANSITION`.
- **`AssetManager`**: Centralized resource hub with KTX2 support and a `purgeUnused` mechanism to maintain VRAM limits.
- **`World` & `Section`**: A modular environment where each section defines its own camera target, baku properties, and lighting.

### 2. Cinematic Pipeline (Implemented)
- **Camera Kinematics**: 
    - Exponential Decay smoothing for base position/target.
    - Inertia-based cursor follow (the "Junni feel").
    - Organic combined-sine shake.
    - Dynamic FOV interpolation.
- **GPU-Driven Transitions**:
    - `GalleryScene` $\rightarrow$ Fullscreen zoom based on `transitionProgress`.
    - TSL-based material morphing.
- **Render Stack**: 
    - WebGPU Primary $\rightarrow$ WebGL2 Fallback.
    - TSL Post-processing pipeline (Grain, Vignette, Bloom).

---

## 🚀 Immediate Roadmap (The "Final 10%")

### 🛠️ Task 1: Render Pipeline Completion (High Priority)
- [ ] **SMAA Integration**: Implement high-quality anti-aliasing.
- [ ] **Bicubic Upsampling**: Implement a custom TSL node for bicubic texture filtering to eliminate pixelation on extreme zooms.
- [ ] **Multi-layer Bloom**: Upgrade the current bloom to a mip-pyramid based system for a more professional "glow".

### 🛠️ Task 2: Asset & Performance Optimization
- [ ] **KTX2 Conversion**: Convert all current textures to Basis Universal / KTX2.
- [ ] **LOD Shaders**: Implement shader complexity tiers (WebGPU vs WebGL2).
- [ ] **Memory Audit**: Profiling VRAM usage and refining the `AssetManager.purgeUnused` triggers.

### 🛠️ Task 3: UX & Motion Polish
- [ ] **Optical Alignment**: Refine the asymmetric grid and typography spacing for a "designer's eye" layout.
- [ ] **Responsive Refinement**: Ensure the 3D transitions feel natural on mobile (Touch-based inertia).
- [ ] **Intro Sequence**: Create a high-fidelity splash $\rightarrow$ world entry sequence.

---

## 📐 Technical Constraints
- **No Inline Styles**: All presentation in Less files.
- **TSL Standard**: Use method chaining (`.add().mul()`) for all shader nodes.
- **Motion Standard**: "Snappy" not "Floaty". Avoid linear interpolations.
