# HERMES_RULES — Operating Protocol for Hermes Agent

> Hard-won rules from the 2026-06-22 and 2026-06-24 sessions. Each rule has
> a concrete bug that caused it. Follow them or you WILL break the project.

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

### 2. NEVER use TSL NodeMaterial for scene objects

**Bug it caused:** 3-5 FPS on Chrome/WebGPU-over-ANGLE. `MeshPhysicalNodeMaterial` with MaterialX noise compiles to complex WGSL→GLSL that ANGLE can't optimize.

**Rule:** Scene objects use built-in materials. TSL NodeMaterial is reserved for future post-processing (tsl-utils.ts is kept for this).

### 3. NEVER mutate material.opacity destructively in transitions

**Bug it caused:** Materials stuck at opacity=0 after a transition → black screen.

**Rule:** Cache base opacity, apply fade multiplicatively:
```ts
if (m.userData.baseOpacity === undefined) {
  m.userData.baseOpacity = m.opacity
}
m.opacity = m.userData.baseOpacity * fade
```
Never set `mat.transparent = true` at runtime — factory sets it at creation.

### 4. ALWAYS use getTextureNode('output') for pass() (if TSL pipeline used)

**Bug it caused:** Black screen on WebGPU. Using `pass(scene, camera)` directly as color input produces a black frame.

**Rule:**
```ts
// CORRECT
const sceneColor = pass(scene, camera).getTextureNode('output')
// WRONG — black frame
const sceneColor = pass(scene, camera)
```

Note: WebGPU currently uses direct render (no TSL pipeline). This rule
applies when re-enabling TSL post-processing.

### 5. NEVER double-wrap renderOutput

**Rule:** The native `RenderPipeline` has `outputColorTransform=true` by default, which wraps outputNode in `renderOutput()` internally. Do NOT call `renderOutput(color)` yourself — pass color directly.

### 6. ALWAYS use setAnimationLoop, not requestAnimationFrame

**Bug it caused:** 3-5 FPS on WebGPU. rAF does not synchronize with the WebGPU swap chain.

**Rule:**
```ts
// CORRECT
renderer.instance.setAnimationLoop((t) => this.update(t))
// WRONG
requestAnimationFrame((t) => this.update(t))
```
And in `destroy()`: `setAnimationLoop(null)` FIRST, before disposing.

### 7. NEVER add per-frame traverses that are no-ops

**Bug it caused:** World.update traversed all scene groups every frame looking for ShaderMaterial.uTime — but there were no ShaderMaterials. Pure overhead.

**Rule:** Before adding `traverse()` in update(), verify the condition can actually be true.

### 8. ALWAYS set scene.background explicitly on WebGPU

**Bug it caused:** Black screen. WebGPURenderer does NOT implicitly clear the canvas.

**Rule:** `World.bg.color` is set as `scene.background` every frame. Renderer.update must NOT set `scene.background = null`.

### 9. ALWAYS use alpha: false for WebGPURenderer

**Bug it caused:** Black screen on Chrome (Firefox worked). Chrome's WebGPU defaults canvas to alpha:true, compositing over black body — visually indistinguishable from black screen.

**Rule:**
```ts
new WebGPURenderer({ antialias: true, alpha: false })
```

### 10. NEVER break GLSL in ShaderMaterial

**Bug it caused:** `dot()` called with one argument → shader compile error.

**Rule:** When writing GLSL, verify function signatures. `dot(a, b)` needs TWO arguments. `vec4(position, 1.0)` not `vec4(position, 0.0, 1.0)`. Test shaders compile.

### 11. NEVER create duplicate overlay containers

**Bug it caused:** Two `.jlz-works-ui` elements — one empty (from JS), one with content (from templates.ts). Overlay appeared empty.

**Rule:** If templates.ts already defines a container (`#project-overlay`), reuse it. Don't create a new one:
```ts
const existing = document.getElementById('project-overlay')
this.container = existing ?? document.createElement('div')
```

### 12. ALWAYS match section IDs between templates and JS

**Bug it caused:** `getElementById('section-works')` returned null because the section is `#section-challenge`. Overlay didn't mount.

**Rule:** Section IDs in templates.ts must match JS lookups. Current mapping:
- `#section-intro` → intro
- `#section-about` → about
- `#section-flexible` → flexible
- `#section-challenge` → challenge (Works slider, NOT "section-works")
- `#section-innovative` → innovative
- `#section-contact` → contact

### 13. NEVER remove Baku (central 3D character)

**Bug it caused:** Agent replaced Baku with empty stub → no 3D character visible.

**Rule:** Baku is the central 3D object (junni pattern). It's always present in the scene. `src/Experience/World/Baku.ts` must remain a full Mesh class, not a stub.

### 14. NEVER make section-bg opaque

**Bug it caused:** Opaque `.section-bg` covered the 3D canvas → no 3D visible.

**Rule:** DOM sections are transparent overlays. 3D canvas (z-index:1) provides the background. `.section-bg` must be `background: transparent`. Text color is set via `section[data-section]` selectors, not `.section-bg`.

### 15. ALWAYS check junni reference before inventing patterns

**Rule:** Before adding new 3D objects, layout patterns, or UI components, check `https://github.com/junni-inc/next.junni.co.jp` for the corresponding pattern. Don't reinvent the wheel — port junni's approach (adapted to our built-in-materials constraint).

Junni section compositions (for reference):
- Section1: Wall, Logo, Crosses, Gradation, Lines, Slashes, Dots
- Section2: Flexible, Title, Slides, Transparents
- Section3: Wire, Displays, Lights, BackText, CursorLight, Particle
- Section4: Peoples, TileText
- Section5: Grid, TextRing, Outro
- Section6: Comrades, Next, Particle, Road, Wind

## Verification protocol

After EVERY change:

```bash
bun run type-check   # tsc --noEmit
bun run build        # tsc && vite build
```

Both must pass. If type-check fails, FIX the error — do not suppress.

For runtime verification:
```bash
agent-browser open http://127.0.0.1:5173/
agent-browser console  # check for errors
agent-browser screenshot /tmp/shot.png
z-ai vision -p "Is 3D content visible?" -i /tmp/shot.png
```

## Commit format

```
type: short imperative summary

Body: what changed, why, what bug it fixes (with actual error message).
```

Types: `fix`, `perf`, `feat`, `refactor`, `docs`, `chore`.

## Stop conditions

- TSL/WebGPU API unclear after checking `node_modules/three/src/nodes`
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
- Tempted to use `any` outside adapter boundary → STOP, fix types

## Branch hygiene

- `main` and `test` are always synced (test = main)
- Feature branches: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- Delete merged branches after PR merge
- Never force-push to `main` or `test`
