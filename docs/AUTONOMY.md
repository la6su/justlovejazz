# AUTONOMY — LLM Agent Protocol

## Loop

```
read → decide → edit → verify(type-check + build) → commit → continue
```

No broad refactors without failing build, TODO, or documented plan.

## Before starting

1. `git fetch origin && git checkout main && git pull origin main`
2. Read [RULES.md](RULES.md) — hard rules with bug provenance
3. Read [STATUS.md](STATUS.md) — current state, don't redo done work

## Priority

1. Build/type errors → 2. Public API breaks → 3. Renderer contract →
4. Navigation (JoystickNav/UIMenu) → 5. Lifecycle/disposal → 6. BakuCarousel morph →
7. Camera → 8. Pipeline → 9. A11y → 10. Perf

## Edit rules

- Delete dead code over hiding it. No `@ts-ignore` without TODO.
- Don't change visuals while fixing build. Don't reformat unrelated files.
- TSL: inspect `node_modules/three/src/nodes` first. Wrap unstable patterns in helpers.
- Lifecycle: bound handler refs, `destroy()` on every listener owner.
- Styling: tokens only. No hardcoded values.
- **No ShaderMaterial in scene objects** — see RULES.md §1.
- **TSL NodeMaterial allowed** (built-in preferred for simple cases) — see RULES.md §2.
- **ONE shared NodeMaterial per multi-face object** — see RULES.md §3.
- **setAnimationLoop, not rAF** — see RULES.md §6.
- **No `import.meta.hot`** (HMR disabled) — see RULES.md §22.
- **CSS via `?inline`** — see RULES.md §23.
- **JoystickNav is canonical nav** (pure DOM, NOT three-joystick) — see RULES.md §43.
- **`makeParticles` (THREE.Points) is canonical particle factory** — see RULES.md §40.

## Verification (after every change)

```bash
bun run lint         # ESLint, must pass (0 errors)
bun run type-check   # tsc --noEmit (strict), must pass
bun run build        # tsc && vite build, must pass
```

For runtime check (if dev server running):
```bash
agent-browser open http://127.0.0.1:5173/
agent-browser console  # no errors
agent-browser screenshot /tmp/shot.png
z-ai vision -p "Is 3D content visible?" -i /tmp/shot.png
```

## Stop conditions

- TSL API unclear after checking local types
- Same verify fails after 2 approaches → ask human
- Design decision not in docs → ask human
- New dependency needed → ask human
- Tempted to use `any` outside adapter → STOP, fix types

## Commit format

```
type: short imperative summary

Body: what changed, why, what bug it fixes.
```

## Branch hygiene

- `main` = `test` (always synced)
- Feature branches: `feat/*`, `fix/*`, `docs/*`, `chore/*`
- Delete merged branches after PR merge
- Never force-push to `main` or `test`
