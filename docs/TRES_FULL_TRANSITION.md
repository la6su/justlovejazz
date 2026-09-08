# Vue/Tres transition status

Source audit: 2026-09-08, baseline ff9a12c5 plus pending flat-menu edits.
This is an ownership/evidence summary. [NEXT.md](../NEXT.md) is the task queue.
The foundational Phase 5–10 migration is recorded in
[the archive](archive/MIGRATION_VUE_TRES.md); remaining composition work is partial.

## Ownership

| Area                                                 | Actual boundary                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| SceneHost                                            | Persistent TresCanvas, scene, physical camera and initial renderer surface                      |
| Renderer / unifiedRenderer                           | Renderer lifecycle, recovery and post rendering / construction and init helpers                 |
| RenderScheduler                                      | Sole application render-loop driver; Tres internal loop stopped                                 |
| Camera, lights, ground, section roots                | Declarative nodes adopted by imperative controllers                                             |
| WorksInstallation                                    | Tres assembly/geometry; controller owns shared NodeMaterials and authored state                 |
| WorksPlaneStage                                      | Lazy primitive attachment; cards, textures and controller remain imperative                     |
| Services                                             | Primitive attachment; geometry lifetime in Vue, meshes still created imperatively in onMounted  |
| EnvSphere / EnvSky                                   | Primitive pavilion owner; sky leaf declared separately and borrows palette material             |
| ContactHalo / ManifestoInk                           | Async host primitive attachment; TSL construction and disposal remain in classes                |
| ContactCyprus, CasePlane, BakuCarousel               | Existing asset/input/material owners retained pending per-owner decisions                       |
| SplashCube, ParticleBurst, DrawTrail, JunniParticles | Existing deformation/instance owners retained; not proof that declarative leaves are impossible |

Do not infer that all geometry is declarative because it resides in a .vue file.
Do not dispose borrowed materials from both Vue and their controller.
Renderer/backend policy, typed eventBus/routePage, reduced-motion settlement
and one loop remain invariants.

## Evidence and its limits

- Prior full unit run before menu: 708 tests; after pending menu changes:
  705 tests and TypeScript/Vue checks passed in the recorded session.
- Build and bundle budgets passed before the menu changes. Prerender printed
  sandbox WebSocket EPERM messages; build completed. Vite also warned about
  the large Three chunk. Neither warning is evidence of browser parity.
- Serial browser result before menu: 23 passed, 1 skipped. Do not claim
  context-loss recovery passed without identifying whether that case skipped.
  Playwright uses its configured build/server; JLZ_DEV_BASE is not proof of
  which server the serial suite exercised.
- [WebGLBackend soak report](evidence/phase10-route-cycle-soak/2026-09-08T03-56-50-396Z-report.json):
  20 steady visits across six routes (not 20 complete six-route rounds),
  resource caps stable, no fatal errors according to its filter. Renderer
  programs unavailable; heap readings constant and not reliable leak evidence.
- The soak destroy summary retains a canvas. It verifies its implemented
  runtime-destroy checks, not complete Vue unmount or all GPU resources returning
  to baseline. Loop inactivity is a useful proxy; strengthen idle-frame evidence.
- User reported physical Contact/Manifesto checks successful. This is manual
  smoke evidence, not an automated report. Earlier Contact visual complaint was
  not independently reproduced.
- Physical WebGL device-loss restoration remains deferred. Earlier dated
  reports in evidence/ describe their own revisions only.

## Next verification

Finish navigation and cancellation tasks from NEXT.md. Test real primitive
replacement and host/runtime teardown order. Use the release commands in
DEVELOPMENT.md after relevant code changes. Record exact SHA, backend,
viewport, motion policy, failures/skips and report paths. Add no PASS solely
from class names, source searches or unit tests for visual behavior.
