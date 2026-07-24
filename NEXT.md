# Next work

This is the only active backlog. Completed tasks belong in Git history and the
changelog, not here. Move one item to **In progress** before implementation.

## High priority

- [ ] **Studio Console theme cleanup** — continue the UIkit-first pass:
      eliminate remaining `.jlz-*` utility classes that duplicate UIkit,
      keep only 3D-shell hooks and genuinely bespoke components, and verify
      inverse theme through `uk-light`/`uk-dark` on every route.

- [ ] **Shared transition language** — prototype one temporary TSL fullscreen
      transition for SPA routes, Menu and project overlay; use lightweight
      document/CSS handoff for Blog and a loading boundary for Lab. Include
      low-tier and reduced-motion fallbacks before integration.

- [ ] **Cross-backend visual QA matrix** — test representative light/dark
      sections on real WebGPU and WebGL2 hardware, at desktop and mobile DPRs.
      Record concrete parity findings before changing material parameters.

- [ ] **EventBus migration completion** — migrate the 10 remaining local
      `jlz:*` DOM events (`theme-change`, `lang-change`, `sound-toggle`,
      `theme-applied`, `close-nav`, `open-project`, `wobble-pulse`,
      `goto-section-by-hash`, `page-section-change`, `project-navigate`) into
      the typed `AppEvents` interface, or document each as a permanent local
      contract. Remove the `window` bridge in `EventBus.emit()` once all
      consumers use `eventBus.on()`.

## Medium priority

- [ ] **Formatting baseline** — restore a clean repository-wide
      `bun run format:check` in a dedicated mechanical PR.

- [ ] **UIkit delivery audit** — measure actual CSS/JS component use before
      removing Less imports or rebuilding UIkit. Preserve the documented
      import order, dynamic UIkit behavior and accessibility; only then make a
      bounded bundle-reduction change.

- [ ] **Ambient audio design** — only after approved audio assets and an
      explicit user-gesture policy exist. Integrate with the existing sound
      preference and `SfxSystem`; do not restore the removed `AudioSystem` by
      default.

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
- Update [WORKLOG.md](WORKLOG.md) with decisions after completing a task.
