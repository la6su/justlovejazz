# Development and verification

## Local macOS setup

```bash
bun install
bunx playwright install chromium
```

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
2. Arrow keys and the joystick navigate the four main sections plus Lab/Menu.
3. A menu subsection preserves its `#section-*` target after route navigation.
4. `/services` followed by a return to `/` leaves the home Works carousel usable.
5. Auto and inverse theme modes both keep text and background readable.

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

## CI

The GitHub Actions workflow currently runs type-checking, linting, production
build, Playwright Chromium tests and Lighthouse. Run unit tests locally as part
of the required gate until they are explicitly added to CI.

## Codex sandbox appendix

The desktop/Codex browser may use a different network namespace from the shell.
Treat its connection details as environment-specific: start the server and
browser verification within the mechanism provided by that environment, use
the reachable host it exposes, and do not commit temporary `allowedHosts`
changes. Prefer DOM/state assertions for the WebGL canvas when screenshots are
unreliable.
