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
// `planUnifiedBackend` policy). The existing World enters Tres through the
// explicit `primitive` adapter (`:dispose="null"` — Experience stays the
// single disposal owner). RenderMode is `on-demand`: Tres's internal loop is
// stopped immediately after ready and the `RenderScheduler` (ADR 0004) is the
// single loop driver. On-demand also avoids manual mode's delayed advance().
//
import { markRaw, nextTick, onBeforeUnmount, ref, shallowRef, toValue } from 'vue'
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
import { sceneHost } from './sceneHost'
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
let declarativeCamera: PerspectiveCamera | null = null
let resolveDeclarativeCamera!: (camera: PerspectiveCamera) => void
const declarativeCameraReady = new Promise<PerspectiveCamera>((resolve) => {
  resolveDeclarativeCamera = resolve
})
let declarativeLights: CinematicLightsNodes | null = null
let resolveDeclarativeLights!: (lights: CinematicLightsNodes) => void
const declarativeLightsReady = new Promise<CinematicLightsNodes>((resolve) => {
  resolveDeclarativeLights = resolve
})
let declarativeGround: GroundPlaneNode | null = null
let resolveDeclarativeGround!: (ground: GroundPlaneNode) => void
const declarativeGroundReady = new Promise<GroundPlaneNode>((resolve) => {
  resolveDeclarativeGround = resolve
})
let declarativeSectionRoots: readonly Group[] | null = null
let resolveDeclarativeSectionRoots!: (groups: readonly Group[]) => void
const declarativeSectionRootsReady = new Promise<readonly Group[]>((resolve) => {
  resolveDeclarativeSectionRoots = resolve
})
let declarativeServicesStage: ServicesStage | null = null
let resolveDeclarativeServicesStage!: (stage: ServicesStage) => void
const declarativeServicesStageReady = new Promise<ServicesStage>((resolve) => {
  resolveDeclarativeServicesStage = resolve
})
const declarativeEnvSphere = shallowRef<EnvSphere | null>(null)
const declarativeWorksStage = shallowRef<WorksPlaneStage | null>(null)
const declarativeWorksInstallation = shallowRef<WorksInstallation | null>(null)
const declarativeContactHalo = shallowRef<ContactHaloStage | null>(null)
const declarativeManifestoInk = shallowRef<ManifestoInkStage | null>(null)
let resolveDeclarativeEnvSphere!: (owner: EnvSphere) => void
const declarativeEnvSphereReady = new Promise<EnvSphere>((resolve) => {
  resolveDeclarativeEnvSphere = resolve
})
let declarativeEnvSky = false
let resolveDeclarativeEnvSky!: () => void
const declarativeEnvSkyReady = new Promise<void>((resolve) => {
  resolveDeclarativeEnvSky = resolve
})
const disposedRenderers = new WeakSet<object>()

async function mountWorksPlaneStage(stage: WorksPlaneStage): Promise<void> {
  if (disposed) return
  declarativeWorksStage.value = stage
  await nextTick()
}

async function unmountWorksPlaneStage(stage: WorksPlaneStage): Promise<void> {
  if (declarativeWorksStage.value !== stage) return
  declarativeWorksStage.value = null
  // The installation is a child of this stage. Clear the child boundary with
  // its parent so a later stage can never inherit a retired installation.
  declarativeWorksInstallation.value = null
  await nextTick()
}

async function mountWorksInstallation(
  stage: WorksPlaneStage,
  installation: WorksInstallation,
): Promise<void> {
  if (disposed || declarativeWorksStage.value !== stage) return
  declarativeWorksInstallation.value = markRaw(installation)
  await nextTick()
}

async function unmountWorksInstallation(
  stage: WorksPlaneStage,
  installation: WorksInstallation,
): Promise<void> {
  if (declarativeWorksStage.value !== stage || declarativeWorksInstallation.value !== installation)
    return
  declarativeWorksInstallation.value = null
  await nextTick()
}

async function mountContactHaloStage(stage: ContactHaloStage): Promise<void> {
  if (disposed) return
  declarativeContactHalo.value = markRaw(stage)
  await nextTick()
}

