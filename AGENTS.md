# AGENTS.md

Shared instructions for LLM agents (Hermes, Claude, etc.). Cross-platform.

## Language

- User responses: Russian. Code/commits/docs: English.

## References (priority order)

1. `docs/STATUS.md` ⭐ — canonical state (if conflict, STATUS wins)
2. `docs/HERMES_RULES.md` — 15 hard rules with bug provenance (READ FIRST)
3. `docs/ARCHITECTURE.md` — modules + render path + layout
4. `docs/JUNNI_REFERENCE.md` — junni patterns to port (and NOT to port)
5. `docs/ENVIRONMENT.md` — known env issues (Chrome/Wayland WebGPU)
6. `docs/AUTONOMY.md` — operating protocol

## Synchronization (before any work)

```bash
git fetch origin
git checkout main
git pull origin main
git log --oneline -1  # verify you're on latest
```

`main` and `test` are always synced. Never force-push to either.

## Hard rules (see HERMES_RULES.md for full detail)

1. **No ShaderMaterial in scene objects** — use built-in materials only
2. **No TSL NodeMaterial for scene objects** — built-in only (perf on WebGPU)
3. **Non-destructive opacity fade** — cache baseOpacity in userData
4. **getTextureNode('output')** for pass() (if TSL pipeline used)
5. **No double renderOutput** — RenderPipeline applies it internally
6. **setAnimationLoop, not requestAnimationFrame** — WebGPU requires it
7. **No per-frame no-op traverses** — verify condition can be true
8. **Always set scene.background** — WebGPU doesn't auto-clear (via BG.color)
9. **alpha: false for WebGPURenderer** — Chrome default alpha:true = black
10. **Valid GLSL** — verify function signatures, test compile
11. **No duplicate overlay containers** — reuse #project-overlay from templates
12. **Match section IDs** — templates.ts IDs must match JS lookups
13. **Never remove Baku** — central 3D character, always present
14. **Never make section-bg opaque** — 3D canvas must be visible through DOM
15. **Check junni reference first** — don't reinvent, port patterns

## Section IDs (memorize)

```
#section-intro     → 3D group 0 (Baku on white)
#section-about     → 3D group 1 (blob on dark)
#section-flexible  → 3D group 2 (metal drop)
#section-challenge → 3D group 3 (Works slider — NOT "section-works")
#section-innovative→ 3D group 4 (constellation)
#section-contact   → 3D group 5 (Baku on dark)
```

## Verification (after EVERY change)

```bash
bun run type-check   # must pass
bun run build        # must pass
```

For runtime: agent-browser + VLM screenshot check.

## Commit format

```
type: short imperative summary

Body: what + why + bug fixed (with actual error message).
```

Types: `fix`, `perf`, `feat`, `refactor`, `docs`, `chore`.

## Stop conditions

- TSL/WebGPU API unclear after checking `node_modules/three/src/nodes`
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
- Tempted to use `any` outside adapter boundary → STOP, fix types
