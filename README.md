# AI Design Studio Portfolio

Modern interactive portfolio using **Three.js TSL (Nodes)** with **WebGPU → WebGL fallback**.  
Designed with **mobile-first UX** and a **procedural 3D background**.

---

## Features

## Tech Stack

- **Language:** TypeScript
- **3D Engine:** Three.js
- **Shading:** TSL (Three.js Nodes)
- **Rendering:** WebGPU → WebGL2 fallback
- **UI:** UIkit 3 (YOOtheme)
- **Build Tool:** Vite

---

## Project Structure

```
src/
├── Experience/
│ ├── Experience.ts # Singleton (core app)
│ ├── Renderer.ts # WebGPU/WebGL switch
│ ├── Camera.ts
│ ├── Sizes.ts
│ ├── Time.ts
│ └── World/
│ ├── World.ts
│ ├── Background.ts # TSL shader logic
│ └── Model.ts # GLTF object
│
├── shaders/
│ └── background.tsl.ts
│
├── ui/
│ └── layout.html
│
├── main.ts
└── style.css
```