async function unmountContactHaloStage(stage: ContactHaloStage): Promise<void> {
  if (declarativeContactHalo.value !== stage) return
  declarativeContactHalo.value = null
  await nextTick()
}

async function mountManifestoInkStage(stage: ManifestoInkStage): Promise<void> {
  if (disposed) return
  declarativeManifestoInk.value = markRaw(stage)
  await nextTick()
}

async function unmountManifestoInkStage(stage: ManifestoInkStage): Promise<void> {
  if (declarativeManifestoInk.value !== stage) return
  declarativeManifestoInk.value = null
  await nextTick()
}

function onDeclarativeCameraReady(camera: PerspectiveCamera): void {
  declarativeCamera = camera
  resolveDeclarativeCamera(camera)
}

function onDeclarativeLightsReady(lights: CinematicLightsNodes): void {
  declarativeLights = lights
  resolveDeclarativeLights(lights)
}
function onDeclarativeGroundReady(ground: GroundPlaneNode): void {
  declarativeGround = ground
  resolveDeclarativeGround(ground)
}
function onDeclarativeSectionRootsReady(groups: Group[]): void {
  declarativeSectionRoots = groups
  resolveDeclarativeSectionRoots(groups)
}
function onDeclarativeServicesStageReady(stage: ServicesStage): void {
  declarativeServicesStage = stage
  resolveDeclarativeServicesStage(stage)
}
function onDeclarativeEnvSphereReady(owner: EnvSphere): void {
  declarativeEnvSphere.value = owner
  resolveDeclarativeEnvSphere(owner)
}
function onDeclarativeEnvSkyReady(): void {
  declarativeEnvSky = true
  resolveDeclarativeEnvSky()
}

function disposeRendererOnce(renderer: UnifiedRenderSurface | null): void {
  if (!renderer || disposedRenderers.has(renderer)) return
  disposedRenderers.add(renderer)
  renderer.dispose()
}

async function onReady(context: TresContext): Promise<void> {
  if (noScene || resolved) return
  // Tres starts its internal RAF when the renderer becomes ready. The
  // RenderScheduler owns the actual renderer loop, so stop Tres immediately
  // (before any async backend fallback work can yield) and keep the cleanup
  // handle for an unmount during that async window.
  stopTresLoop = () => context.renderer.loop.stop()
  stopTresLoop()
  const generation = ++lifecycleGeneration
  const isCurrent = (): boolean => !disposed && generation === lifecycleGeneration
  const camera = declarativeCamera ?? (await declarativeCameraReady)
  const lights = declarativeLights ?? (await declarativeLightsReady)
  const ground = declarativeGround ?? (await declarativeGroundReady)
  const sectionRoots = declarativeSectionRoots ?? (await declarativeSectionRootsReady)
  const servicesStage = declarativeServicesStage ?? (await declarativeServicesStageReady)
  const envSphere = declarativeEnvSphere.value ?? (await declarativeEnvSphereReady)
  if (!declarativeEnvSky) await declarativeEnvSkyReady
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
    mountWorksPlaneStage,
    unmountWorksPlaneStage,
    mountWorksInstallation,
    unmountWorksInstallation,
    mountContactHaloStage,
    unmountContactHaloStage,
    mountManifestoInkStage,
    unmountManifestoInkStage,
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
  disposeRendererOnce(liveRenderer)
  if (createdRenderer !== liveRenderer) disposeRendererOnce(createdRenderer)
  liveRenderer = null
  createdRenderer = null
  declarativeWorksStage.value = null
  declarativeWorksInstallation.value = null
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
      <CinematicCamera @ready="onDeclarativeCameraReady" />
      <CinematicLights @ready="onDeclarativeLightsReady" />
      <GroundPlane @ready="onDeclarativeGroundReady" />
      <SectionGroupRoots @ready="onDeclarativeSectionRootsReady" />
      <ServicesStageOwner @ready="onDeclarativeServicesStageReady" />
      <EnvSphereOwner @ready="onDeclarativeEnvSphereReady" />
      <EnvSky
        v-if="declarativeEnvSphere"
        :material="declarativeEnvSphere.skyMaterial"
        @ready="onDeclarativeEnvSkyReady"
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
