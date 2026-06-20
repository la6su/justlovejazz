# AGENTS.md

Shared instructions for LLM agents. Cross-platform, model-agnostic.

## Language

- User responses: Russian. Code/commits/docs: English.

## References (priority order)

1. `docs/STATUS.md` ⭐ — canonical state (if conflict, STATUS wins)
2. `docs/ARCHITECTURE.md` — modules + spec + routes
3. `docs/JUNNI_PORT_BLUEPRINT.md` — port map + junni patterns
4. `docs/AUTONOMY.md` — operating protocol

## Rules

- Small scoped changes. Verify after each: `bun run type-check` + `bun run build`.
- No new dependencies without human approval. No tsconfig relaxation. No `any` outside adapters.
- TSL helpers in `src/shaders/tsl-utils.ts`. Version assumptions documented in header.
- Window listeners: bound handler ref + `destroy()`/`dispose()`. No anonymous arrows.
- Styling: `--jlz-*` tokens in `tokens.css`. No hardcoded colors/sizes. Inline `style=` only for dynamic values.
- `prefers-reduced-motion` respected. ARIA roles on overlays.
- Post-processing: WebGPU uses `three/addons BloomNode`. Do not reimplement bloom.
- Works page: pure slider — hide Baku, ground, scene groups. Only cards + fog + lights.
- Scene animation: per-component, name-driven, purposeful. No blanket rotation.
- GridHelper cast: `as THREE.Object3D` (not Mesh).

## Commit format

```
type: short imperative summary
```

## Stop conditions

- TSL/WebGPU API unclear after checking `node_modules/three/tsl`
- Same verify fails after 2 approaches
- Product/design decision not in docs
- New dependency needed
