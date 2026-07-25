# Development and verification

## Local macOS setup

```bash
bun install
bunx playwright install chromium
```

## Pi Agent

The repository-root `AGENTS.md` is Pi's project instruction file as well as
the source for other coding agents. Start Pi from the repository root, then
use `/reload` whenever `AGENTS.md` changes. Keep task-specific plans in
`docs/PLAN-*.md`; do not add a parallel `.pi/SYSTEM.md`, because it would
replace Pi's default system prompt and duplicate repository policy.

The Playwright command is a one-time download for the browser binary used by
the repository's E2E project. Re-run it after a Playwright upgrade when the
runner asks for a new browser revision.

## Run locally

```bash
bun run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The
inline splash must appear before Three.js finishes loading. Enter remains
disabled until `jlz:webgl-ready`; a slow device is not a reason to bypass that
contract.

For a representative manual check, verify:

1. The splash reaches the ready state and Enter opens the scene.
2. Trackpad/mouse wheel and a real touch device move the vertical story
   natively; scroll snap settles each frame.
3. The storyline and up/down keyboard controls reach all four story frames.
4. Menu opens as a full-screen desktop composition and compact mobile top
   sheet; Contact opens from below and its Telegram link is keyboard reachable.
5. A menu subsection preserves its `#section-*` target after route navigation.
6. `/services` followed by a return to `/` leaves the home Works carousel usable.
7. Auto and inverse theme modes both keep text, fluid surfaces and 3D line
   readable; reduced motion removes smooth travel without blocking navigation.

## Change cycle

Use one lightweight loop for product and technical work:

1. **Plan** — choose one open outcome from `NEXT.md`, define its user-visible
   result, constraints and proportional verification. Create a dedicated
   `docs/PLAN-*.md` only when the change genuinely spans multiple independent
   phases or decisions.
2. **Build** — implement one vertical slice from interaction through UI and 3D
   state. Reuse current owners and UIkit behavior before adding abstractions.
3. **Verify** — run focused tests while iterating, then the required gate.
   Visually inspect representative desktop/mobile sizes, both theme polarities,
   keyboard behavior and reduced motion. Check WebGPU/WebGL2 when rendering
   behavior changes.
4. **Polish** — remove superseded code, stale copy and duplicate state; inspect
   console output, layout edges, resource disposal, build output and the
   relevant performance budget. Re-run affected checks after cleanup.
5. **Record** — remove completed work from `NEXT.md`, write the durable decision
   in `WORKLOG.md`, and add a concise release note only for a user-visible or
   operational change.

Stop when the acceptance criteria and budgets are met. Optional abstraction,
configuration and animation that do not improve the current outcome stay out
of the slice.

To inspect the WebGL2 fallback on a development server, open
`http://127.0.0.1:5173/?renderer=webgl`. This switch is development-only and
exists for parity QA; do not add it to user-facing links.

## Required checks

Run the complete local gate before a pull request:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:unit
bun run test
```

`bun run test` builds the application and starts a preview server itself. It
uses Playwright Chromium; no separate development server is required.

## Performance budgets

Inspect the production build whenever changing entry points, imports or render
startup. These budgets protect first paint rather than trying to make Three.js
artificially small:

| Metric                                     | Budget                                                  | Current baseline                       |
| ------------------------------------------ | ------------------------------------------------------- | -------------------------------------- |
| Splash startup graph                       | ≤ 5 KB gzip of JS and no Three/UIkit/World preload      | 1.9 KB gzip (`index` + runtime helper) |
| Three delivery                             | ≤ 350 KB gzip and loaded only by the lazy app bootstrap | 333 KB gzip                            |
| Idle frame time on tested desktop hardware | p95 ≤ 16.7 ms                                           | Record during real-device QA           |
| Idle frame time on tested mobile hardware  | p95 ≤ 33.3 ms                                           | Record during real-device QA           |

The bundle-size warning for `vendor-three` is expected while it stays inside
this budget. Do not silence it by raising `chunkSizeWarningLimit`; inspect the
entry graph first. The cross-backend QA task owns hardware frame-time evidence.

For every new persistent visual layer, also verify that it uses the existing
animation loop, respects reduced motion, does not allocate per frame, releases
GPU resources with its owner and does not create a second background or
post-processing authority.

## CI

The GitHub Actions workflow (`.github/workflows/lighthouse.yml`) runs on every
push and pull request to `main`:

- `bun run type-check`
- `bun run lint`
- `bun run test:unit`
- `bun run build`
- `bun run test` (Playwright Chromium E2E)
- Lighthouse CI (against the preview build)

All checks must pass before merge. The workflow cancels in-progress runs on the
same ref when a new commit is pushed.

## Codex sandbox appendix

The desktop/Codex browser may use a different network namespace from the shell.
Treat its connection details as environment-specific: start the server and
browser verification within the mechanism provided by that environment, use
the reachable host it exposes, and do not commit temporary `allowedHosts`
changes. Prefer DOM/state assertions for the WebGL canvas when screenshots are
unreliable.
