# Project Concept: JustLoveJazz — Cinematic Experience

## Vision
The goal is to transform `justlovejazz` from a standard portfolio into a high-end digital experience inspired by top-tier Japanese design studios (e.g., Junni). The project should not feel like a "website with a 3D background," but as a **cinematic interactive piece** where UI and 3D are inseparable.

## The "Junni" Pillars

### 1. Rhythmic Motion (The "Feel")
- **Non-Linearity**: No element moves linearly. Every transition uses easing, inertia, and Lerp (Linear Interpolation).
- **Virtual Scrolling**: Implementation of a smooth-scroll engine (Lenis) to decouple the browser's jumpy scroll from the visual experience.
- **Organic Flow**: The 3D scene and UI respond to the user's velocity, not just their position.

### 2. Cinematic Fidelity (The "Look")
- **Anti-Digital Look**: Removal of the "plastic" 3D look through deliberate imperfections.
- **Post-Processing Stack**:
    - **Film Grain**: Constant subtle noise to add texture and warmth.
    - **Bloom**: High-intensity light bleeding for "glowing" elements.
    - **Chromatic Aberration**: Slight color fringing at the edges to simulate a real camera lens.
    - **Vignette**: Focused lighting to draw the eye to the center.
- **Extreme Contrast**: Deep blacks vs. vibrant, electric accents.

### 3. UI/3D Synergy (The "Interaction")
- **Text-Driven 3D**: The 3D object's state (scale, rotation, color, noise) is mapped to the current section and scroll progress.
- **Typography as Art**: Use of asymmetric grids and "Split-Text" animations (words appearing letter by letter).
- **Magnetic Interactions**: UI elements (buttons, links) that attract the cursor, creating a tactile feel.
