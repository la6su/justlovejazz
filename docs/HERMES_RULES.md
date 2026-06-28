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

`main`, `dev`, and `test` are always synced. Never force-push to either.

## Golden rules

### 1. NEVER use ShaderMaterial in scene objects
Use built-in materials only (MeshStandardMaterial, MeshBasicMaterial, PointsMaterial, LineBasicMaterial, GridHelper).

### 2. NEVER use TSL NodeMaterial for scene objects
Slow on WebGPU-over-ANGLE. Use built-in materials.

### 3. Non-destructive opacity fade
Cache baseOpacity in userData, apply fade multiplicatively.

### 4. ALWAYS use setAnimationLoop, not requestAnimationFrame
WebGPU requires setAnimationLoop for swap chain sync.

### 5. ALWAYS set scene.background
WebGPURenderer does NOT auto-clear. World.bg.color is authoritative.

### 6. alpha: false for WebGPURenderer
Chrome defaults to alpha:true → black screen.

### 7. NEVER remove the SplashCube (baku)
The SplashCube (Apple Fifth Avenue-style glass cube) IS the baku — the central
3D object present on all sections. It doubles as the splash reveal surface
and the works-slider (project textures on its faces). Removing it breaks both
the splash sequence and the works section.

### 8. NEVER make section-bg opaque
DOM sections are transparent. 3D canvas provides background.

### 9. Single font: Inter
ONE font: Inter (300-900). Override master-quantum-flares AFTER import.

### 10. NoiseText trigger: jlz:section-change
NOT IntersectionObserver. NOT bulk animateNoiseTitles. Section-change event only.

### 11. jlz:webgl-ready MUST fire — do not re-add Troika/WebGLTextManager
WebGLTextManager + troika-three-text were DELETED (they made .studio-title
text transparent, conflicting with NoiseText which edits textContent).
`jlz:webgl-ready` is dispatched by `main-app.ts` at curtain mid-open and
triggers the NoiseText title animation. Do not re-introduce Troika — if
WebGL text rendering is needed, find an approach that does not hide DOM text.

### 12. Match section IDs
intro/about/flexible/challenge/innovative/contact. NOT "section-works".

### 13. Reuse #project-overlay
Don't create duplicate overlay containers.

### 14. WorksPortfolio pointer guard
Check `if (!this.group.visible) return` — capture phase intercepts all clicks.

### 15. master-quantum-flares is UIKit3 theme — DO NOT TOUCH
Override AFTER its import in main.less, never modify theme files.

### 16. No lessons system
Removed. Don't re-add.

### 17. Check junni reference first
`references/next.junni.co.jp/` — DO NOT MODIFY reference files.

### 18. references/ directory is READ-ONLY
Never commit changes to files under `references/`.

### 19. No hallucinated architecture
Don't invent "Stage4", "WorksStack", "Jólni", or other fictional modules.
(Lesson: an earlier LLM agent hallucinated 569 lines of broken TS under these
names — removed in commit 16ad4ef.) Use existing patterns from the junni
reference, adapted to built-in materials.

### 20. Always verify with lint + type-check + build
```bash
bun run lint && bun run type-check && bun run build
```
All three must pass. No exceptions.

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
