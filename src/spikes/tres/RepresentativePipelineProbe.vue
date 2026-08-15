<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref, shallowRef, watch, type WatchStopHandle } from 'vue'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Color, FogExp2, PerspectiveCamera, Vector3 } from 'three'
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

const status = ref('booting')
const backendName = ref('pending')
const renderPath = ref('pending')
const motionMode = ref(prefersReducedMotion() ? 'reduced' : 'normal')
const renderPixelRatio = ref('pending')
const renderer = shallowRef<WebGPURenderer>()
const cameraPosition = markRaw(new Vector3(0, 0, 4))
const backendPreference = readBackendPreference(window.location.search)
const rendererFactory = createUnifiedRendererFactory({
  backend: backendPreference,
  onCreated(createdRenderer) {
    renderer.value = markRaw(createdRenderer)
  },
})

let sceneResources: RepresentativeSceneResources | null = null
let postPipeline: WebGPUPostPipeline | null = null
let stopSizeWatch: WatchStopHandle | null = null

function disposeScene(): void {
  stopSizeWatch?.()
  stopSizeWatch = null
  postPipeline?.dispose()
  postPipeline = null
  sceneResources?.dispose()
  sceneResources = null
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
  renderPixelRatio.value = actualRenderer.getPixelRatio().toFixed(2)

  sceneResources = createRepresentativeScene()
  sceneResources.attach(context.scene.value)

  try {
    status.value = 'loading-works-texture'
    if (!(await sceneResources.loadWorksPlane())) return
    status.value = 'loading-contact-model'
    if (!(await sceneResources.loadContactModel(camera))) return
    sceneResources.resize(context.sizes.width.value, context.sizes.height.value)
    if (canUseTSLPost(readiness.backend)) {
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
      // Three r185 documents RenderPipeline as WebGPU-only. Keep the forced
      // WebGLBackend probe explicit: it verifies the identical node material
      // and fog scene without pretending that a WebGPU-only post graph ran.
      actualRenderer.render(context.scene.value, camera)
      renderPath.value = 'direct-webgl-fallback'
    }
    stopSizeWatch = watch([context.sizes.width, context.sizes.height], ([width, height]) => {
      sceneResources?.resize(width, height)
      renderPixelRatio.value = actualRenderer.getPixelRatio().toFixed(2)
      if (postPipeline) {
        postPipeline.resize()
        postPipeline.render()
      } else {
        actualRenderer.render(context.scene.value, camera)
      }
    })
    status.value = 'complete'
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
  <main data-tres-representative-probe>
    <p data-status>{{ status }}</p>
    <p data-backend>{{ backendName }}</p>
    <p data-render-path>{{ renderPath }}</p>
    <p data-motion-mode>{{ motionMode }}</p>
    <p data-render-pixel-ratio>{{ renderPixelRatio }}</p>
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
