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

### 7. NEVER remove Baku
Central 3D character (currently hidden, user will refine).

### 8. NEVER make section-bg opaque
DOM sections are transparent. 3D canvas provides background.

### 9. Single font: Inter
ONE font: Inter (300-900). Override master-quantum-flares AFTER import.

### 10. NoiseText trigger: jlz:section-change
NOT IntersectionObserver. NOT bulk animateNoiseTitles. Section-change event only.

### 11. NEVER disable WebGLTextManager without dispatching jlz:webgl-ready
WebGLTextManager is currently disabled (conflicts with NoiseText). But
jlz:webgl-ready event MUST still fire — it triggers NoiseText animation.

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
Don't create "Stage4", "WorksStack", "Jólni", or other fictional frameworks.
Use existing patterns from junni reference, adapted to built-in materials.

### 20. Always verify with type-check + build
```bash
bun run type-check && bun run build
```
Both must pass. No exceptions.

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
