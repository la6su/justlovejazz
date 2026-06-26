# HERMES_RULES — Operating Protocol for Hermes Agent

> Hard-won rules. Each rule has a concrete bug that caused it.
> Follow them or you WILL break the project.

## Synchronization

```bash
git fetch origin
git checkout main
git pull origin main
git log --oneline -1  # verify you're on latest
```

`main` and `test` are always synced. Never force-push to either.

## Golden rules

### 1. NEVER use ShaderMaterial in scene objects
Use built-in materials only (MeshStandardMaterial, MeshBasicMaterial, PointsMaterial, LineBasicMaterial, GridHelper). ShaderMaterial is incompatible with WebGPURenderer's NodeBuilder.

### 2. NEVER use TSL NodeMaterial for scene objects
MeshPhysicalNodeMaterial with TSL is slow on WebGPU-over-ANGLE. Use built-in materials.

### 3. Non-destructive opacity fade
Cache baseOpacity in userData, apply fade multiplicatively. Never overwrite factory opacity values.

### 4. ALWAYS use setAnimationLoop, not requestAnimationFrame
WebGPU requires setAnimationLoop for swap chain sync. rAF causes 3-5 FPS.

### 5. ALWAYS set scene.background
WebGPURenderer does NOT auto-clear. World.bg.color is authoritative. Never set scene.background = null.

### 6. alpha: false for WebGPURenderer
Chrome defaults to alpha:true → black screen over body#000.

### 7. NEVER remove Baku
Baku is the central 3D character (currently hidden, user will refine). Baku.ts must remain a full Mesh class.

### 8. NEVER make section-bg opaque
DOM sections are transparent overlays. 3D canvas (z-index:1) provides background. section-bg must be transparent.

### 9. Single font: Inter
The entire project uses ONE font: Inter (300-900 weights). Do NOT add Bebas Neue, JetBrains Mono, Source Sans 3, Geologica, or any other font. master-quantum-flares theme sets 'Source Sans 3' — override it in main.less AFTER the import.

### 10. NoiseText trigger: jlz:section-change
NoiseText animation fires on `jlz:section-change` event (from Experience.update when 3D transitions to a new section). Do NOT use IntersectionObserver — it fires too early during scroll. Do NOT use bulk animateNoiseTitles() — it conflicts with section-change.

### 11. Match section IDs
Section IDs in templates.ts must match JS lookups:
- `#section-intro`, `#section-about`, `#section-flexible`
- `#section-challenge` (Works slider, NOT "section-works")
- `#section-innovative`, `#section-contact`

### 12. Reuse #project-overlay
templates.ts defines `<div id="project-overlay">`. ProjectOverlay must reuse it, not create a duplicate.

### 13. WorksPortfolio pointer guard
WorksPortfolio.addEventListener('pointerdown', ..., true) uses capture phase. MUST check `if (!this.group.visible) return` — otherwise it captures ALL clicks on the page, even on non-works sections.

### 14. Don't call onProjectSelect(0) in ensurePortfolio
It triggers _runProjectDissolve → overlay.showContainer() → overlay visible on ALL sections. Call it lazily when user first scrolls to works section (via _portfolioInitialized flag).

### 15. master-quantum-flares is UIKit3 theme — DO NOT TOUCH
It sets 'Source Sans 3' + 'Geologica' fonts. Override AFTER its import in main.less, never modify the theme files.

### 16. No lessons system
Lessons were removed. Do NOT re-add lesson routes, lesson data, or lesson UI. The project is a single scroll page with 6 sections.

### 17. Check junni reference first
Before adding new patterns, check https://github.com/junni-inc/next.junni.co.jp. Don't reinvent the wheel — port junni's approach (adapted to our built-in-materials constraint).

### 18. PostProcessingManager keys = PhaseConfig.id
`PHASE_PRESETS` keys must match `WorldConfig.RAW[i].id` exactly (`sec_intro`, `sec_about`, etc.).
`applyPreset(cfg.id)` is called in `Experience.update()` — if keys diverge, all sections fall back to the default preset and per-section post-processing is effectively disabled.

### 19. No `requestAnimationFrame` in Experience code
Use `StateBus.animate()` + `bus.on('done:<key>', cb)` for all timed transitions (dissolve, intro, etc.). `requestAnimationFrame` fights the WebGPU swap-chain loop managed by `setAnimationLoop`.

### 20. Baku material swap only on role change
`Baku.applyRoleAndParams()` must check `instanceof` before swapping material. Creating a new material every frame is a GPU memory leak. Only swap when the material type actually needs to change (role transition).

### 21. WorldAtmosphere owns fog, BG.ts owns background
`WorldAtmosphere.dispose()` must NOT set `scene.background = null` — that causes a black frame on WebGPU (see §5). `BG.ts` is authoritative for `scene.background`. `WorldAtmosphere` only manages `scene.fog`.

## Verification protocol

After EVERY change:
```bash
bun run type-check   # tsc --noEmit
bun run build        # tsc && vite build
```

For runtime: restart dev server (`bun run dev`), open in browser, check console for errors.

## Stop conditions

- TSL/WebGPU API unclear → ask human
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
- Tempted to use `any` outside adapter boundary → STOP, fix types

## Commit format

```
type: short imperative summary

Body: what changed, why, what bug it fixes.
```

Types: `fix`, `perf`, `feat`, `refactor`, `docs`, `chore`.
