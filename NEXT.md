# Next work

This is the only active backlog. Completed tasks belong in Git history and the
changelog, not here. Move one item to **In progress** before implementation.

## In progress

_(none)_

## High priority

- [ ] **Render performance budget and code-splitting** — profile the current
      production bundle, remove ineffective dynamic imports, and define measurable
      budgets for Three.js delivery, initial JavaScript and GPU frame time. Preserve
      the non-blocking splash contract while changing chunks. The current build
      reports an ineffective Works-scene dynamic import and a 1.23 MB minified
      `vendor-three` chunk.

- [ ] **Cross-backend visual QA matrix** — test representative light/dark
      sections on real WebGPU and WebGL2 hardware, at desktop and mobile DPRs.
      Record concrete parity findings before changing material parameters.

- [ ] **Works 3D/showreel evolution** — complete the remaining, intentionally
      scoped work in [docs/PLAN-showreel-shader-plane.md](docs/PLAN-showreel-shader-plane.md).

## Medium priority

- [ ] **CI unit-test gate** — add `bun run test:unit` to GitHub Actions so the
      required local suite and CI suite match.

- [ ] **Formatting baseline** — restore a clean repository-wide
      `bun run format:check` in a dedicated mechanical PR. The current check
      reports 63 files, including files outside this documentation change.

- [ ] **Ambient audio design** — only after approved audio assets and an
      explicit user-gesture policy exist. Integrate with the existing sound
      preference and `SfxSystem`; do not restore the removed `AudioSystem` by
      default.

## Backlog rules

- Keep entries actionable, uncompleted and short.
- Put a detailed multi-phase design in one linked plan, not in this file.
- Update `WORKLOG.md` with decisions after completing a task.
