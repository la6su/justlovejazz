# AUDIT — Gap Analysis: justlovejazz vs junni reference

> Created: 2026-06-26. Based on full codebase + reference review.
> Source: `references/next.junni.co.jp/src/ts/MainScene/`
> Priority: 🔴 High / 🟡 Medium / 🟢 Low

---

## 🔴 HIGH PRIORITY — Quick wins, real user impact

### A-001 · `World.resize()` is empty
**File:** `src/core/World.ts`
**Problem:**
```ts
public resize(_width: number, _height: number): void {}  // does nothing
```
`Camera.ts` updates `instance.aspect` on resize via its own window listener.
But `sceneGroups`, `groundPlane`, `atmosphere`, and `Baku` never react to
viewport changes. On narrow screens or after window resize, 3D layout breaks.

**Junni pattern:**
```ts
public resize(info: ORE.LayerInfo) {
  this.trail?.resize(info)
  this.intro.resize(info)
  this.baku.resize(info)
  this.sections.forEach(item => item.resize(info))
}
```

**Fix:** Call `world.resize(width, height)` from `Experience` Sizes listener.
Propagate to sceneGroups (scale/position recalc) and groundPlane.

---

### A-002 · Portrait FOV adaptation missing
**File:** `src/core/WorldConfig.ts`, `src/Experience/Camera.ts`
**Problem:**
Camera FOV is fixed per section in `WorldConfig`. On mobile portrait (aspect <1),
3D objects get clipped or appear too far. Junni solves this with:
```ts
// Section base class
public cameraSPFovWeight: number = 30  // extra FOV degrees on portrait

// CameraController
fovCalculated = fov + cameraSPFovWeight * portraitWeight
// portraitWeight = clamp(1 - aspect / 1.5, 0, 1)
```
Result: portrait mobile automatically widens FOV so objects fit the screen.

**Fix:** Add `portraitFovBoost` to `PhaseConfig` (default 20°). In
`Camera.updateSmooth()`, compute `portraitWeight = clamp(1 - aspect/1.5, 0, 1)`
and add `portraitWeight * portraitFovBoost` to the lerped FOV target.

---

### A-003 · `Section.switchState()` has a logic bug
**File:** `src/core/Section.ts`
**Problem:**
```ts
public switchState(target: SectionState, duration: number, reduced: boolean): void {
    const bus = StateBus.getInstance()
    const delta = STATE_VALUE[target] - bus.get(this.stateChannel)
    if (delta === 0) return
    const dur = reduced ? 0 : duration
    bus.channel(this.stateChannel, STATE_VALUE[target])  // ← RESETS to target value
    bus.animate(this.stateChannel, bus.get(...) + delta, ...)  // ← delta added to target
}
```
`bus.channel()` overwrites the current channel value with `STATE_VALUE[target]`.
Then `bus.get()` returns the just-written target, and `+ delta` overshoots.
Result: transitions start from wrong position — no smooth state animation.

**Fix:**
```ts
const current = bus.get(this.stateChannel)  // read BEFORE any write
const targetValue = STATE_VALUE[target]
if (Math.abs(targetValue - current) < 0.001) return
bus.animate(this.stateChannel, targetValue, duration, 'easeOutQuart')
```
Remove the `bus.channel()` call from switchState — channel was already
registered in constructor.

---

### A-004 · `World.resize()` never called from Experience
**File:** `src/Experience/Experience.ts`, `src/Experience/Sizes.ts`
**Problem:**
`Sizes.ts` dispatches resize events and `Camera.ts` listens directly.
But `world.resize()` is never called — the method exists but is wired to nothing.

**Fix:** In `Sizes.ts` or `Experience`, add:
```ts
// In Experience, subscribe to Sizes resize:
this.sizes.on('resize', () => {
  this.world?.resize(this.sizes.width, this.sizes.height)
})
```
Or simpler: call `world.resize(w, h)` inside `Renderer.resize()` which
is already wired to window resize.

---

## 🟡 MEDIUM PRIORITY — Architecture improvements

### A-005 · `Baku.applyRoleAndParams()` called every frame without role caching
**File:** `src/Experience/World/Baku.ts`
**Problem:**
```ts
update(delta: number): void {
    // ...drift...
    this.applyRoleAndParams()  // called EVERY frame
}

private applyRoleAndParams(): void {
    const role = this.targetParams.role
    if (role === BakuRole.GLASS) {
        if (!(this.material instanceof THREE.MeshPhysicalMaterial)) {
            swapMaterial(...)  // potential swap every frame
        }
        // lerp transmission/thickness every frame even at stable state
    }
}
```
Even with the `instanceof` guard, the method runs all branches and lerp
operations on every frame including when role hasn't changed in weeks.

