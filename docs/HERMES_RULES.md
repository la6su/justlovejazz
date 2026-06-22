# HERMES_RULES — Operating Protocol for Hermes Agent

> Hard-won rules from the 2026-06-22 session. Each rule has a concrete bug
> that caused it. Follow them or you WILL break the project.

## Synchronization

Before starting work:

```bash
git fetch origin
git checkout main
git pull origin main
# Verify you're on the latest:
git log --oneline -1  # should match origin/main
```

If you have local work on a feature branch:

```bash
git checkout <your-branch>
git fetch origin
git rebase origin/main
```

Never force-push to `main` or `test`. These are synced branches.

## Golden rules

### 1. NEVER use ShaderMaterial in scene objects

**Bug it caused:** `THREE.NodeBuilder: Material "ShaderMaterial" is not compatible` — scene objects failed to render on WebGPURenderer (even on WebGL2 backend, NodeBuilder is used).

**Rule:** All scene object materials MUST be built-in:
- `MeshBasicMaterial`, `MeshStandardMaterial`, `MeshPhysicalMaterial`
- `PointsMaterial`, `LineBasicMaterial`
- `GridHelper` (not a custom shader grid)
- `MeshBasicMaterial` + `vertexColors` (not a custom gradient shader)

ShaderMaterial is ONLY allowed in:
- `RenderPipeline.ts` WebGL2 post-processing path (operates on RTs, not scene)
- `dissolveOverlay.ts` (skipped on WebGPU via mode check)

### 2. NEVER use TSL NodeMaterial for scene objects on WebGPU

**Bug it caused:** 3-5 FPS on Chrome/WebGPU-over-ANGLE. `MeshPhysicalNodeMaterial` with MaterialX noise compiles to complex WGSL→GLSL that ANGLE can't optimize.

**Rule:** Scene objects use built-in materials (see rule 1). TSL NodeMaterial is reserved for post-processing (and even there, WebGPU currently uses direct render without post).

### 3. NEVER mutate material.opacity destructively in transitions

**Bug it caused:** Materials stuck at opacity=0 after a transition → black screen.

**Rule:** Cache base opacity on first encounter, apply fade multiplicatively:
```ts
if (m.userData.baseOpacity === undefined) {
  m.userData.baseOpacity = m.opacity
}
m.opacity = m.userData.baseOpacity * fade
```
Never set `mat.transparent = true` at runtime — it changes the render path. Let the factory set it at creation.

### 4. ALWAYS use getTextureNode('output') for pass()

**Bug it caused:** Black screen on WebGPU. Using `pass(scene, camera)` directly as a color input produces a black frame — the texture binding never resolves.

**Rule:**
```ts
// CORRECT
const scenePass = pass(scene, camera)
const sceneColor = scenePass.getTextureNode('output')

// WRONG — black frame
const sceneColor = scenePass
```

### 5. NEVER double-wrap renderOutput

**Bug it caused:** Extra node-graph layer, silent black frame on some drivers.

**Rule:** The native `RenderPipeline` has `outputColorTransform=true` by default, which wraps the outputNode in `renderOutput()` internally. Do NOT call `renderOutput(color)` yourself — pass the color node directly:
```ts
// CORRECT
new RenderPipeline(renderer, color)

// WRONG — double renderOutput
new RenderPipeline(renderer, renderOutput(color, null, null))
```

### 6. ALWAYS use setAnimationLoop, not requestAnimationFrame

**Bug it caused:** 3-5 FPS on WebGPU. rAF does not synchronize with the WebGPU swap chain.

**Rule:**
```ts
// CORRECT
renderer.instance.setAnimationLoop((t) => this.update(t))

// WRONG — WebGPU frame pacing broken
requestAnimationFrame((t) => this.update(t))
```

And in `destroy()`: `setAnimationLoop(null)` FIRST, before disposing resources.

### 7. NEVER add per-frame traverses that are no-ops

**Bug it caused:** World.update traversed all scene groups every frame looking for ShaderMaterial.uTime — but there were no ShaderMaterials. Pure overhead.

**Rule:** Before adding a `traverse()` in update(), verify the condition can actually be true. If the scene uses only built-in materials, don't traverse for ShaderMaterial.

### 8. ALWAYS set scene.background explicitly on WebGPU

**Bug it caused:** Black screen. WebGPURenderer does NOT implicitly clear the canvas — without `scene.background`, the swap chain presents an uninitialized buffer.

**Rule:** In Renderer.update(), force a default background if none is set:
```ts
if (!scene.background) {
  scene.background = defaultColor
}
```

### 9. ALWAYS use alpha: false for WebGPURenderer

**Bug it caused:** Black screen on Chrome (Firefox worked). Chrome's WebGPU defaults canvas to alpha:true (transparent), compositing over the black body background — visually indistinguishable from a black screen.

**Rule:**
```ts
new WebGPURenderer({ antialias: true, alpha: false })
```

### 10. NEVER break GLSL in ShaderMaterial

**Bug it caused:** `dot()` called with one argument → shader compile error → "Program must be linked successfully".

**Rule:** When writing GLSL, verify function signatures. `dot(a, b)` needs TWO arguments of matching type. `vec4(position, 1.0)` not `vec4(position, 0.0, 1.0)` (too many args for vec3+float). Test shaders actually compile.

## Verification protocol

After EVERY change:

```bash
bun run type-check   # tsc --noEmit
bun run build        # tsc && vite build
```

Both must pass. If type-check fails, FIX the error — do not suppress with `@ts-ignore` or `any`.

For runtime verification, use agent-browser + VLM:
```bash
agent-browser open http://127.0.0.1:5173/
agent-browser console  # check for errors
agent-browser screenshot /tmp/shot.png
z-ai vision -p "Is 3D content visible?" -i /tmp/shot.png
```

## Commit format

```
type: short imperative summary

Body: what changed, why, what bug it fixes (with the actual error message).
```

Types: `fix`, `perf`, `feat`, `refactor`, `docs`, `chore`.

## Stop conditions

- TSL/WebGPU API unclear after checking `node_modules/three/src/nodes`
- Same verify fails after 2 approaches — ask human
- Design decision not in docs — ask human
- New dependency needed — ask human
- Tempted to use `any` outside an adapter boundary — STOP, fix the types

## Branch hygiene

- `main` and `test` are always synced (test = main)
- Feature branches: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- Delete merged branches after PR merge
- Never commit to `main` directly — PR via `test` or feature branch
