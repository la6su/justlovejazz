# justlovejazz — Cinematic Studio Portfolio

A high-end, production-grade interactive experience built with **Three.js TSL** and **WebGPU**. 
The project follows the "Studio Standard" (Ref: Junni / Active Theory), emphasizing rhythmic motion, cinematic visual fidelity, and a render-driven UX.

## 🚀 High-End Technical Stack

- **Rendering:** `WebGPU` (Primary) $\rightarrow$ `WebGL 2.0` (Seamless Fallback)
- **Shading:** `Three.js Shading Language (TSL)` using Node-based materials and method chaining.
- **Orchestration:** 
    - `Bootstrapper`: Async initialization pipeline.
    - `CameraStateManager`: FSM-based cinematic camera control.
    - `AssetManager`: VRAM-aware resource handling with KTX2/Basis support.
- **Motion:** 
    - `Lenis` for smooth scrolling.
    - Exponential Decay & Inertia for "weighty" cinematic movement.
    - Organic combined-sine shake for handheld feel.
- **UI/UX:** `UIkit 3` + `Less` for an asymmetric, high-contrast studio aesthetic.

## 🎬 Cinematic Pipeline

The project implements a professional render stack to eliminate the "digital look":
- **Post-Processing:** Film Grain, Cinematic Vignette, and TSL-driven Bloom.
- **Motion Choreography:** Transition from UI-driven to Render-driven UX, where scroll is mapped to a state machine of 3D scenes.
- **VRAM Optimization:** Dynamic texture purging based on camera proximity to projects.

## 📁 Architecture Overview

```text
src/
├── core/               # Core Engine & State Management
│   ├── AssetManager.ts # VRAM-aware resource hub
│   ├── Bootstrapper.ts # System init pipeline
│   ├── CameraStateManager.ts # Cinematic FSM
│   ├── GalleryManager.ts # Portfolio logic
│   └── types.ts        # Unified project types
│
├── Experience/         # Scene Orchestration
│   ├── Camera.ts       # Kinematics & FOV control
│   ├── Renderer.ts     # WebGPU/WebGL Renderer
│   ├── World/          # Environment & Section logic
│   │   ├── Baku.ts     # Dynamic central object
│   │   ├── GalleryScene.ts # 3D Portfolio visualization
│   │   └── World.ts    # Section-based world manager
│   └── ...             # UI, Input, Post-Processing
│
├── shaders/            # TSL Shaders
│   ├── ProjectMaterial.ts # Advanced GPU distortions & reveals
│   ├── postprocessing.tsl.ts # Cinematic post-stack
│   └── tsl-utils.ts    # Professional shader helpers
│
└── main.ts             # Application Entry Point
```

## 🛠️ Development
- **Build:** `npm run dev`
- **Type Check:** `npm run type-check`
- **Standard:** Strict TypeScript, SOLID, KISS.
