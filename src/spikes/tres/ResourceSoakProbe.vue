<script setup lang="ts">
import {
  getCurrentInstance,
  markRaw,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type WatchStopHandle,
} from 'vue'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Color, FogExp2, PerspectiveCamera, Scene, Vector3 } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { WebGPUPostPipeline } from '../../core/WebGPUPostPipeline'
import { prefersReducedMotion } from '../../core/motionPolicy'
import { inspectRendererBackend } from './rendererReadiness'
import {
  canUseTSLPost,
  createRepresentativeScene,
  type RepresentativeSceneResources,
} from './representativeScene'
import { createUnifiedRendererFactory, readBackendPreference } from './unifiedRendererFactory'

/**
 * Development-only resource-soak probe for the Vue/Tres representative scope.
 * It mounts the same full scope as the representative pipeline probe (TSL mesh,
 * EnvSphere, ParticleBurst, SplashCube, Works case texture, Contact stage, one
 * TSL post pipeline on WebGPU) and exposes three owner-visible development
 * hooks: `window.__jlzTresSnapshot()` (resource counts),
 * `window.__jlzTresCycle()` (one bounded steady-state frame: owner update
 * ticks plus one render through the active path) and
 * `window.__jlzTresDestroy()` (real root teardown: Vue app unmount, which
 * runs the same dispose path as unmount navigation and releases the
 * probe-owned renderer). The hooks are removed with the probe.
 */

const status = ref('booting')
const backendName = ref('pending')
const renderPath = ref('pending')
const motionMode = ref(prefersReducedMotion() ? 'reduced' : 'normal')
const cyclesRef = ref(0)
/**
 * Development-only resize observability: how many times the probe's size
 * watcher fired (each fire runs `sceneResources.resize` plus one re-render
 * through the active path) and the last observed CSS size. `renderer.info`
 * counters are per-frame in three r185 and reset by every render, so they
 * cannot evidence the resize event path at rest.
 */
const resizeEventsRef = ref(0)
const lastResizeWidth = ref(0)
const lastResizeHeight = ref(0)
const renderer = shallowRef<WebGPURenderer>()
const cameraPosition = markRaw(new Vector3(0, 0, 4))
const backendPreference = readBackendPreference(window.location.search)
/**
 * Development-only pixel-parity mode (`?parity=1`): the WebGPU path skips the
 * WebGPU-only TSL post pipeline, so both backends render the identical scene
 * graph directly at the identical state (post parameters are part of the
 * render state and would otherwise differ by design). Used by
 * `scripts/visual-parity.ts` for the two-backend comparison; the post graph
 * itself is covered separately by the qualitative two-backend evidence of
 * 2026-08-21 and remains an intentional backend-conditional enhancement.
 */
const parityMode = new URLSearchParams(window.location.search).get('parity') === '1'
const rendererFactory = createUnifiedRendererFactory({
  backend: backendPreference,
  onCreated(createdRenderer) {
    renderer.value = markRaw(createdRenderer)
  },
})

const instance = getCurrentInstance()
let sceneResources: RepresentativeSceneResources | null = null
let postPipeline: WebGPUPostPipeline | null = null
let stopSizeWatch: WatchStopHandle | null = null
let activeScene: Scene | null = null
let activeCamera: PerspectiveCamera | null = null
let disposed = false

interface ResourceSnapshot {
  canvases: number
  sceneObjects: number
  sceneGeometries: number
  sceneMaterials: number
  sceneTextures: number
  rendererGeometries: number | null
  rendererTextures: number | null
  rendererPrograms: number | null
  rendererFrameCalls: number | null
  postPipeline: number
  cycles: number
  /** Development-only: how many size-watcher events fired since mount. */
  resizeEvents: number
  lastResizeWidth: number
  lastResizeHeight: number
}

