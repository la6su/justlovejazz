# justlovejazz

Interactive studio portfolio with Three.js + WebGPU, implemented as a
**single-page application** with hash-based routing (`src/router.ts`):

- `index.html` → entry shell, splash, canvas mount
- `#/` (default) — Home: studio positioning + capabilities
- `#/trinity` — Process / method
- `#/works` — Interactive portfolio (sticky selector + 3D expansion + detail modal)

Project direction is inspired by studio-level quality patterns similar to
`next.junni.co.jp` (patterns only, no asset/content copying). See
[`docs/JUNNI_PORT_BLUEPRINT.md`](docs/JUNNI_PORT_BLUEPRINT.md) for the
port map and acceptance criteria.

## Current Implementation

| Area | Status |
|------|--------|
| TypeScript strict + build stability | ✅ |
| Renderer contract (`webgpu/webgl/unsupported`) | ✅ |
| Multi-page build (MPA) | ✅ |
| Shared page template (loader/nav/sections/modal) | ✅ |
| Works page sticky portfolio + click-to-open project flow | ✅ |
| WebGPU primary + WebGL fallback path | ✅ |
| E2E smoke for Home + Works | ✅ |
| CI-level Lighthouse/perf closure | 🔄 |

## Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (strict) |
| Build | Vite 8 (MPA) |
| 3D | Three.js 18.4 + TSL (Node Materials) |
| GPU | WebGPU primary, explicit WebGL fallback |
| Motion/Scroll | Lenis + state-driven timeline |
| UI | UIkit 3 + Less |

## Run

```bash
npm run dev
npm run type-check
npm run build
npm test
```

## Architecture Snapshot

```
src/
├── core/                  # Bootstrapper, state/capability managers, lifecycle managers
├── Experience/            # Renderer, Camera, loop, section/world orchestration
├── Experience/World/      # GalleryScene, Baku, Environment, section content
├── shaders/               # TSL utilities, post-processing, gallery materials
└── UI/                    # Sticky Works UI, detail modal, UI wiring
```

Single render loop in `Experience.update()` drives camera, world, post-processing, gallery state, and UI sync.

## Route Roles

- `#/` (Home): positioning and capabilities overview.
- `#/trinity`: process/system framing.
- `#/works`: fully interactive project portfolio (sticky selector + 3D expansion + detail modal).

## Docs

| File | Content |
|------|---------|
| [CONCEPT](docs/CONCEPT.md) | Design and narrative concept |
| [SPEC](docs/SPEC.md) | Technical contracts and runtime rules |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Module responsibilities and data flow |
| [ROADMAP](docs/ROADMAP.md) | Delivery progress and next milestones |
| [AUTONOMY](docs/AUTONOMY.md) | Agent execution protocol |
| [PRODUCTION_AUTOPILOT_PLAN](docs/PRODUCTION_AUTOPILOT_PLAN.md) | Studio-grade completion plan |
| [SKILLS_TRAINING_PLAN](docs/SKILLS_TRAINING_PLAN_WEBGPU_THREEJS_JUNNI_STYLE.md) | Skill-building system for this stack |
