# AGENTS.md

> Entry point for LLM agents. Read this first, then [docs/STATUS.md](docs/STATUS.md).

## Language

- User responses: Russian. Code/commits/docs: English.

## Docs (priority order)

| File | Read when |
| --- | --- |
| [STATUS.md](docs/STATUS.md) ⭐ | **Always first** — canonical state (conflicts → STATUS wins) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Understanding structure, modules, render path |
| [HERMES_RULES.md](docs/HERMES_RULES.md) | Before changing code — hard rules with bug provenance |
| [JUNNI_REFERENCE.md](docs/JUNNI_REFERENCE.md) | Adding section visuals — patterns to port / NOT to port |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Env/runtime problems (Chrome/Wayland WebGPU) |
| [CHANGELOG.md](docs/CHANGELOG.md) | Understanding history |
| [AUDIT.md](docs/AUDIT.md) | Reference only (historical) |

## Navigation model (current)

| Surface | Role | File |
| --- | --- | --- |
| **CircularNav** | Bottom-right vinyl-record dial. Drag along arc → NEXT/PREV (one section). Tap dot → jump. `#circ-nav` | `src/UI/CircularNav.ts` |
| **UIMenu** | UIkit modal (`uk-modal`). Hamburger `#jlz-menu-toggle` (center of dial). Jump to any section | `src/UI/UIMenu.ts` |
| **BakuCarousel card click** | Raycast hit on carousel card → `ProjectOverlay` fullscreen | `src/Experience/World/BakuCarousel.ts` |

- Page scroll disabled (`body { overflow: hidden }`). Sections `position:absolute` stacked.
- `.section-active` toggles visibility on `jlz:section-change`.
- `CircularNav.getOverallProgress()` → `world.advance()` (replaces scroll).

## Key rules (full list in HERMES_RULES.md)

DO:
- Use built-in materials (MeshStandardMaterial/PointsMaterial/LineBasicMaterial) or ONE shared TSL NodeMaterial per object
- Use `setAnimationLoop` (not rAF)
- Set `scene.background` every frame (BG.color is authoritative)
- Gate console logs with `if (import.meta.env.DEV)`
- Import CSS via `?inline` (e.g. `import './assets/main.less?inline'`)
- Wrap `update()` body in try/catch so errors don't stop the loop
- Dispose all listeners + timers + GPU resources in `dispose()`

DON'T:
- Don't use `import.meta.hot` (breaks proxy) — HMR is disabled
- Don't re-add Lenis/SmoothScroll, SectionProgress, CameraAnchors, BorderOverlay, FlexibleSlides, AssetManager, GPUResourceManager (all deleted)
- Don't create 6 NodeMaterials for one object (WebGL binding-point limit)
- Don't use `info.render.calls` (cumulative) — use `info.render.drawCalls` (per-frame)
- Don't touch `master-quantum-flares/` (UIkit theme)
- Don't modify `references/` (READ-ONLY)
- Don't re-add Subtitles (will return as 3D later)

## Verification

```bash
bun run lint         # 0 errors (warnings ok)
bun run type-check   # strict mode, 0 errors
bun run build        # must pass
```

## Synchronization

```bash
git fetch origin && git checkout main && git pull origin main
git log --oneline -1
```

`main` is always deployable. Never force-push.

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
