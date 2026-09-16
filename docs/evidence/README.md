# Evidence

Reports are dated observations, not agent instructions or current PASS claims.
Preserve existing JSON, metadata and captures; do not rewrite results during
source or documentation cleanup.

| Artifact directory          | Producer / use                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| `phase7-live-gate/`         | `bun scripts/phase7-live-gate.ts`: representative renderer checks              |
| `phase10-route-cycle-soak/` | `bun scripts/phase10-route-cycle-soak.ts`: route resources and runtime destroy |
| `visual-parity/`            | `bun scripts/visual-parity.ts`: CDP captures and pixel comparisons             |
| `bundle-breakdown/`         | `bun scripts/bundle-breakdown.ts`: mapped Three source-module bytes            |
| `mobile-resize-gate/`       | Historical physical mobile resize/DPR captures                                 |
| `shared-transition-qa/`     | Historical transition matrix                                                   |

The live/soak tools default to a dev server at `http://127.0.0.1:5173`;
`JLZ_DEV_BASE` overrides it. Live gate supports `JLZ_CDP_URL` or
`JLZ_HARDWARE_CHROME=1`. Inspect each script's options for the selected run.
The dev-only forced-backend query cannot force production preview.

New evidence must identify UTC time, revision/dirty state, command, browser,
device, backend, viewport/DPR, failures and skips. Verify the report actually
contains those fields; gaps in existing scripts are tracked in [NEXT](../../NEXT.md).
Name missing metrics as unavailable. Runtime destroy is not full Vue unmount.

Keep comparable
numbers in the report and link it from review notes rather than copying tables
into documentation. The bundle tool uses a commit-based filename and overwrites
on repeat: preserve an existing report before rerunning that revision. Its mapped
source bytes do not replace the gzip budget check.

## Measurement protocol

Record revision/dirty state, build hash, command, browser, device/GPU, actual
backend, adapter classification, viewport/DPR, power and motion preference.
Warm shaders/caches for one unmeasured route cycle, then collect at least three
equal active-burst windows per route/backend; report each run and worst p95.
Measure settled idle with frame deltas, loop ticks and demand reasons separately
from intentional continuous effects. CPU timing is not GPU timing.

Capture after splash Enter at matching route/story state, viewport, locale,
theme and motion. Outside approved grain/cursor/video masks, at most 0.5% of
pixels may exceed a 0.1 perceptual threshold. Keep diff/masks/metadata together;
judge intentional redesigns against their task, not an obsolete screenshot.
WebGL direct rendering does not promise WebGPU post-processing parity.

Check warmed resource trends, declared cache caps, runtime destroy and Vue root
unmount separately. Missing counters and flat heap readings prove no leak result.

## Historical limits

The [2026-09-07 WebGL soak](phase10-route-cycle-soak/2026-09-07T21-34-23-617Z-report.json)
measured 20 steady route visits, not 20 six-route rounds. Its destroy summary
retained a canvas, program counts were unavailable and heap readings were flat.
The [physical post review](phase7-live-gate/2026-09-07-visual-post-review.md)
is representative dated evidence. Neither certifies the current checkout;
physical WebGL device-loss restoration remains deferred in NEXT.
