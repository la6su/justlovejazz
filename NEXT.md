# Next work

This is the only active backlog. Completed tasks belong in Git history and the
changelog, not here. Move one item to **In progress** before implementation.

## High priority

- [ ] **Works 3D/showreel evolution** — continue the accepted editorial Works
      foundation with the bounded 3D prototype and real video decisions in
      [`docs/PLAN-showreel-shader-plane.md`](docs/PLAN-showreel-shader-plane.md).

- [ ] **Shared transition language** — prototype one temporary TSL fullscreen
      transition for SPA routes, Menu and project overlay; use lightweight
      document/CSS handoff for Blog and a loading boundary for Lab. Include
      low-tier and reduced-motion fallbacks before integration.

- [ ] **Cross-backend visual QA matrix** — test representative light/dark
      sections on real WebGPU and WebGL2 hardware, at desktop and mobile DPRs.
      Record concrete parity findings before changing material parameters.

## Medium priority

- [ ] **Formatting baseline** — restore a clean repository-wide
      `bun run format:check` in a dedicated mechanical PR. The current check
      reports 32 files, including files outside this feature change.

- [ ] **UIkit delivery audit** — measure actual CSS/JS component use before
      removing Less imports or rebuilding UIkit. Preserve the documented
      import order, dynamic UIkit behavior and accessibility; only then make a
      bounded bundle-reduction change.

- [ ] **Ambient audio design** — only after approved audio assets and an
      explicit user-gesture policy exist. Integrate with the existing sound
      preference and `SfxSystem`; do not restore the removed `AudioSystem` by
      default.

- [ ] **Telegram design-system extension** — deferred until its copy and
      product scope are rewritten; keep the current Contact CTA unchanged.

- [ ] **Portfolio-wide editorial system** — replace placeholder copy and
      repeated brochure layouts route by route with the capability → problem →
      response → proof rhythm; bring the standalone Blog into the same visual
      and typographic system.

- [ ] **Lazy Lab experiment runtime** — define the experiment manifest and a
      per-scene dynamic-import boundary so `/lab` stays a lightweight catalogue
      and opened 3D experiments do not inflate the shared startup bundle.

## Backlog rules

- Keep entries actionable, uncompleted and short.
- Put a detailed multi-phase design in one linked plan, not in this file.
- Move only one scoped outcome into implementation at a time; define its
  visible acceptance criteria and proportional checks before editing.
- Update `WORKLOG.md` with decisions after completing a task.
