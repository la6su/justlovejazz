# Technical Specification: justlovejazz (Production Grade)

## 1. Technical Stack & Core Architecture
- **Language:** TypeScript (Strict mode)
- **3D Engine:** Three.js (Latest)
- **Shading Language:** TSL (Three.js Shading Language) / NodeMaterial
- **Rendering API:** WebGPU (Primary) $\rightarrow$ WebGL 2.0 (Fallback)
- **UI Framework:** UIkit 3 (YOOtheme) + Less
- **Build Tool:** Vite
- **Smooth Scroll:** Lenis
- **Animation:** GSAP / TSL-driven animations

## 2. Cinematic Visual Pipeline (The "Studio" Look)
To achieve top-tier studio quality (Ref: Junni, Active Theory), the rendering pipeline must implement:

### 2.1 Post-Processing Stack (GPU-accelerated)
- **Multi-layer Bloom:** Mip-pyramid based glow to avoid "flat" blur.
- **Professional Grain:** High-frequency dynamic noise to break digital cleanliness and add cinematic texture.
- **Chromatic Aberration:** Dynamic radial shift of RGB channels, increasing towards the screen edges.
- **Cinematic Vignette:** Soft, configurable edge darkening to focus attention.
- **SMAA:** High-quality anti-aliasing to eliminate jagged edges on high-contrast lines.

### 2.2 Render Quality & Sampling
- **Bicubic Filtering:** Implementation of bicubic sampling for textures to prevent pixelation during extreme zooms.
- **High-Fidelity Materials:** Procedural micro-details (noise, grids) integrated into TSL shaders to maintain surface detail at all distances.
- **Dynamic FOV:** Adaptive Field of View changes based on camera state and movement speed.

## 3. Motion Choreography & UX
Transition from "UI-driven" to "Render-driven" UX.

### 3.1 Camera System
- **Inertia-based Follow:** Camera doesn't snap; it follows targets with calculated drag and spring physics.
- **Organic Shake:** Combined-sine wave low-frequency shake for "handheld" cinematic feel.
- **State-based Transitions:** A formal state machine for camera positions (`Intro` $\rightarrow$ `Gallery` $\rightarrow$ `ProjectDetail`) using Slerp and smooth FOV interpolation.

### 3.2 GPU-Driven Transitions
- **Masked Reveal:** Content unveiling via GPU masks instead of CSS opacity/transforms.
- **Space Distortion:** Space-warping effects (bulge/warp) during high-energy state changes.
- **Seamless Loops:** Shortest-path looping for all carousel/slider elements.

## 4. Performance & Production Standards
### 4.1 Asset Optimization
- **Texture Compression:** Use of KTX2 / Basis Universal textures to minimize VRAM footprint.
- **Smart Loading:** Dynamic asset streaming (loading high-res textures only when approaching a project).
- **LOD System:** Tiered shader complexity based on device capability (WebGPU vs WebGL2).

### 4.2 Technical Constraints
- **Frame Rate:** Stable 60 FPS target on mid-range devices.
- **Memory Management:** Strict disposal of geometries, materials, and textures on scene transitions.
- **Cross-Platform:** Full parity between Desktop and Mobile, with mobile-specific layout transitions (e.g., 3D Grid $\rightarrow$ Vertical List).

## 5. Definition of Done (Production Grade)
- [ ] **Visuals:** Image looks "filmic" (grain, bloom, depth).
- [ ] **Motion:** "Snappy" yet smooth. No "floaty" or "linear" movement.
- [ ] **UX:** No visible jumps between DOM and WebGL.
- [ ] **Tech:** WebGPU operational with a seamless WebGL2 fallback.
