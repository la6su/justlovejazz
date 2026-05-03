
# Three.js TSL Project – Technical Specification

## Stack
- Three.js (WebGPU + WebGL fallback)
- TSL (Three.js Shading Language / Nodes)
- Vite + TypeScript
- UIkit 3 (YOOtheme)

---

## Architecture Overview

### Core Classes

#### Experience (Singleton)
Responsible for global orchestration

```ts
class Experience {
  static instance: Experience
  scene: THREE.Scene
  camera: Camera
  renderer: Renderer
  sizes: Sizes
  time: Time
  world: World

  constructor() {
    if (Experience.instance) return Experience.instance
    Experience.instance = this

    this.scene = new THREE.Scene()
    this.sizes = new Sizes()
    this.time = new Time()
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.world = new World()

    this.update()
  }

  update() {
    this.camera.update()
    this.world.update()
    this.renderer.update()
    requestAnimationFrame(this.update.bind(this))
  }
}
```

---

#### Renderer (WebGPU → WebGL fallback)

```ts
class Renderer {
  instance: any

  constructor() {
    if (navigator.gpu) {
      this.instance = new THREE.WebGPURenderer()
    } else {
      this.instance = new THREE.WebGLRenderer({ antialias: true })
    }
  }

  update() {
    this.instance.render(scene, camera)
  }
}
```

---

#### World
Handles scene content

```ts
class World {
  background: Background
  model: Model

  constructor() {
    this.background = new Background()
    this.model = new Model()
  }

  update() {
    this.background.update()
    this.model.update()
  }
}
```

---

## Folder Structure

```
src/
 ├── Experience/
 │   ├── Experience.ts
 │   ├── Renderer.ts
 │   ├── Camera.ts
 │   ├── Sizes.ts
 │   ├── Time.ts
 │   └── World/
 │        ├── World.ts
 │        ├── Background.ts
 │        └── Model.ts
 │
 ├── shaders/
 │   └── background.tsl.ts
 │
 ├── ui/
 │   └── index.html
 │
 ├── main.ts
 └── style.css
```

---

## TSL Shader Example (Procedural Background)

```ts
import { color, sin, time, uv } from 'three/nodes'

const uvNode = uv()
const t = time

const wave = sin(uvNode.y.mul(10).add(t))
const finalColor = color(0.1, 0.2, 0.8).mul(wave)

export const backgroundNode = finalColor
```

Usage:

```ts
material.colorNode = backgroundNode
```

---

## GLTF Model Integration

```ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

class Model {
  mesh: THREE.Object3D

  constructor() {
    const loader = new GLTFLoader()
    loader.load('/model.glb', (gltf) => {
      this.mesh = gltf.scene
      scene.add(this.mesh)
    })
  }

  update() {
    if (this.mesh) {
      this.mesh.rotation.y += 0.01
    }
  }
}
```

---

## Interaction System

- Mouse movement → rotation
- Scroll → animation progress

```ts
window.addEventListener('mousemove', (e) => {
  const x = e.clientX / window.innerWidth
  model.mesh.rotation.y = x * Math.PI
})
```

---

## UI Integration

- UIkit sections overlay canvas
- Transparent canvas layer
- Section-based triggers

```ts
observer.onSectionChange((section) => {
  background.setTheme(section.color)
})
```

---

## Performance Strategy

- Mobile-first resolution scaling
- DPR clamp (max 2)
- Lazy loading assets
- Use WebGPU when available

---

## Future Extensions

- Post-processing (Bloom, DOF)
- Node-based materials for models
- Audio-reactive shaders
- GPU particles system