type DevWindow = Window & {
  __jlzTresSnapshot?: () => ResourceSnapshot
  __jlzTresCycle?: () => void
  __jlzTresDestroy?: () => ResourceSnapshot & { unmounted: boolean }
  /**
   * Kept after unmount on purpose: the destroyed renderer reference lets the
   * soak runner read the released info counters to verify that no render
   * demand survives the root teardown. It holds a disposed object only.
   */
  __jlzTresRendererRef?: { info?: { render?: { frameCalls?: number } } } | null
}

function sceneCounts(scene: Scene | null): {
  objects: number
  geometries: number
  materials: number
  textures: number
} {
  const geometries = new Set<object>()
  const materials = new Set<object>()
  let objects = 0
  scene?.traverse((object) => {
    objects += 1
    const anyObject = object as unknown as {
      geometry?: object | null
      material?: object | object[] | null
    }
    if (anyObject.geometry) geometries.add(anyObject.geometry)
    if (Array.isArray(anyObject.material)) {
      for (const material of anyObject.material) materials.add(material)
    } else if (anyObject.material) {
      materials.add(anyObject.material)
    }
  })
  const textures = new Set<object>()
  for (const material of materials) {
    for (const value of Object.values(material as Record<string, unknown>)) {
      if (value && typeof value === 'object' && 'image' in (value as object)) {
        textures.add(value)
      }
    }
  }
  return {
    objects,
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
  }
}

function rendererCounts(rendererInstance: WebGPURenderer | undefined): {
  geometries: number | null
  textures: number | null
  programs: number | null
} {
  const info = (rendererInstance?.info ?? null) as {
    memory?: { geometries?: number; textures?: number }
    programs?: unknown[] | { length: number } | null
  } | null
  const programs = info?.programs
  return {
    geometries: info?.memory?.geometries ?? null,
    textures: info?.memory?.textures ?? null,
    programs:
      Array.isArray(programs) ||
      (programs !== null && typeof programs === 'object' && 'length' in programs)
        ? (programs as { length: number }).length
        : null,
  }
}

function snapshot(): ResourceSnapshot {
  const counts = sceneCounts(activeScene)
  const rendererInfo = rendererCounts(renderer.value)
  return {
    canvases: document.querySelectorAll('canvas').length,
    sceneObjects: counts.objects,
    sceneGeometries: counts.geometries,
    sceneMaterials: counts.materials,
    sceneTextures: counts.textures,
    rendererGeometries: rendererInfo.geometries,
    rendererTextures: rendererInfo.textures,
    rendererPrograms: rendererInfo.programs,
    rendererFrameCalls:
      (renderer.value?.info as { render?: { frameCalls?: number } } | undefined)?.render
        ?.frameCalls ?? null,
    postPipeline: postPipeline ? 1 : 0,
    cycles: cyclesRef.value,
    resizeEvents: resizeEventsRef.value,
    lastResizeWidth: lastResizeWidth.value,
    lastResizeHeight: lastResizeHeight.value,
  }
}

function runCycle(): void {
  if (disposed || !sceneResources || !activeScene || !activeCamera) return
  sceneResources.burst.update(1 / 60)
  sceneResources.splashCube.update(1 / 60)
  if (postPipeline) {
    postPipeline.render()
  } else {
    renderer.value?.render(activeScene, activeCamera)
  }
  cyclesRef.value += 1
}

function disposeScene(): void {
  if (disposed) return
  disposed = true
  stopSizeWatch?.()
  stopSizeWatch = null
  postPipeline?.dispose()
  postPipeline = null
  sceneResources?.dispose()
  sceneResources = null
  // The probe owns the renderer it created; dispose it, but keep the
  // reference so the post-destroy snapshot can read the released info
  // counters.
  renderer.value?.dispose()
  activeScene = null
  activeCamera = null
  const devWindow = window as DevWindow
  delete devWindow.__jlzTresSnapshot
  delete devWindow.__jlzTresCycle
  delete devWindow.__jlzTresDestroy
}

