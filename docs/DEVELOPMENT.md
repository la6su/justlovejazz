# Development and verification

## Local setup

```bash
bun install
bunx playwright install chromium
bun run dev
```

Vite prints the local address. Playwright installs its managed Chromium once
and requests a new revision after relevant upgrades.

Use `?renderer=webgl` on the development URL to inspect the WebGL2 fallback.

## Checks

Use focused checks while iterating. The complete release gate is:

```bash
bun run format:check
bun run lint
bun run type-check
bun run build
bun run test:unit
bun run test
```

The Playwright command builds and serves the application. CI configuration in
`.github/workflows/lighthouse.yml` is the source for hosted checks and
Lighthouse behavior.

For interface work, load
[the project UI skill](../skills/justlovejazz-ui/SKILL.md) for the
route/theme/input matrix instead of carrying that matrix in every task.

## Performance budgets

These budgets protect startup and interaction:

| Metric                                     | Budget                                          |
| ------------------------------------------ | ----------------------------------------------- |
| Splash startup JavaScript                  | ≤ 5 KB gzip; excludes Three.js, UIkit and World |
| Lazy Three.js delivery                     | ≤ 350 KB gzip                                   |
| Idle frame time on tested desktop hardware | p95 ≤ 16.7 ms                                   |
| Idle frame time on tested mobile hardware  | p95 ≤ 33.3 ms                                   |

Changes to entry points, imports or render startup include a production-build
inspection. Persistent visual layers share the existing loop, avoid per-frame
allocation and release their resources with their owner.
