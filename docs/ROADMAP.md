# ROADMAP

## Current State (2026-05-21)

| Area | Status |
|-------|-------------|
| TypeScript strict | Green |
| Build (Vite) | Green |
| WebGPU/WebGL/unsupported modes | Implemented |
| Multi-page flow | Implemented |
| Main risk | Oversized core chunk in production build |

## Refactoring Milestones

### M1. Contract Stabilization

- Normalize renderer capability contract usage across modules.
- Remove behavioral drift between type-level and runtime decisions.
- Lock explicit UX for `unsupported`.

### M2. State and Timeline Consistency

- Normalize `scroll -> worldState -> camera/post` transitions.
- Remove magic multipliers duplicated across modules.
- Verify deterministic behavior for rapid input changes.

### M3. Asset Lifecycle Hardening

- Audit resource ownership and disposal boundaries.
- Keep disposal strictly context-driven (no random/manual scatter).
- Validate no memory growth on repeated route/section transitions.

### M4. Bundle and Loading Optimization

- Split heavy runtime by feature boundary.
- Reduce critical startup payload.
- Keep lazy-loading policy simple and measurable.

### M5. Production QA Gate

- Desktop/mobile smoke and fallback checks.
- Accessibility baseline (`prefers-reduced-motion`, keyboard escape/back, non-hover critical actions).
- Final docs-to-code sync and release checklist close.

## Exit Criteria

1. `npm run type-check` and `npm run build` stable green over multiple refactor iterations.
2. Fallback behavior is explicit, tested, and documented.
3. No critical perf/memory regressions versus current baseline.
4. Documentation reflects real architecture, not historical plans.
