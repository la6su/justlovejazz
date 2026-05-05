# PRO ROADMAP: The Junni-Standard (Updated)

This roadmap is a living document. We are moving from "Feature Implementation" to "Experience Tuning".

## Phase 1: Cinematic Base (Visual Fidelity) ✅ COMPLETED
- [x] **Post-Processing Pipeline**: Film Grain, Bloom, Chromatic Aberration, Vignette.
- [x] **Color Grade**: High-contrast "Deep Void $\to$ Electric Accents" palette.
- [x] **Atmospheric Background**: TSL-based "Quantum Liquid" with scroll-reactivity.

## Phase 2: Rhythmic Motion (The Feel) 🚀 CURRENT
*Focus: Eliminating the "floaty" feeling and creating a tight, responsive connection between user and 3D.*

- [x] **Smooth Scroll Engine**: Lenis integration.
- [x] **Global Lerp System**: Smoothed input for 3D elements.
- [ ] **Motion Tuning (CRITICAL)**:
    - [ ] **Non-Linear Mapping**: Replace linear `scroll / 2000` with easing curves (Ease-In-Out) so the object has "weight" and "intent".
    - [ ] **Velocity Synchronization**: Tie object rotation/scale to scroll *velocity*, not just position.
    - [ ] **Tuning Inertia**: Adjust Lenis duration and Lerp factors to remove the "laggy" feeling.
- [ ] **Symmetry & Balance**: Ensure the 3D object's path feels natural across different screen sizes.

## Phase 3: Interaction Synergy (Deep Integration)
*Goal: Blend the interface and the scene into one organism.*

- [ ] **Typography Reveal**: Implement "mask-out" reveal animations for `studio-title` elements.
- [ ] **Magnetic UI**: Cursor attraction for links and buttons.
- [ ] **Text-Driven State**: Map 3D object states to specific UI sections (e.g., "About" $\to$ Object expands).

## Phase 4: Final Polish & Assets
*Goal: Production-ready high-end quality.*

- [ ] **Asset Upgrade**: Replace the placeholder cube with a high-fidelity `.glb` model.
- [ ] **Performance Optimization**: WebGPU $\to$ WebGL2 fallback audit.
- [ ] **Responsive Polish**: Fine-tune mobile inertia and post-processing.
