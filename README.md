# justlovejazz

Studio-grade interactive 3D portfolio. Vite 8 + TypeScript strict + three 0.184 + TSL + WebGPU + UIkit 3 + Lenis.

**SPA** with hash routing: `#/` (Home), `#/trinity` (Process), `#/works` (Portfolio).

Inspired by `junni-inc/next.junni.co.jp` (patterns only, no assets/content).

## Run

```bash
npm run dev        # dev server
npm run type-check # tsc --noEmit
npm run build      # production build
npm test           # playwright e2e
```

## Docs

| File | Content |
|------|---------|
| [STATUS](docs/STATUS.md) ⭐ | Canonical state — if conflict, STATUS wins |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | Modules, spec, routes, tokens |
| [JUNNI_PORT_BLUEPRINT](docs/JUNNI_PORT_BLUEPRINT.md) | Junni → modern stack port map |
| [AUTONOMY](docs/AUTONOMY.md) | LLM agent protocol |
| [CHANGELOG](docs/CHANGELOG.md) | Recent merge log |
| [AGENTS.md](AGENTS.md) | Agent instructions (rules, stop conditions) |