**Fix:** Cache `_currentRole: BakuRole` and skip `applyRoleAndParams()`
when role hasn't changed:
```ts
private _currentRole: BakuRole | null = null

update(delta: number): void {
    this._time += delta
    this._applyDrift(delta)
    if (this.targetParams.role !== this._currentRole || this._materialNeedsLerp) {
        this._applyRoleAndParams()
    }
}
```

---

### A-006 · Double traverse in `updateTransform()` per frame
**File:** `src/core/World.ts`
**Problem:**
Two separate traversals happen every frame on overlapping sets of objects:

1. **sceneGroups fade** (`updateTransform`):
```ts
g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
        m.opacity = m.userData.baseOpacity * fade
    }
})
```

2. **Section opacity** (`Section.setMeshOpacity()` via StateBus):
```ts
this.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh) { mat.opacity = value }
})
```

Both traverse the same scene graph, touching the same Mesh materials,
on every frame. Section traverse also has no cache (unlike `_cachedMeshes`
which was added to `Section.update()` but NOT to `setMeshOpacity()`).

**Fix:**
- Add `_opacityMeshCache` to `Section` (same pattern as `_cachedMeshes`)
- In `updateTransform`: use cached refs in sceneGroups instead of traverse
  (store in `group.userData._meshCache` alongside `_particleCache`)

---

### A-007 · DrawTrail disabled globally — needs per-section enable/disable
**File:** `src/core/World.ts`, `src/Experience/World/DrawTrail.ts`
**Problem:**
```ts
// World.ts constructor:
// PERF: disabled — re-enable when perf budget allows.
// this.drawTrail = new DrawTrail()
```
DrawTrail is commented out entirely. Junni only enables trail on specific
sections (Section1 and Section3) and uses `changeMaterial(sectionIndex)` to
change the trail appearance per section.

Our `DrawTrail.ts` exists and is implemented correctly with a 64-point ring
buffer + `LineBasicMaterial`. It's safe to re-enable with per-section gating:
```ts
// Only show trail on about/flexible sections:
const trailSections = [1, 2]  // sec_about, sec_flexible
if (this.drawTrail) {
    this.drawTrail.object.visible = trailSections.includes(fromIndex)
}
```

**Fix:** Uncomment DrawTrail in World constructor + add visibility gating
in `updateTransform` based on `_currentSectionIndex`.

---

### A-008 · `Section.setMeshOpacity()` traverses every call — no cache
**File:** `src/core/Section.ts`
**Problem:**
`setMeshOpacity()` is called from `applyState()` (on every state change) AND
from `applyOpacity()` (on every StateBus tick while animating opacity):
```ts
private setMeshOpacity(value: number): void {
    this.traverse((obj: THREE.Object3D) => {  // ← full traverse every call
        if (obj instanceof THREE.Mesh) { ... }
    })
}
```
`_cachedMeshes` was added to `update()` but `setMeshOpacity()` still uses
raw traverse. On opacity animations (0→1 over 0.6s at 60fps = 36 calls),
each call traverses the full Section object graph.

**Fix:** Reuse `_cachedMeshes` (already populated by `update()`) in
`setMeshOpacity()`. Lazy-init it if null (same pattern as update).

---

### A-009 · Baku per-section behavior missing
**File:** `src/core/WorldConfig.ts`, `src/Experience/World/Baku.ts`
**Problem:**
Junni changes Baku behavior per section:
```ts
this.baku.changeRotateSpeed(section.bakuParam.rotateSpeed)
this.baku.changeMaterial(section.bakuParam.materialType)
this.baku.changeSectionAction(section.sectionName)
```
- Section 1 (Intro): `rotateSpeed = 0`, splash animation
- Section 2 (Flexible): `rotateSpeed = -0.09`, glass material
- Section 3 (Works): `rotateSpeed = 0`, wire material, hidden behind cards
- Section 4 (Peoples): `materialType = 'line'`

Our Baku has `visible = false` and `updateMaterial()` exists but is never
called from section transitions. The WorldConfig already has `bakuRole` per
section but `World.updateTransform()` computes `bakuMaterial` state and puts
it in `worldState` — but nobody consumes it to call `baku.updateMaterial()`.

**Fix:** In `World.update()` or `updateTransform()`:
```ts
// Apply baku material from worldState (currently computed but not applied)
this.baku.updateMaterial(worldState.bakuMaterial)
```
This is already wired in WorldConfig — just needs the final connection.

---

