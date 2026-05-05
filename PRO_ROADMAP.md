# PRO ROADMAP: The Junni-Standard

This roadmap defines the path to achieving a world-class visual experience.

## Phase 1: Cinematic Base (Visual Fidelity) 🚀 CURRENT
*Goal: Move from "3D render" to "Cinematic Shot".*

- [ ] **Post-Processing Pipeline**:
    - [ ] Implement `Film Grain` pass (texture-based noise).
    - [ ] Implement `Bloom` pass (glow for highlights).
    - [ ] Implement `Chromatic Aberration` (lens distortion).
- [ ] **Color Grade**: Refine the palette for maximum contrast (Deep Void $\to$ Electric Accents).
- [ ] **Atmospheric Fog**: Add subtle depth to the 3D scene to avoid a flat look.

## Phase 2: Rhythmic Motion (The Feel)
*Goal: Implement a professional motion system.*

- [ ] **Smooth Scroll Engine**: Integrate `Lenis` for high-end inertia scrolling.
- [ ] **Global Lerp System**:
    - [ ] Transition all 3D movements (Rotation, Position) to Lerp-based smoothing.
    - [ ] Smooth out the `uScrollProgress` updates to avoid jitter.
- [ ] **Velocity-Based Reactivity**: Make the background noise and object rotation react to the *speed* of scrolling.

## Phase 3: Interaction Synergy (Deep Integration)
*Goal: Blend the interface and the scene into one organism.*

- [ ] **Text-Driven 3D**: 
    - [ ] Map specific 3D state changes to UI sections (e.g., Object expands when "About" enters view).
- [ ] **Advanced UI Motion**:
    - [ ] Split-text reveal animations for all `studio-title` elements.
    - [ ] Magnetic cursor effect for navigation links and CTA buttons.
- [ ] **Custom Transition**: Smooth fade-to-black or glitch transitions between major state changes.

## Phase 4: Final Polish & Optimization
*Goal: Performance and "Pixel Perfection".*

- [ ] **Performance Audit**: Optimize TSL shaders for WebGPU/WebGL2 fallback.
- [ ] **Micro-Interactions**: Add hover sounds or subtle haptic-like visual feedback.
- [ ] **Responsive Refinement**: Ensure the "Junni-feel" persists on mobile (adjusted inertia/bloom).
