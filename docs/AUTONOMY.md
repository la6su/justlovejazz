# AUTONOMY — LLM Agent Autonomy Guide

## Purpose

Guide for LLM agents performing safe, verified changes on `justlovejazz`. Goal: steady progress toward production readiness, not volume of changes.

## Operating Mode

```
read → decide → edit → verify → commit → continue
```

Never run broad refactors without a failing build, failing type check, clear TODO, or documented plan item.

## Prime Directive

Production quality requires truth before polish. Do not add new visual effects, shaders, sections, or audio until `npm run build` passes.

## Task Priority

1. Build/type errors
2. Broken public API between modules
3. Renderer capability/fallback contract
4. Scroll normalization / world timeline
5. Asset lifecycle and disposal correctness (incl. window listeners — see AGENTS.md Lifecycle Rules)
6. Gallery/detail FSM
7. Camera/world polish
8. Render pipeline
9. UI/accessibility (tokens system + prefers-reduced-motion + ARIA)
10. Performance QA

See `docs/STATUS.md` for what is already done — do not redo completed work.

## Edit Rules

- Preserve current architecture
- Prefer deletion of dead code over hiding it
- Do not disable strict TypeScript
- No `// @ts-ignore` without TODO
- No `any` outside adapter boundaries
- Do not change visuals while fixing build
- Do not reformat unrelated files

## Verify

Smallest useful command:

```bash
npm run build
```

If the same error remains, rethink. Do not repeat similar edits blindly.

## Commit

Good:
```
fix: remove dead imports from bootstrap path
fix: align gallery UI contract with GalleryManager FSM
refactor: isolate renderer capability types
```

Bad: `update`, `fix stuff`, `big changes`

## Stop Conditions

Stop and ask human when:

- A task requires a product/design decision not in docs
- A change would delete or rewrite significant existing work
- A new dependency must be added
- WebGPU/TSL API behavior unclear after checking local types
- Build errors caused by missing design contract, not syntax
- Same verification fails after two different approaches

## Build Stabilization Strategy

1. Remove unused imports and params
2. Fix missing methods or align caller/callee contracts
3. Fix TSL type/API drift
4. Fix renderer typing
5. Fix lifecycle/runtime errors

Do not solve unused errors by changing `tsconfig` unless explicitly asked.

## TSL Fix Strategy

- Inspect current `node_modules/three/src/nodes` and `three/tsl` typings
- Prefer current official API over old examples
- Wrap unstable patterns in small helpers
- Keep helpers in `src/shaders/tsl-utils.ts`
- Avoid large shader rewrites while build is red
- The `tsl-utils.ts` header documents the exact three 0.184 API surface
  used — verify against it on three upgrades
- `three/addons/tsl/display/BloomNode.js` is the production bloom node
  (mip-chain) — use it, do not reimplement bloom
- `tex.sampleLevel(uv, level)` no longer exists in three 0.184 — use
  `tex.level(levelNode)` instead (documented in tsl-utils.ts header)

## Lifecycle Fix Strategy

- Any `window.addEventListener` MUST use a bound handler ref (not anonymous
  arrow) so `removeEventListener` works
- Every module owning a listener MUST expose `destroy()` or `dispose()`
- `Experience.destroy()` MUST call all owned module destroy/dispose methods
- Vite HMR triggers destroy on module replacement — leaks surface fast in dev

## Styling Strategy

- All visual styling goes in `src/styles/tokens.css` as `--jlz-*` custom
  properties or component classes
- No hardcoded colors/sizes/durations in TS — use tokens
- Inline `style=` only for dynamic values (per-frame transform, per-project
  accent)
- UIkit theming via `@jlz-*` Less vars in `src/styles/tokens.less`

## Gallery Strategy

Gallery FSM: `list → opening → detail → closing → list`

- Store selected project once
- Preserve start transform for transitions
- Ignore duplicate clicks during transitions
- Support Escape/back + same-state sync between DOM and WebGL
