# AGENTS.md — LLM entry point for justlovejazz. Read first.

> Studio-grade 3D portfolio. Vite 8 + TypeScript + Three.js + UIkit 3. Single-page, 6 sections.

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical state | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, navigation | Understanding structure |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | Hard rules (36) | Before changing code |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Junni patterns to port / NOT port | Adding section visuals |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent merge log | Understanding history |

## Language

User responses: Russian. Code/commits/docs: English.

## Navigation model

| Surface | Role | API |
| --- | --- | --- |
| CircularNav | Bottom-right vinyl circle. Drag DOWN=next, UP=prev | `goToSection(i)`, `goToDirection(±1)`, `isActive()`, `onActiveChange(cb)` |
| UIMenu | UIkit modal, hamburger button | `onNavigate(cb)`, `setActive(i)` |
| BakuCarousel | Works §4 — cube morphs into ring. Card click→overlay | `onCardClick(cb)`, `isAnimating` getter |

## Key rules (see HERMES_RULES.md for full list)

1. No raw ShaderMaterial in scene — TSL NodeMaterial only
2. ONE shared NodeMaterial per multi-face object (not 6)
3. Built-in materials for particles/ground/cards (reduce uniform groups)
4. `setAnimationLoop` — not rAF
5. `scene.background` always set (BG.color)
6. Never remove SplashCube (baku)
7. Single font: Inter
8. NoiseText via `jlz:section-change` event (not IntersectionObserver)
9. `import.meta.hot` — DON'T USE (breaks module loading through proxy)
10. CSS imports use `?inline` suffix (prevents @vite/client injection)
11. On-demand rendering: only render when `_needsRender=true`. Don't set it permanently.
12. Event-driven animations: baku/particles/lights are STATIC when idle. Animate only during transitions.
13. DrawTrail: works section (idx=3) ONLY
14. CursorLight: DELETED — don't re-add
15. `server.hmr: false` + `block-vite-client` plugin in vite.config.ts
16. Always verify: `bun run lint && bun run type-check && bun run build`

## Verification

```bash
bun run lint         # 0 errors
bun run type-check   # 0 errors (strict)
bun run build        # must pass
bun run test:unit    # 54 tests
```
