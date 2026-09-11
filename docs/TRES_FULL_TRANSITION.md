# Vue/Tres transition — completion record

Source audit: 2026-09-08; per-owner and teardown evidence closed 2026-09-11.
This is a frozen ownership/evidence summary, not an active status page: the
transition is complete and the hybrid experiment path is stopped with its
continue-conditions recorded in the archive. [NEXT.md](../NEXT.md) is the task
queue. The foundational Phase 5–10 migration is recorded in
[the archive](archive/MIGRATION_VUE_TRES.md).

## Ownership

| Area                                                 | Actual boundary                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SceneHost                                            | Persistent TresCanvas, scene, physical camera and initial renderer surface                                                                             |
| Renderer / unifiedRenderer                           | Renderer lifecycle, recovery and post rendering / construction and init helpers                                                                        |
| RenderScheduler                                      | Sole application render-loop driver; Tres internal loop stopped                                                                                        |
| Camera, lights, ground, section roots                | Declarative nodes adopted by imperative controllers                                                                                                    |
| WorksInstallation                                    | Tres assembly/geometry; controller owns shared NodeMaterials and authored state                                                                        |
| WorksPlaneStage                                      | Lazy primitive attachment; cards, textures and controller remain imperative                                                                            |
| Services                                             | Primitive attachment; geometry is declared in the Tres template (ServicesStageGeometry.vue); onMounted only adopts refs and applies runtime transforms |
| EnvSphere / EnvSky                                   | Primitive pavilion owner; sky leaf declared separately and borrows palette material                                                                    |
| ContactHalo / ManifestoInk                           | Async host primitive attachment; TSL construction and disposal remain in classes                                                                       |
| ContactCyprus, CasePlane, BakuCarousel               | Existing asset/input/material owners retained; the per-owner audit closed 2026-09-11 (NEXT.md)                                                         |
| SplashCube, ParticleBurst, DrawTrail, JunniParticles | Existing deformation/instance owners retained; not proof that declarative leaves are impossible                                                        |

Do not infer that all geometry is declarative because it resides in a .vue file.
Do not dispose borrowed materials from both Vue and their controller.
Renderer/backend policy, typed eventBus/routePage, reduced-motion settlement
and one loop remain invariants.

## Evidence and its limits

- Full unit suite after the menu slice: 114 files / 705 tests. TypeScript and
  Vue checks passed in the recorded session.
- LazyStage now checks request and identity after an awaited attachment, before
  starting `load()`. Its focused lifecycle regression and both type checks pass.
- Build and bundle budget checks passed after the menu slice. Prerender printed
  sandbox WebSocket EPERM messages; build completed. Vite also warned about the
  large Three chunk. Neither warning is evidence of browser parity.
- The serial browser suite passed after the menu slice with 24 scenarios in one
  worker. Context-loss recovery still requires its result to be identified
  separately; Playwright uses its configured build/server.
- [WebGLBackend soak report](evidence/phase10-route-cycle-soak/2026-09-07T21-34-23-617Z-report.json):
  20 steady route cycles across six routes (not 20 complete six-route rounds),
  resource caps stable, no fatal errors according to its filter. Renderer
  programs unavailable; heap readings constant and not reliable leak evidence.
- The soak destroy summary retains a canvas. It verifies its implemented
  runtime-destroy checks, not complete Vue unmount or all GPU resources returning
  to baseline. Loop inactivity is a useful proxy; strengthen idle-frame evidence.
- User reported physical Contact/Manifesto checks successful. This is manual
  smoke evidence, not an automated report. Earlier Contact visual complaint was
  not independently reproduced.
- The runtime-destroy ownership boundary is unit-pinned
  (Experience.destroyOwnership.test.ts, 2026-09-11): Experience-owned owners
  release exactly once, Vue-owned EnvSphere/ServicesStage survive until the
  host's Vue unmount, the PMREM environment releases with its reference
  cleared, repeated destroy is idempotent and Renderer.dispose stays
  exactly-once across teardown orders. The provably dead SceneCoordinator →
  ServicesStage terminal dispose was removed the same day, with the ownership
  docs aligned to the single terminal owner (ServicesStageOwner.vue).
- Contact was re-verified in a browser on the WebGLBackend path (2026-09-11,
  dev server: deep-link /contact then splash Enter). Cyprus, the typography
  glyph and the four story cards rendered with a clean console. Sandbox
  evidence, not physical WebGPU parity.
- Physical WebGL device-loss restoration remains deferred. Earlier dated
  reports in evidence/ describe their own revisions only.

## Next verification

NEXT.md item 1 is next: generalize the Showreel shader theater transition for
Works case media — design the still-image media contract and the metadata
handoff before touching code. Use the release commands in DEVELOPMENT.md
after relevant code changes. Record exact SHA, backend, viewport, motion
policy, failures/skips and report paths. Add no PASS solely from class names,
source searches or unit tests for visual behavior.
