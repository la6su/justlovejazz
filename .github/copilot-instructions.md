# GitHub Copilot instructions

This file is read by GitHub Copilot agents. The project's full agent operating
procedure lives in [AGENTS.md](../../AGENTS.md) — this file only adds
Copilot-specific notes and does not duplicate the core procedure.

## Read AGENTS.md first

[AGENTS.md](../../AGENTS.md) is the single source of truth for all AI coding
agents. It covers: reading order, hard constraints, session workflow,
verification gate, git/publishing, and documentation policy. Start there
before any task.

## Copilot specifics

- The project uses **Bun** as the package manager and runtime. Use
  `bun install`, `bun run <script>` — never `npm` or `yarn`.
- **Vite SPA** (not Next.js). Entry: `index.html` → `src/entry-shell.ts` →
  `src/entry-app.ts` → `src/Experience/Experience.ts`. Routing: `src/router.ts`.
- **Three.js TSL** — use `MeshBasicNodeMaterial` / `MeshPhysicalNodeMaterial`
  from `three/webgpu` and TSL functions from `three/tsl`. Never raw
  `ShaderMaterial`.
- **UIkit 3** is the component framework. Before writing custom CSS, check
  [docs/UIKIT3.md](../../docs/UIKIT3.md) for the solution priority order.
- **TypeScript strict mode** with `noUncheckedIndexedAccess` — always handle
  `undefined` from array access.
- **Verification gate**: `bun run type-check && bun run lint && bun run test:unit && bun run build`.
- **Commit style**: Conventional Commits — `feat:`, `fix:`, `refactor:`,
  `docs:`, `test:`, `chore:`, `perf:`.
- Do not push to `main`. Create a `codex/<topic>` branch and open a PR.
