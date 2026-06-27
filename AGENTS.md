# AGENTS.md

Shared instructions for LLM agents (Hermes, Claude, etc.).

## Language

- User responses: Russian. Code/commits/docs: English.

## References (priority order)

1. `docs/STATUS.md` ⭐ — canonical state
2. `docs/HERMES_RULES.md` — 20 hard rules (READ FIRST)
3. `docs/ARCHITECTURE.md` — modules + render path + layout
4. `docs/JUNNI_REFERENCE.md` — junni patterns to port
5. `docs/ENVIRONMENT.md` — known env issues

## Synchronization

```bash
git fetch origin
git checkout main
git pull origin main
```

`main`, `dev`, `test` are always synced.

## Key rules (see HERMES_RULES.md)

1. No ShaderMaterial in scene — built-in only
2. No TSL NodeMaterial for scene — slow on WebGPU
3. Non-destructive opacity — cache baseOpacity
4. setAnimationLoop — not rAF
5. scene.background always set (BG.color)
6. alpha:false for WebGPURenderer
7. Never remove Baku
8. section-bg transparent
9. Single font: Inter
10. NoiseText via jlz:section-change
11. WebGLTextManager disabled but jlz:webgl-ready must fire
12. Section IDs: intro/about/flexible/challenge/innovative/contact
13. Reuse #project-overlay
14. WorksPortfolio pointer guard (check group.visible)
15. master-quantum-flares DO NOT TOUCH
16. No lessons
17. Check junni reference first
18. references/ READ-ONLY
19. No hallucinated architecture (no "Stage4", "WorksStack", "Jólni")
20. Always verify: `bun run type-check && bun run build`

## Verification

```bash
bun run type-check   # must pass
bun run build        # must pass
```
