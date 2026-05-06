# PRO ROADMAP: The Junni-Standard (Production Grade v3)

**North Star Reference:** [Junni (next.junni.co.jp)](https://github.com/junni-inc/next.junni.co.jp)
**Goal:** Elevate the project from a creative demo to a production-ready, high-end digital experience that meets the rigorous quality standards of top global design studios.

---

## 🎯 Production-Level Quality Requirements (The Studio Standard)
To reach "Top Studio" level, we must implement the following beyond basic features:
- **Motion Choreography:** All animations must follow a strict rhythm. No "floaty" movements; use precise `cubic-bezier` curves and staggered timings to create a sense of physical weight and intentionality.
- **Visual Fidelity:** 
  - Implementation of professional-grade noise/grain to break digital flatness.
  - High-contrast, asymmetric layouts with precise optical alignment.
  - Cinematic post-processing (Bloom, Chromatic Aberration) tuned for subtlety.
- **Performance Engineering:**
  - Constant 60fps target.
  - Optimized TSL shaders for WebGPU/WebGL fallback.
  - Asset pipeline: WebP/AVIF images, compressed GLB models.
- **UX Polish:**
  - Immersive page transitions (no hard refreshes).
  - Custom, high-fidelity loading sequence.
  - Responsive design that feels "re-designed" for each breakpoint, not just scaled.

---

## 🛠️ Implementation Phases

### ✅ Phase 1: Cinematic Base (Visual Fidelity)
- [x] High-contrast visual identity (#ff3e00 accent).
- [x] Asymmetric 'Studio Grid' layout.
- [x] Cinematic Post-Processing: Film Grain, Chromatic Aberration, Global Vignette.
- [x] TSL-driven Quantum Liquid Background.

### ✅ Phase 2: Rhythmic Motion (The "Feel")
- [x] Virtual Smooth Scroll: Integrated Lenis with tuned snappiness.
- [x] Global Lerp System: Centralized input smoothing in `Input.ts`.
- [x] Responsive 3D: Central Object reactive to mouse-look without "jelly" lag.
- [x] UX Optimization: Native-feeling inertia.

### 🏗️ Phase 3: Interaction Synergy (Current)
- [x] Typography Reveal: Masked word-by-word animations.
- [x] Magnetic UI: High-fidelity cursor attraction for interactive elements.
- [x] Content Orchestration: Staggered entry animations for sections.
- [x] **Portfolio Expansion (Junni-Style):** 
  - Implement an immersive 'Works' gallery.
  - Create cinematic transitions between the gallery and project details (zoom/slide/fade).
  - Implement high-end image loading states (blur-up/fade-in).

### ⏳ Phase 4: The "Studio" Polish (Production Ready)
- [ ] **Asset Optimization:** Convert all assets to professional formats, implement lazy loading for 3D components.
- [ ] **Advanced Motion:** Implement "Scroll-bound animations" (parallax, scale, rotation tied to scroll position).
- [ ] **Responsive Refinement:** Deep-dive into mobile UX to ensure the cinematic feel persists on touch devices.
- [ ] **Final Quality Audit:** Performance profiling (Chrome DevTools), memory leak check, and accessibility pass


### 🚀 Phase 5: The Golden Standard (Junni Implementation)
*Porting the extracted 'Golden Patterns' into our TSL/WebGPU pipeline to reach Studio-Grade quality.*

#### 🎥 Cinematic Camera & World
- [x] **Advanced Kinematics:** Implement inertia-based cursor follow, organic shake, and dynamic FOV offset.
- [x] **World Orchestration:** Implement a Section-based state machine. Instead of a single world, create a system of 'Scenes' with pre-defined camera and object transforms.
- [x] **Seamless Transitions:** Implement high-fidelity lerp/slerp transitions between sections, tied to the smooth-scroll progress.

#### 🎨 Visual Fidelity (The "Look")
- [ ] **Render Pipeline:** Port the cinematic stack: SMAA -> Multi-layer Bloom (Mip-pyramid) -> Bicubic Upsampling -> Grain -> Vignette.
- [ ] **Procedural Organicism:** Port 4D Simplex Noise and professional Easings to TSL for natural, non-linear animations.
- [ ] **Custom Geometry:** Implement MipMap-based geometry for high-end bloom sampling.

#### ⚙️ Studio Polish
- [x] **Asset Orchestration:** Implement the 'Baku' pattern: an object that changes materials and behavior based on the current world section.
- [ ] **Performance Tuning:** Optimize TSL shaders to ensure the full cinematic stack runs at 60fps.

### 🏆 Phase 6: The Masterpiece (Final Refinement)
*The final 5% that defines a world-class portfolio.*
- [ ] **Optical Alignment:** Deep-dive into asymmetric grids and high-contrast typography to ensure a 'designer's eye' layout.
- [ ] **Sensory Layer:** Add subtle audio cues and haptic-like visual feedback to interactive elements.
- [ ] **The 'Wow' Sequence:** Design a custom intro sequence (splash screen -> world transition) that sets the tone for the entire experience.
- [ ] **Final Polish Audit:** Frame-by-frame review of all motion to eliminate any 'floaty' feel.
