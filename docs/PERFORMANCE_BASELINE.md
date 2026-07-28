# Performance baseline

This baseline separates reproducible delivery budgets from hardware-dependent
runtime measurements. Run `bun run build && bun run budget:build` after entry
graph, Three.js or media changes.

## Static delivery

Measured from the written production assets on 2026-07-28 with gzip level 6:

| Path                    | Baseline       | Budget        | CI gate |
| ----------------------- | -------------- | ------------- | ------- |
| Splash startup scripts  | 2.68 kB gzip   | ≤ 5.00 kB     | yes     |
| Shared Three.js chunk   | 337.34 kB gzip | ≤ 350.00 kB   | yes     |
| Contact loader chunk    | 15.44 kB gzip  | route-owned   | no      |
| `public/assets` media   | 19.70 MB total | informational | no      |
| Placeholder video alone | 16.35 MB       | replace       | no      |

Splash startup includes the built shell entry, its static JavaScript
modulepreloads and executable inline splash code. The Contact-only GLTF/DRACO
implementations are isolated from the shared Three.js delivery and fetched
with that route. The shared chunk has about 12.7 kB of gzip headroom, so changes
to its import graph still require production-build inspection. Media remains
informational until approved replacements define a delivery budget; the gate
reports its total and largest file without normalising the current placeholder
as an acceptable limit.

## Runtime matrix

Frame-time evidence must come from real hardware rather than headless CI.
Record p50/p95 frame time and idle render activity for `/`, `/works` and
`/contact` using:

- WebGPU and forced `?renderer=webgl`;
- desktop and narrow mobile DPR;
- normal and reduced motion.

The current targets remain p95 ≤ 16.7 ms on tested desktop hardware and p95 ≤
33.3 ms on tested mobile hardware. Record the device, browser, backend and DPR
with every result so later comparisons remain meaningful. In development, open
the `JLZ · dev` panel after entering the experience; `p50 ms` and `p95 ms`
retain the latest bounded render burst while `fps: 0` and `rendering: false`
confirm that demand-driven idle has settled.

### Local desktop reference

First-pass measurements on 2026-07-28 used the Codex in-app browser on the
local macOS host at a 1280×720 canvas and DPR 1. The browser reported a real,
non-fallback `WebGPUBackend`; its adapter model was unavailable. Values are a
directional reference from one bounded sample window, not a cross-device
acceptance result:

| Backend | State             | p50     | p95     | Settled state              |
| ------- | ----------------- | ------- | ------- | -------------------------- |
| WebGPU  | Intro entry       | 9.7 ms  | 13.9 ms | 0 fps, `rendering: false`  |
| WebGPU  | Intro → Works     | 10.2 ms | 13.2 ms | active Works render reason |
| WebGL2  | Intro entry       | 6.9 ms  | 7.6 ms  | 0 fps, `rendering: false`  |
| WebGL2  | Intro → Works     | 7.0 ms  | 9.1 ms  | active Works render reason |
| WebGPU  | Direct `/works`   | 8.4 ms  | 9.8 ms  | route remains active       |
| WebGL2  | Direct `/works`   | 6.9 ms  | 7.6 ms  | route remains active       |
| WebGPU  | Direct `/contact` | 8.1 ms  | 9.5 ms  | route remains active       |
| WebGL2  | Direct `/contact` | 7.0 ms  | 7.5 ms  | route remains active       |

Both backends passed the desktop p95 target in this reference run. Production
direct-entry QA for `/works` and `/contact` also passed on desktop and at a
390×844 narrow viewport without browser errors. That viewport remains a layout
check on the desktop host (DPR 1), not mobile-hardware evidence. Complete the
matrix with real mobile DPR measurements before treating runtime performance as
fully baselined.
