# AGENTS.md

Shared instructions for LLM agents (Hermes, Claude, etc.).

## Language

- User responses: Russian. Code/commits/docs: English.

## References (priority order)

1. `docs/STATUS.md` ⭐ — canonical state
2. `docs/HERMES_RULES.md` — 17 hard rules (READ FIRST)
3. `docs/ARCHITECTURE.md` — modules + render path + layout
4. `docs/JUNNI_REFERENCE.md` — junni patterns to port
5. `docs/ENVIRONMENT.md` — known env issues

## Synchronization

```bash
git fetch origin
git checkout main
git pull origin main
```

## Key rules (see HERMES_RULES.md for detail)

1. **No ShaderMaterial in scene** — built-in materials only
2. **No TSL NodeMaterial for scene** — slow on WebGPU
3. **Non-destructive opacity** — cache baseOpacity
4. **setAnimationLoop** — not requestAnimationFrame
5. **scene.background** — always set (via BG.color)
6. **alpha: false** — for WebGPURenderer
7. **Never remove Baku** — central 3D character
8. **section-bg transparent** — 3D canvas behind
9. **Single font: Inter** — no other fonts
10. **NoiseText via jlz:section-change** — not IntersectionObserver
11. **Section IDs** — intro/about/flexible/challenge/innovative/contact
12. **Reuse #project-overlay** — no duplicates
13. **WorksPortfolio pointer guard** — check group.visible
14. **No onProjectSelect(0) in ensurePortfolio** — lazy init
15. **master-quantum-flares** — DO NOT TOUCH, override after import
16. **No lessons** — removed, don't re-add
17. **Check junni reference** — don't reinvent

## Section IDs (memorize)

```
#section-intro     → 3D group 0
#section-about     → 3D group 1
#section-flexible  → 3D group 2
#section-challenge → 3D group 3 (Works slider)
#section-innovative→ 3D group 4
#section-contact   → 3D group 5
```

## Verification

```bash
bun run type-check   # must pass
bun run build        # must pass
```

## Commit format

```
type: short imperative summary

Body: what + why + bug fixed.
```
