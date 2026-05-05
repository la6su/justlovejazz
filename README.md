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
├── assets/
│
├── Experience/
│   ├── Camera.ts
│   ├── ContentReveal.ts
│   ├── Cursor.ts
│   ├── Experience.ts
│   ├── Input.ts
│   ├── PostProcessing.ts
│   ├── Renderer.ts
│   ├── Sizes.ts
│   ├── SmoothScroll.ts
│   ├── TextReveal.ts
│   ├── Time.ts
│   │
│   └── World/
│       ├── Background.ts
│       ├── Baku.ts
│       ├── CentralObject.ts
│       ├── Environment.ts
│       ├── Lights.ts
│       ├── Section.ts
│       └── World.ts
│
├── shaders/
│   ├── background.tsl.ts
│   ├── env-effects.tsl.ts
│   ├── noise.tsl.ts
│   ├── postprocessing.tsl.ts
│   └── tsl-utils.ts
│
├── Utils/
│   ├── Easings.ts
│   └── Noise.ts
│
├── main.ts
```
