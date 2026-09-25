<script setup lang="ts">
// src/app/SceneHost.vue — Phase 7: the persistent Tres root.
//
// Mounted ONCE by AppShell (outside RouterView, so route navigation never
// remounts the scene root). It owns, each with exactly one owner:
//
// - the canvas (the Vue-rendered `<canvas>` inside TresCanvas — the single
//   canvas, e2e `canvas.canvas`);
// - the renderer (the custom renderer factory — the single construction
//   owner; Tres awaits its async `init()` before the ready event);
// - the camera (declared by `CinematicCamera`, passed to Experience through
//   the bridge and adopted by its cinematic controller);
// - the scene (the Tres context scene — Experience stops creating its own);
//
// and resolves the `sceneHost` bridge after renderer init + actual-backend
// inspection (software-adapter re-creation through the pure
// `planUnifiedBackend` policy). Scene owners enter Tres through explicit
// `primitive` adapters (`:dispose="null"` — Experience stays the single
// disposal owner). RenderMode is `on-demand` and the Tres loop is the one
// RAF host (ADR 0005): the `RenderScheduler` (ADR 0004) owns its start/stop
// through the `SceneLoopPort`, the frame callback runs in the before-render
// hooks, and the render STEP stays on the Experience pipeline via the
// replaced Tres render function. On-demand avoids manual mode's delayed
// advance().
//
import { onBeforeUnmount, ref, toValue } from 'vue'
import { TresCanvas } from '@tresjs/core'
import type { TresContext, TresRendererSetupContext } from '@tresjs/core'
import type { PerspectiveCamera } from 'three'
import { planUnifiedBackend } from '../core/rendererBackend'
import { DeviceCapability } from '../core/DeviceCapability'
import {
  createUnifiedWebGPUInstance,
  initUnifiedWebGPUInstance,
  inspectUnifiedBackend,
  type UnifiedRenderSurface,
} from '../core/unifiedRenderer'
import { sceneHost, type SceneLoopPort, type SceneStagePorts } from './sceneHost'
import { createReadySlot, readyNode } from './readySlot'
import { createStageSlot } from './stageSlot'
import CinematicLights from './scene/CinematicLights.vue'
import CinematicCamera from './scene/CinematicCamera.vue'
import GroundPlane from './scene/GroundPlane.vue'
import SectionGroupRoots from './scene/SectionGroupRoots.vue'
import ServicesStageOwner from './scene/ServicesStageOwner.vue'
import EnvSphereOwner from './scene/EnvSphereOwner.vue'
import EnvSky from './scene/EnvSky.vue'
import WorksStageOwner from './scene/WorksStageOwner.vue'
import type { CinematicLightsNodes } from '../Experience/World/Lights'
import type { GroundPlaneNode } from '../Experience/Scene/GroundPlane'
import type { Group } from 'three'
import type { ServicesStage } from '../Experience/World/ServicesStage'
import type { EnvSphere } from '../Experience/World/EnvSphere'
import type { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'
import type { WorksInstallation } from '../Experience/World/WorksInstallation'
import type { ContactHaloStage } from '../Experience/World/ContactHaloStage'
import type { ManifestoInkStage } from '../Experience/World/ManifestoInkStage'

const noScene = new URLSearchParams(window.location.search).has('no-scene')
// Dev-only physical recovery seam. It preserves the shipped single-renderer
// topology (`WebGPURenderer` with its WebGLBackend), but lets the browser gate
// exercise a real WebGL context loss on hardware even when Chrome exposes
// native WebGPU. Vite folds this branch out of production builds.
const forceWebGLBackendForTest =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('force-webgl-backend')

// Tres owns the canvas size manager and reapplies its `dpr` option after
// renderer readiness. Keep that manager on the same initial cap as the
// Renderer owner; otherwise Tres can overwrite the capped buffer with the
// raw devicePixelRatio (for example 3× on a mobile browser).
const initialDprCap = DeviceCapability.getInstance().maxDpr

// Single renderer-construction owner (Phase 7): the custom renderer factory.
// Construction is synchronous (Tres awaits the instance's `init()` itself);
// the backend is inspected AFTER init in `onReady`. The unified
// `WebGPURenderer` is the only class constructed (Phase 6 production default;
// the dev-forced classic `?renderer=webgl` QA owner was removed in Phase 10).
const rendererFactory = (ctx: TresRendererSetupContext): UnifiedRenderSurface => {
  const canvas = toValue(ctx.canvas) ?? document.createElement('canvas')
  const renderer = createUnifiedWebGPUInstance(canvas, forceWebGLBackendForTest)
  // Tres may report an initialization error before `onReady`; retain the
  // created owner so that the error path can release it as well.
  createdRenderer = renderer
  return renderer
}

const tresRef = ref<{ $el: Element } | null>(null)
let resolved = false
let disposed = false
let lifecycleGeneration = 0
let liveRenderer: UnifiedRenderSurface | null = null
let createdRenderer: UnifiedRenderSurface | null = null
let unbindRendererOwner: (() => void) | null = null
let stopTresLoop: (() => void) | null = null

// ── ADR 0005: Tres-native loop port state ──
// Late-bound to the live Tres renderer manager in `onReady`; every port call
// before ready (or after unmount) is a safe no-op.
type RendererManager = TresContext['renderer']
let liveManager: RendererManager | null = null
let frameCallback: ((time: number) => void) | null = null
let externalInvalidateHandler: (() => void) | null = null

const loopPort: SceneLoopPort = {
  onFrame(callback) {
    frameCallback = callback
  },
  start() {
    liveManager?.loop.start()
  },
  stop() {
    liveManager?.loop.stop()
  },
  onExternalInvalidate(handler) {
    externalInvalidateHandler = handler
    return () => {
      if (externalInvalidateHandler === handler) externalInvalidateHandler = null
    }
  },
}
// ── Declarative node ready slots ──
// Each scene node reports itself through a slot: the template binds
// `@ready="slot.resolve"`, and `onReady` awaits the nodes it needs (sync
// fast path when the node already mounted).
const cameraSlot = createReadySlot<PerspectiveCamera>()
const lightsSlot = createReadySlot<CinematicLightsNodes>()
const groundSlot = createReadySlot<GroundPlaneNode>()
const sectionRootsSlot = createReadySlot<readonly Group[]>()
const servicesStageSlot = createReadySlot<ServicesStage>()
const envSphereSlot = createReadySlot<EnvSphere>()
const envSkySlot = createReadySlot<unknown>()
/** Template-facing alias: the env sphere must mount before the sky plane. */
const envSphereNode = envSphereSlot.value

// ── Declarative stage slots (mount/unmount boundaries) ──
// One slot per stage family replaces the hand-written mount/unmount pairs.
// The works installation is a child of the works stage, so its port keeps the
// two-level guard (the child never attaches to — or outlives — a retired stage).
const worksStageSlot = createStageSlot<WorksPlaneStage>({ isAlive: () => !disposed })
const worksInstallationSlot = createStageSlot<WorksInstallation>({ isAlive: () => !disposed })
const contactHaloSlot = createStageSlot<ContactHaloStage>({ isAlive: () => !disposed })
const manifestoInkSlot = createStageSlot<ManifestoInkStage>({ isAlive: () => !disposed })

// Top-level aliases keep the template's declarative bindings unchanged
// (setup-scope refs auto-unwrap, so `:object` receives the raw object).
const declarativeWorksStage = worksStageSlot.object
const declarativeWorksInstallation = worksInstallationSlot.object
const declarativeContactHalo = contactHaloSlot.object
const declarativeManifestoInk = manifestoInkSlot.object

const stages: SceneStagePorts = {
  works: {
    mountStage: (stage) => worksStageSlot.mount(stage),
    unmountStage: async (stage) => {
      if (worksStageSlot.object.value !== stage) return
      // The installation is a child of this stage. Clear the child boundary
      // with its parent so a later stage can never inherit a retired installation.
      worksInstallationSlot.object.value = null
      await worksStageSlot.unmount(stage)
    },
    mountInstallation: (stage, installation) => {
      if (worksStageSlot.object.value !== stage) return Promise.resolve()
      return worksInstallationSlot.mount(installation)
    },
    unmountInstallation: (stage, installation) => {
      if (worksStageSlot.object.value !== stage) return Promise.resolve()
      return worksInstallationSlot.unmount(installation)
    },
  },
  contactHalo: contactHaloSlot,
  manifestoInk: manifestoInkSlot,
}

const disposedRenderers = new WeakSet<object>()

function disposeRendererOnce(renderer: UnifiedRenderSurface | null): void {
  if (!renderer || disposedRenderers.has(renderer)) return
  disposedRenderers.add(renderer)
  renderer.dispose()
}

async function onReady(context: TresContext): Promise<void> {
  if (noScene || resolved) return
  // ADR 0005: the persistent Tres loop is the one RAF host. Install the
  // bridges BEFORE any async work can yield so the first scheduler tick (and
  // any ecosystem invalidate) always lands on the final wiring.
  const manager = context.renderer
  liveManager = manager
  // The render STEP stays on the Experience pipeline (Renderer.update →
  // RenderPipeline). Tres's default render function would double-render
  // behind the pipeline's back — replace it with the frame-accounting
  // delegate that only drains Tres's pending-frame counter (public
  // `replaceRenderFunction` / `useLoop().render` seam).
  manager.replaceRenderFunction((notify) => notify())
  // The scheduler's frame callback runs inside Tres's before-render hooks,
  // so `useLoop` subscribers (Cientos components included) share this RAF.
  // The frame contract expects a ms timestamp (Experience `Time.update`).
  manager.loop.onBeforeLoop(() => frameCallback?.(performance.now()))
  // Ecosystem wake path: Cientos components invalidate the manager on their
  // change events; the wrap translates each call into a typed scheduler
  // demand so external activity opens a render window.
  const baseInvalidate = manager.invalidate.bind(manager)
  manager.invalidate = (...args: Parameters<typeof baseInvalidate>) => {
    baseInvalidate(...args)
    externalInvalidateHandler?.()
  }
  // Tres auto-starts its loop when ready. The RenderScheduler owns
  // start/stop (ADR 0004/0005): pause it until Experience's first
  // invalidation opens the first window, and keep the cleanup handle for an
  // unmount during the async backend-fallback window below.
  stopTresLoop = () => manager.loop.stop()
  stopTresLoop()
  const generation = ++lifecycleGeneration
  const isCurrent = (): boolean => !disposed && generation === lifecycleGeneration
  const camera = await readyNode(cameraSlot)
  const lights = await readyNode(lightsSlot)
  const ground = await readyNode(groundSlot)
  const sectionRoots = await readyNode(sectionRootsSlot)
  const servicesStage = await readyNode(servicesStageSlot)
  const envSphere = await readyNode(envSphereSlot)
  if (!envSkySlot.value.value) await envSkySlot.promise
  if (!isCurrent()) return
  const canvas =
    (tresRef.value?.$el as HTMLCanvasElement | undefined) ?? document.createElement('canvas')
  // The scene is the decorative visual layer over the semantic route content:
  // hidden from the accessibility tree (AGENTS.md: canvas hidden). The
  // wrapper carries the same attribute; the e2e contract asserts it on the
  // canvas element (TresCanvas does not forward fallthrough attributes).
  canvas.setAttribute('aria-hidden', 'true')
  let renderer = context.renderer.instance as UnifiedRenderSurface
  createdRenderer = renderer
  let backend = inspectUnifiedBackend(renderer)
  let plan = planUnifiedBackend(backend)
  if (plan.recreate) {
    // Software WebGPU adapter (SwiftShader ~2 FPS) → hardware WebGL2 through
    // the SAME class (Phase 6 policy). The canvas is already in the DOM:
    // dispose the dead instance and swap in the replacement.
    disposeRendererOnce(renderer)
    const candidate = createUnifiedWebGPUInstance(canvas, true)
    createdRenderer = candidate
    try {
      await initUnifiedWebGPUInstance(candidate)
    } catch (error) {
      disposeRendererOnce(candidate)
      if (createdRenderer === candidate) createdRenderer = null
      onError(error instanceof Error ? error : new Error(String(error)))
      return
    }
    if (!isCurrent()) {
      disposeRendererOnce(candidate)
      return
    }
    renderer = candidate
    context.renderer.instance = renderer
    backend = inspectUnifiedBackend(renderer)
    plan = planUnifiedBackend(backend)
  }
  if (!isCurrent()) {
    disposeRendererOnce(renderer)
    return
  }
  resolved = true
  liveRenderer = renderer
  unbindRendererOwner = sceneHost.bindRendererOwner((replacement) => {
    liveRenderer = replacement
  })
  sceneHost.resolve({
    scene: context.scene.value,
    context,
    renderer,
    canvas,
    camera,
    mode: plan.mode,
    backend,
    lights,
    ground,
    sectionRoots,
    servicesStage,
    envSphere,
    loop: loopPort,
    stages,
  })
}

function onError(error: Error): void {
  if (resolved || disposed) return
  resolved = true
  disposeRendererOnce(createdRenderer)
  createdRenderer = null
  sceneHost.reject(error)
}

onBeforeUnmount(() => {
  disposed = true
  lifecycleGeneration += 1
  stopTresLoop?.()
  stopTresLoop = null
  unbindRendererOwner?.()
  unbindRendererOwner = null
  liveManager = null
  frameCallback = null
  externalInvalidateHandler = null
  disposeRendererOnce(liveRenderer)
  if (createdRenderer !== liveRenderer) disposeRendererOnce(createdRenderer)
  liveRenderer = null
  createdRenderer = null
  worksStageSlot.object.value = null
  worksInstallationSlot.object.value = null
})
</script>

<template>
  <div v-if="!noScene" class="jlz-scene-host" aria-hidden="true">
    <TresCanvas
      ref="tresRef"
      class="canvas jlz-scene-canvas"
      render-mode="on-demand"
      :dpr="[1, initialDprCap]"
      :renderer="rendererFactory"
      :style="{ pointerEvents: 'none' }"
      @ready="onReady"
      @error="onError"
    >
      <CinematicCamera @ready="cameraSlot.resolve" />
      <CinematicLights @ready="lightsSlot.resolve" />
      <GroundPlane @ready="groundSlot.resolve" />
      <SectionGroupRoots @ready="sectionRootsSlot.resolve" />
      <ServicesStageOwner @ready="servicesStageSlot.resolve" />
      <EnvSphereOwner @ready="envSphereSlot.resolve" />
      <EnvSky
        v-if="envSphereNode"
        :material="envSphereNode.skyMaterial"
        @ready="envSkySlot.resolve"
      />
      <primitive v-if="declarativeContactHalo" :object="declarativeContactHalo" :dispose="null" />
      <primitive v-if="declarativeManifestoInk" :object="declarativeManifestoInk" :dispose="null" />
      <WorksStageOwner
        :stage="declarativeWorksStage"
        :installation="declarativeWorksInstallation"
      />
    </TresCanvas>
  </div>
</template>
