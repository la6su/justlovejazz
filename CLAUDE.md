# CLAUDE.md

This file is read by Claude Code agents. The project's full agent operating
procedure lives in [AGENTS.md](AGENTS.md) — this file only adds Claude
Code-specific notes and does not duplicate the core procedure.

## Read AGENTS.md first

[AGENTS.md](AGENTS.md) is the single source of truth for all AI coding agents.
It covers: reading order, hard constraints, session workflow, verification
gate, git/publishing, and documentation policy. Start there before any task.

## Claude Code specifics

- Use `rg` (ripgrep) for code search — it is installed and faster than grep.
- Prefer the `Edit` / `MultiEdit` tools over `Write` for existing files to
  preserve unrelated content.
- After edits, run the verification gate from [AGENTS.md](AGENTS.md):
  `bun run type-check && bun run lint && bun run test:unit`.
- For visual verification, start `bun run dev` (port 5173) or
  `bun run build && bun run preview` (port 4173) and use a headless browser.
- The project is a Vite SPA (not Next.js) — there is no `/pages` or `/app`
  directory; routing is in `src/router.ts`.
- Three.js uses TSL NodeMaterials — do not introduce raw `ShaderMaterial`.
- UIkit 3 is the component framework — see [docs/UIKIT3.md](docs/UIKIT3.md)
  for the solution priority order before writing custom CSS.

## Common tasks

| Task          | Start here                                                                        |
| ------------- | --------------------------------------------------------------------------------- |
| Fix a bug     | Reproduce → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) → source → fix → verify  |
| Add a feature | [NEXT.md](NEXT.md) → [docs/RULES.md](docs/RULES.md) → implement → verify          |
| Update docs   | [docs/README.md](docs/README.md) ownership map → update only the owner            |
| UI change     | [docs/UIKIT3.md](docs/UIKIT3.md) → use UIKit component first → verify both themes |