### A-010 · `SmoothScroll` Lenis version mismatch
**File:** `src/Experience/SmoothScroll.ts`, `package.json`
**Problem:**
`@studio-freight/lenis` v1.0.42 is used, but the import path and API
may conflict with newer `lenis` package (now maintained separately from
studio-freight). The `scroll` event `limit` property type is `number | undefined`
in our Input.ts but `setScroll(value, limit)` defaults to `getDocumentScrollLimit()`
which can diverge from Lenis's internal limit if Lenis recalculates late.

**Fix:** Pin to `lenis` (new package) or verify `@studio-freight/lenis@1.0.42`
scroll event provides stable `limit`. Add defensive clamp in `setScroll()`.

---

## 🟢 LOW PRIORITY — Nice to have / high effort

### A-011 · BG gradient sphere (junni) — intentionally NOT ported
**Why not:** Junni uses a `SphereGeometry` + `ShaderMaterial` for gradient BG.
HERMES_RULES §1 prohibits `ShaderMaterial` in scene objects.
Our `BG.setProgress(from, to, t)` color lerp is the correct alternative.
**Status:** Resolved — do not port.

### A-012 · Intro wall / cannon.js physics (junni Section1)
**Why not:** `cannon.js` physics adds ~180KB and significant CPU overhead.
The visual (logo pieces flying in) requires GLTF assets we don't have.
**Status:** Out of scope for current portfolio.

### A-013 · Junni global `window.gManager.animator` pattern
**Why not:** Junni uses a global ORE.Animator singleton (`window.gManager`)
accessible from anywhere. We replaced this with `StateBus` which is
architecturally cleaner (no global window mutation, typed, tree-shakeable).
**Status:** Our implementation is better — keep StateBus.

### A-014 · Junni `uSectionVisibility` uniform approach
**Why not:** Junni passes `sectionVisibility` as a GLSL uniform to ShaderMaterial
for GPU-side opacity fade. We use CPU-side `material.opacity` which works
correctly with built-in materials and doesn't require ShaderMaterial.
**Status:** Our approach is correct given HERMES_RULES constraints.

### A-015 · Per-section `cameraRange` for cursor follow
**File:** `src/Experience/Camera.ts`
**Problem:**
Junni defines `cameraRange: THREE.Vector2` per section to limit how much
the camera follows the cursor. Section1 has `cameraRange.set(0.01, 0.01)` —
almost no cursor movement. Section3 (Works) has larger range for interactive feel.
Our camera uses fixed `cursorFollow = isHome ? 0.19 : 0.15`.

**Fix (low effort):** Add `cursorFollowStrength` to `PhaseConfig` and read
it in `Camera.update()`. Lerp between sections. Medium visual impact.

---

## Implementation Order

| ID | Description | Impact | Effort | Status |
|----|-------------|--------|--------|--------|
| A-001 | World.resize() implementation | High | Low | ⏳ TODO |
| A-002 | Portrait FOV adaptation | High | Low | ⏳ TODO |
| A-003 | Section.switchState() bug fix | High | Low | ⏳ TODO |
| A-004 | World.resize() wired to Experience | High | Low | ⏳ TODO |
| A-005 | Baku role caching | Medium | Low | ⏳ TODO |
| A-006 | Double traverse optimization | Medium | Medium | ⏳ TODO |
| A-007 | DrawTrail per-section re-enable | Medium | Medium | ⏳ TODO |
| A-008 | Section.setMeshOpacity cache | Medium | Low | ⏳ TODO |
| A-009 | Baku worldState→material connection | Medium | Low | ⏳ TODO |
| A-010 | Lenis version verification | Low | Low | ⏳ TODO |
| A-015 | Per-section cursor follow strength | Low | Low | ⏳ TODO |
| A-011 | BG gradient sphere | — | — | ✅ Resolved (HERMES §1) |
| A-012 | Intro physics wall | — | — | ✅ Out of scope |
| A-013 | Global animator pattern | — | — | ✅ StateBus is better |
| A-014 | uSectionVisibility uniform | — | — | ✅ CPU opacity is correct |

---

## What we do better than junni

| Area | Ours | Junni | Why ours wins |
|------|------|-------|---------------|
| BG transitions | `setProgress(from, to, t)` continuous lerp | `changeSection(index)` snap | Pixel-perfect scroll-driven color |
| State management | `StateBus` — typed, tree-shakeable | `window.gManager.animator` global | No global mutation, testable |
| Works carousel | Spring-damper, drag, momentum, expand | Static `Displays` mesh cards | Full interactive physics |
| Renderer | WebGPU → WebGL2 auto-fallback | WebGL only (ShaderMaterial breaks WebGPU) | Future-proof |
| Post-processing | Section-keyed presets, quality tiers | Fixed global params | Per-device + per-section |
| Scroll smoothing | Exponential half-life (framerate-independent) | Fixed lerp factor | Consistent feel at all fps |
