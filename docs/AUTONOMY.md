# HERMES_AUTONOMY.md

## Purpose

This file guides Hermes Agent running a local LLM through llama.cpp for long autonomous work on `justlovejazz`.

The goal is not to generate many changes. The goal is to safely and steadily move the project toward a production-level interactive web-design studio experience inspired by `junni.co`.

Use this file together with:

- `AGENTS.md`
- `ROADMAP.md`
- `ROADMAP.md`
- `SPEC.md`
- `threejs_tsl_full_SPEC.md`

## Operating Mode

Hermes should work in small verified loops:

```text
read -> decide -> edit -> verify -> record -> continue
```

Never run broad refactors without a nearby failing build, failing type check, clear TODO, or documented plan item.

## Prime Directive

Production quality requires truth before polish.

Do not start:

- bloom upgrades;
- new visual effects;
- extra sections;
- complex intro sequences;
- audio;
- shader experiments;

until `npm run build` passes.

## Autonomous Loop

### 1. Read Context

Before each work block, inspect:

```bash
git status --short
npm run build
```

If build fails, fix the earliest high-signal blocker first.

### 2. Pick One Task

Choose exactly one task from this priority order:

1. Build/type errors.
2. Broken public API between modules.
3. Renderer capability/fallback contract.
4. Scroll normalization/world timeline.
5. Asset lifecycle and random disposal.
6. Gallery/detail FSM.
7. Camera/world polish.
8. Render pipeline.
9. UI/accessibility.
10. Performance QA.

### 3. Define Done

Before editing, write a short internal target:

```text
Task: fix unused imports in Bootstrapper and main entry.
Done: npm run build progresses past these files.
Scope: src/core/Bootstrapper.ts, src/main.ts only.
```

Keep scope tight.

### 4. Edit

Rules:

- Preserve current architecture.
- Prefer deletion of dead code over hiding it.
- Do not disable strict TypeScript.
- Do not add `// @ts-ignore` unless there is no practical alternative and a TODO explains why.
- Do not use `any` outside a local adapter boundary.
- Do not change visuals while fixing build.
- Do not reformat unrelated files.

### 5. Verify

Run the smallest useful command.

For build work:

```bash
npm run build
```

If the same error remains, rethink. Do not repeat similar edits blindly.

### 6. Record

After a useful verified change, append a short note to `WORKLOG.md`.

Format:

```md
## YYYY-MM-DD

- Fixed: short description.
- Files: `path`, `path`.
- Verified: `npm run build` now reaches/fails at ...
- Next: exact next task.
```

If `WORKLOG.md` does not exist, create it.

### 7. Commit

Commit only focused, verified changes.

Good:

```text
fix: remove dead imports from bootstrap path
fix: align gallery UI contract
refactor: isolate renderer capability types
docs: record autonomous work protocol
```

Bad:

```text
update
fix stuff
big changes
```

## Stop Conditions

Stop and ask the user or Codex for help when:

- a task requires product/design decision not in docs;
- a change would delete or rewrite large user work;
- a dependency must be added;
- WebGPU/TSL API behavior is unclear after checking local types;
- build errors are caused by a missing design contract, not syntax;
- the same verification fails after two different approaches.

## Build Stabilization Strategy

Use this order:

1. Remove unused imports and params.
2. Fix missing methods or align caller/callee contracts.
3. Fix TSL type/API drift.
4. Fix renderer typing.
5. Fix lifecycle/runtime errors.

Do not solve unused errors by changing `tsconfig` unless explicitly asked.

## TSL Fix Strategy

When TSL types fail:

- inspect current `node_modules/three/src/nodes` and `node_modules/three/tsl` typings;
- prefer current official API over old examples;
- wrap unstable patterns in small helpers;
- keep helpers in `src/shaders/tsl-utils.ts`;
- avoid large shader rewrites while build is red.

## Renderer Strategy

Renderer work must produce explicit capability state:

```ts
type RendererMode = 'webgpu' | 'webgl' | 'unsupported'
type QualityTier = 'high' | 'medium' | 'low'
```

Do not claim WebGL fallback exists until it runs or a clear unsupported path exists.

## Gallery Strategy

Gallery work must converge to a finite state machine:

```text
list -> opening -> detail -> closing -> list
```

Rules:

- store selected project once;
- preserve start transform for transitions;
- ignore duplicate clicks during transitions;
- support Escape/back;
- sync DOM and WebGL from the same state.

## Asset Strategy

Never dispose textures randomly.

Target lifecycle:

```text
preload -> activateContext -> use -> deactivateContext -> disposeContext
```

Before deleting or purging an asset, prove it is not referenced by active material or scene state.

## Quality Gates

A task is not done because code changed. It is done when a gate passes.

Minimum gates:

- build fixes: `npm run build`;
- renderer changes: canvas starts and mode is known;
- gallery changes: list/detail/back works;
- asset changes: repeated transitions do not lose textures;
- UI changes: keyboard and mobile behavior still work.

## Communication With Codex

If Hermes gets stuck, produce a compact handoff:

```md
## Hermes Handoff

Task:
Files changed:
Verification:
Current failure:
What I tried:
Suspected cause:
Next recommended step:
```

This lets Codex continue without redoing exploration.

## Continuous Work Rule

Hermes may continue autonomously only while it can:

- choose a task from documented priority;
- keep scope small;
- verify the result;
- avoid unrelated user changes;
- record progress.

If any of these are false, stop.
