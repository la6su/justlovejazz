# AUTONOMY — LLM Agent Protocol

## Loop

```
read → decide → edit → verify(npm run build) → commit → continue
```

No broad refactors without failing build, TODO, or documented plan.

## Priority

1. Build/type errors → 2. Public API breaks → 3. Renderer contract → 4. Scroll/timeline → 5. Lifecycle/disposal → 6. Gallery FSM → 7. Camera → 8. Pipeline → 9. A11y → 10. Perf

See `docs/STATUS.md` for what's done — don't redo.

## Edit rules

- Delete dead code over hiding it. No `@ts-ignore` without TODO.
- Don't change visuals while fixing build. Don't reformat unrelated files.
- TSL: inspect `node_modules/three/src/nodes` first. Wrap unstable patterns in helpers.
- Lifecycle: bound handler refs, `destroy()` on every listener owner.
- Styling: tokens only. No hardcoded values.

## Stop conditions

- TSL API unclear after checking local types
- Same verify fails after 2 approaches
- Design decision not in docs
- New dependency needed