async function onReady(context: TresContext): Promise<void> {
  const actualRenderer = renderer.value
  if (!actualRenderer) {
    status.value = 'error:renderer-unavailable'
    return
  }
  const readiness = inspectRendererBackend(actualRenderer)
  backendName.value = readiness.backend ?? 'unknown'

  const camera = context.camera.activeCamera.value
  if (!(camera instanceof PerspectiveCamera)) {
    status.value = 'error:active-camera-unavailable'
    return
  }

  context.scene.value.background = new Color('#080510')
  context.scene.value.fog = new FogExp2('#080510', 0.18)
  camera.position.set(0, 0, 4)
  camera.lookAt(0, 0, 0)
  activeScene = context.scene.value
  activeCamera = camera

  sceneResources = createRepresentativeScene()
  sceneResources.attach(context.scene.value)

  try {
    status.value = 'loading-works-texture'
    if (!(await sceneResources.loadWorksPlane())) return
    status.value = 'loading-contact-model'
    if (!(await sceneResources.loadContactModel(camera))) return
    sceneResources.resize(context.sizes.width.value, context.sizes.height.value)
    if (canUseTSLPost(readiness.backend) && !parityMode) {
      postPipeline = WebGPUPostPipeline.create(actualRenderer, context.scene.value, camera)
      postPipeline.updateParams({
        bloom: 0.18,
        bloomRadius: 0.2,
        bloomThreshold: 0.6,
        vignette: 0.35,
        grain: 0,
        chromatic: 0,
        border: 0,
        refract: 0,
        gradeShadows: [1, 1, 1],
        gradeHighlights: [1, 1, 1],
      })
      postPipeline.render()
      renderPath.value = 'tsl-post'
    } else {
      actualRenderer.render(context.scene.value, camera)
      renderPath.value = parityMode ? 'parity-direct' : 'direct-webgl-fallback'
    }
    stopSizeWatch = watch([context.sizes.width, context.sizes.height], ([width, height]) => {
      if (disposed) return
      // Dev observability: count every event the size watcher received, then
      // run the existing resize path (stage resize plus one re-render).
      resizeEventsRef.value += 1
      lastResizeWidth.value = width
      lastResizeHeight.value = height
      sceneResources?.resize(width, height)
      if (postPipeline) {
        postPipeline.resize()
        postPipeline.render()
      } else {
        actualRenderer.render(context.scene.value, camera)
      }
    })
    status.value = 'ready'

    const devWindow = window as DevWindow
    devWindow.__jlzTresRendererRef = actualRenderer
    devWindow.__jlzTresSnapshot = () => snapshot()
    devWindow.__jlzTresCycle = () => runCycle()
    devWindow.__jlzTresDestroy = () => {
      instance?.appContext.app.unmount()
      return { ...snapshot(), unmounted: true }
    }
  } catch (error) {
    status.value = error instanceof Error ? `error:${error.message}` : 'error:unknown'
  }
}

function onError(error: unknown): void {
  status.value = error instanceof Error ? `error:${error.message}` : 'error:unknown'
}

onBeforeUnmount(disposeScene)
</script>

<template>
  <main data-tres-resource-probe>
    <p data-status>{{ status }}</p>
    <p data-backend>{{ backendName }}</p>
    <p data-render-path>{{ renderPath }}</p>
    <p data-motion-mode>{{ motionMode }}</p>
    <p data-cycles>{{ cyclesRef }}</p>
    <p data-resize-events>{{ resizeEventsRef }}</p>
    <section style="width: min(800px, 100vw); height: min(450px, 60vh); overflow: hidden">
      <TresCanvas
        render-mode="manual"
        :dpr="[1, 2]"
        :renderer="rendererFactory"
        @ready="onReady"
        @error="onError"
      >
        <TresPerspectiveCamera :position="cameraPosition" />
      </TresCanvas>
    </section>
  </main>
</template>
