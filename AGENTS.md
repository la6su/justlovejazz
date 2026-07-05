# AGENTS.md

Shared instructions for LLM agents working on justlovejazz.
**Read this first** — then read [docs/STATUS.md](docs/STATUS.md) (canonical state)
and [docs/HERMES_RULES.md](docs/HERMES_RULES.md) (hard rules).

## Language

- User responses: Russian. Code/commits/docs: English.

## Docs (priority order)

| File | Content | Read when |
| --- | --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | Canonical current state — if conflict, STATUS wins | **Always first** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, render path, layout, navigation | Understanding structure |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | Hard rules with bug provenance | Before changing code |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Junni patterns to port (and NOT to port) | Adding section visuals |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Chrome/Wayland WebGPU issue + workarounds | Env/runtime problems |
| [CHANGELOG.md](docs/CHANGELOG.md) | Recent merge log | Understanding history |
| [AUDIT.md](docs/AUDIT.md) | Historical gap analysis (all resolved) | Reference only |

## Synchronization

```bash
git fetch origin
git checkout main
git pull origin main
git log --oneline -1  # verify you're on latest
```

`main` is always deployable. Never force-push.

## Key rules (see HERMES_RULES.md for full list)

1. No raw ShaderMaterial in scene — use built-in or TSL NodeMaterial
2. TSL NodeMaterial IS allowed (native WebGPU path); gate by DeviceCapability
3. Non-destructive opacity — cache baseOpacity in userData
4. setAnimationLoop — not rAF
5. scene.background always set (BG.color)
6. alpha:false for WebGPURenderer
7. Never remove the SplashCube (baku) — central 3D object on all sections
8. section-bg transparent (3D canvas provides background)
9. Single font: Inter
10. NoiseText via jlz:section-change event
11. jlz:webgl-ready must fire (do not re-add Troika/WebGLTextManager)
12. Section IDs: intro/about/flexible/challenge/innovative/contact
13. Reuse #project-overlay (don't create duplicate overlay containers)
14. BakuCarousel card click is the SOLE entry point for fullscreen overlay
15. master-quantum-flares DO NOT TOUCH (UIkit theme)
16. No lessons system (removed)
17. Check junni reference first (`references/` is READ-ONLY)
18. references/ directory is READ-ONLY
19. No hallucinated architecture (no "Stage4", "WorksStack", "Jólni")
20. Always verify: `bun run lint && bun run type-check && bun run build`

## Verification

```bash
bun run lint         # must pass (0 errors; warnings ok)
bun run type-check   # must pass (strict mode)
bun run build        # must pass
```

## Navigation model (current)

The app uses **SwipeNav + UIMenu**, NOT scroll-snap:
- **SwipeNav** (bottom bar): drag 0→100% to move to NEXT/PREV section (one at a time). |progress|>50% commits, <50% snaps back. Wheel/scroll does NOT navigate sections.
- **UIMenu** (UIkit modal, top-right hamburger): jump to any section instantly.
- **Sections** are `position:absolute` stacked (not scroll-stacked). `overflow:hidden` on body. `.section-active` toggles visibility.
- **BakuCarousel** (works §4): baku cube morphs into carousel ring. Card click → ProjectOverlay fullscreen.
- **SmoothScroll/Lenis was REMOVED** — do not re-add. ProjectOverlay locks `body.overflow` directly.

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
