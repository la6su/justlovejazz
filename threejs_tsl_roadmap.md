# Three.js TSL (Three.js Shading Language) Project Roadmap

## Overview
We will use **Three.js Nodes (TSL)** with **WebGPU/WebGL 2.0 fallback**, which is the most modern approach in Three.js.

---

## 1. Roadmap

### Stage 1: Infrastructure & Foundation
- Set up environment (Vite + TypeScript)
- Integrate UIkit 3 and YOOtheme base layout
- Create core `Experience` class (Singleton) to manage Three.js
- Implement WebGPU → WebGL fallback system

---

### Stage 2: Visual Layer (TSL Background)
- Develop TSL shader for animated procedural background (AI-style)
- Implement responsive canvas behavior (resize handler)
- Optimize rendering for mobile-first performance

---

### Stage 3: Central Object (GLTF)
- Integrate GLTF loader
- Configure lighting and PBR materials
- Add basic interactivity (rotation via scroll or mouse movement)

---

### Stage 4: UI/UX Integration
- Build layout using UIkit 3
- Create transparent UI layer over the canvas
- Sync UI events with 3D scene (e.g. background color changes per section)

---

### Stage 5: Optimization & Polish
- Implement loading screen
- Profile performance on mobile devices
- Final cross-browser testing
