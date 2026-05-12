# AGENTS.md

## Purpose

This file is the shared instruction layer for any LLM agent working on this repository:

- Codex;
- Hermes 4 via llama.cpp;
- local IDE agents;
- future automation agents.

Instructions must stay cross-platform and model-agnostic. Do not add rules that only one agent runtime can understand.

## Language

- User-facing responses: Russian.
- Code, identifiers, file names, commit messages: English.
- Technical comments: English, short, only when useful.
- Plans and documentation may be Russian unless the file is explicitly English.

## Project Goal

Bring `justlovejazz` to a production-level interactive studio portfolio inspired by `next.junni.co.jp`, using this project stack:

- Vite;
- TypeScript strict;
- Three.js;
- Three.js TSL / Nodes;
- WebGPU primary;
- explicit WebGL/fallback policy;
- UIkit 3 + Less;
- Lenis.

Do not copy Junni assets, text, models, SVGs, or content. Port patterns, not copyrighted content.

## Main References

Read these files before large changes:

1. `README.md`
2. `docs/CONCEPT.md`
3. `docs/SPEC.md`
4. `docs/ROADMAP.md`
5. `docs/AUTONOMY.md`
6. `docs/ARCHITECTURE.md`
7. `docs/LAZY_LOADING.md`

NOTE: The original Junni site archive was purged. Use `docs/CONCEPT.md` for reference patterns.

## Current Priority

Do not start visual polish before the build is stable.

Immediate order:

1. Fix TypeScript build errors.
2. Add/keep a separate type-check command.
3. Define renderer capabilities and fallback behavior.
4. Normalize scroll progress and world timeline.
5. Fix asset lifecycle and remove random texture disposal.
6. Then work on post-processing, bloom, polish, mobile QA.

For autonomous local LLM work, follow `docs/AUTONOMY.md`.

## Engineering Rules

- Keep changes small and scoped.
- Prefer existing architecture over new abstractions.
- Do not disable strict TypeScript checks to hide errors.
- Do not add dependencies without a clear reason.
- Do not add global mutable state unless it is already part of a local pattern and justified.
- Avoid `any`; if needed, isolate it behind a typed adapter.
- Do not create objects, vectors, materials, or geometries inside hot loops without a reason.
- Dispose textures, geometries, materials, event listeners, and render targets explicitly.
- Do not remove user changes or unrelated files.

## Three.js / TSL Rules

- WebGPU is the primary rendering path.
- WebGL support must be explicit: implemented fallback or clear unsupported state.
- Keep WebGPU-specific APIs isolated.
- Use TSL method chaining where possible: `.add()`, `.mul()`, `.sub()`.
- Keep shader helpers in `src/shaders/tsl-utils.ts`.
- Expensive shader features need quality-tier control.
- Do not mix GLSL string shaders and TSL in the same material without an adapter.
- Treat current post-processing as temporary until a real pipeline exists.

## UX / Motion Rules

- Motion must be state-driven and delta-time aware.
- Avoid linear visual movement.
- Camera should have clear base transform and final transform.
- Mobile must use reduced movement, not a scaled desktop feel.
- Support `prefers-reduced-motion`.
- DOM and WebGL must use the same application state.
- No hover-only critical interactions.

## Asset Rules

- Use an asset manifest for new asset loading.
- Prefer KTX2/Basis for GPU textures.
- Prefer AVIF/WebP for UI/content images.
- Do not dispose assets randomly.
- Dispose only inactive contexts and only after references are released.
- Keep first-frame critical assets small.

## Cross-Platform Command Rules

Prefer npm scripts over shell-specific commands:

```bash
npm run build
npm run dev
npm run preview
```

Avoid instructions that require only one shell:

- no Bash-only process substitution;
- no shell-specific glob assumptions;
- no OS-specific absolute paths in docs;
- no commands that only work on macOS/Linux/Windows unless clearly labelled.

When adding scripts to `package.json`, make them work on macOS, Linux, and Windows.

## File Editing Rules

- Use UTF-8.
- Preserve existing file style.
- Use LF line endings for repository files.
- Do not reformat unrelated files.
- Do not commit generated folders such as `dist`.
- Do not commit `.DS_Store`, logs, local caches, or machine-specific files.

## Verification

For code changes, run the smallest relevant verification first.

Baseline gates:

```bash
npm run build
```

When available:

```bash
npm run type-check
npm run lint
```

If verification cannot be run, state why and list the expected risk.

## Git Rules

- Keep commits focused.
- Commit documentation separately from code when practical.
- Do not revert unrelated user changes.
- Do not stage unrelated dirty files.
- Commit message format:

```text
type: short imperative summary
```

Examples:

```text
docs: add cross-platform agent instructions
fix: stabilize renderer capability detection
refactor: isolate gallery detail state
```

## Output Style For Agents

When responding to the user:

- answer in Russian;
- be concise;
- say what changed;
- say what was verified;
- mention blockers directly;
- avoid long theoretical explanations unless requested.

## Production Bar

A feature is not production-ready until:

- build passes;
- behavior is tested on desktop and mobile;
- fallback behavior is defined;
- memory lifecycle is clear;
- accessibility baseline is respected;
- documentation matches implementation.
