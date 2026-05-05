# PRO ROADMAP: The Junni-Standard (Finalized v2)

Goal: Transform the project from a technical demo into a high-end cinematic portfolio that rivals top design studios (Junni, Active Theory, Locomotive).

## ✅ Phase 1: Cinematic Base (Visual Fidelity)
- [x] High-contrast visual identity (#ff3e00 accent).
- [x] Asymmetric 'Studio Grid' layout.
- [x] Cinematic Post-Processing: Film Grain, Chromatic Aberration, Global Vignette.
- [x] TSL-driven Quantum Liquid Background.

## ✅ Phase 2: Rhythmic Motion (The "Feel")
- [x] Virtual Smooth Scroll: Integrated Lenis with tuned snappiness (duration: 0.6).
- [x] Global Lerp System: Centralized input smoothing in `Input.ts` (lerpFactor: 0.35).
- [x] Responsive 3D: Central Object reactive to mouse-look without "jelly" lag.
- [x] UX Optimization: Removed conflicting `scroll-behavior: smooth` for native-feeling inertia.

## 🏗️ Phase 3: Interaction Synergy (Current)
- [x] Typography Reveal: Masked word-by-word animations for `.studio-title` with staggered timing.
- [ ] Magnetic UI: Implementation of cursor attraction for links, buttons, and interactive elements.
- [ ] Content Orchestration: Implementing staggered entry animations for project cards and section content.
- [ ] Portfolio Expansion: Designing and implementing a professional 'Works' gallery with immersive transitions.

## ⏳ Phase 4: Final Polish & Delivery
- [ ] Performance Audit: Optimizing TSL shaders and memory cleanup (destroy methods).
- [ ] Responsive Adaptation: Ensuring the cinematic experience translates to mobile/tablets.
- [ ] Micro-interactions: Adding haptic-like visual feedback to all interactive triggers.
- [ ] Final Content Pass: Replacing placeholders with high-fidelity assets.

---
## Technical Stack Reference:
- Three.js + TSL + WebGPU
- Lenis (Smooth Scroll)
- UIkit (UI Framework)
- Less (Styling)
- Vite (Build Tool)
