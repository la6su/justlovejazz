<script setup lang="ts">
import { markRaw, onBeforeUnmount, ref, shallowRef } from 'vue'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Color, FogExp2, PerspectiveCamera, Vector3 } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { WebGPUPostPipeline } from '../../core/WebGPUPostPipeline'
import { inspectRendererBackend } from './rendererReadiness'
import {
  canUseTSLPost,
  createRepresentativeScene,
  type RepresentativeSceneResources,
} from './representativeScene'
import { createUnifiedRendererFactory, readBackendPreference } from './unifiedRendererFactory'

type Driver = 'manual' | 'renderer-loop'

const SAMPLE_FRAMES = 90
const WARMUP_MS = 250
const IDLE_SAMPLE_MS = 1000

const query = new URLSearchParams(window.location.search)
const driver: Driver = query.get('driver') === 'renderer-loop' ? 'renderer-loop' : 'manual'
const backendPreference = readBackendPreference(window.location.search)
const status = ref('booting')
const backendName = ref('pending')
const draws = ref(0)
const burstTicks = ref(0)
const idleTicks = ref(0)
const p50 = ref<number | null>(null)
const p95 = ref<number | null>(null)
const cameraPosition = markRaw(new Vector3(0, 0, 3))
const renderer = shallowRef<WebGPURenderer>()
const rendererFactory = createUnifiedRendererFactory({
  backend: backendPreference,
  onCreated(createdRenderer) {
    renderer.value = markRaw(createdRenderer)
  },
})

let context: TresContext | null = null
let loopSubscription: { off: () => void } | null = null
let sceneResources: RepresentativeSceneResources | null = null
let postPipeline: WebGPUPostPipeline | null = null
let warmupTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let measuring = false
let samplingIdle = false
let ticks = 0
let previousFrame: number | null = null
const frameTimes: number[] = []

function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null
  const ordered = [...values].sort((a, b) => a - b)
  const index = Math.min(ordered.length - 1, Math.ceil(ordered.length * fraction) - 1)
  return ordered[index] ?? null
}

function stopRendererLoop(): void {
  renderer.value?.setAnimationLoop(null)
}

function renderRepresentativeFrame(): void {
  const activeContext = context
  const activeCamera = activeContext?.camera.activeCamera.value
  if (!activeContext || !activeCamera || !renderer.value) return
  if (postPipeline) {
    postPipeline.render()
    return
  }
  renderer.value.render(activeContext.scene.value, activeCamera)
}

function disposeScene(): void {
  postPipeline?.dispose()
  postPipeline = null
  sceneResources?.dispose()
  sceneResources = null
}

function finishBurst(): void {
  measuring = false
  stopRendererLoop()
  burstTicks.value = ticks
  ticks = 0
  samplingIdle = true
  status.value = 'sampling-idle'
  idleTimer = setTimeout(() => {
    samplingIdle = false
    idleTicks.value = ticks
    p50.value = percentile(frameTimes, 0.5)
    p95.value = percentile(frameTimes, 0.95)
    status.value = 'complete'
  }, IDLE_SAMPLE_MS)
}

function recordFrame(now: number): void {
  if (!measuring) return
  if (previousFrame !== null) frameTimes.push(now - previousFrame)
  previousFrame = now
  draws.value += 1
  if (draws.value >= SAMPLE_FRAMES) {
    finishBurst()
    return
  }
  if (driver === 'manual') context?.renderer.advance()
}

function startBurst(): void {
  if (!context || !renderer.value) return
  draws.value = 0
  ticks = 0
  frameTimes.length = 0
  previousFrame = null
  measuring = true
  status.value = 'sampling-burst'

  if (driver === 'manual') {
    context.renderer.advance()
    return
  }

  context.renderer.loop.stop()
  renderer.value.setAnimationLoop((time) => {
    if (!measuring || !context || !renderer.value) return
    ticks += 1
    renderRepresentativeFrame()
    recordFrame(time)
  })
}

async function onReady(readyContext: TresContext): Promise<void> {
  context = readyContext
  const actualRenderer = renderer.value
  const camera = readyContext.camera.activeCamera.value
  if (!actualRenderer || !(camera instanceof PerspectiveCamera)) {
    status.value = 'error:renderer-or-camera-unavailable'
    return
  }
  const readiness = inspectRendererBackend(actualRenderer)
  backendName.value = readiness.backend ?? 'unknown'
  readyContext.scene.value.background = new Color('#080510')
  readyContext.scene.value.fog = new FogExp2('#080510', 0.18)
  camera.position.set(0, 0, 4)
  camera.lookAt(0, 0, 0)
  sceneResources = createRepresentativeScene()
  sceneResources.attach(readyContext.scene.value)
  try {
    status.value = 'loading-assets'
    if (!(await sceneResources.loadWorksPlane())) return
    if (!(await sceneResources.loadContactModel(camera))) return
    sceneResources.resize(readyContext.sizes.width.value, readyContext.sizes.height.value)
    if (canUseTSLPost(readiness.backend)) {
      postPipeline = WebGPUPostPipeline.create(actualRenderer, readyContext.scene.value, camera)
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
    }
    readyContext.renderer.replaceRenderFunction((notifyFrameRendered) => {
      renderRepresentativeFrame()
      notifyFrameRendered()
    })
  } catch (error) {
    status.value = error instanceof Error ? `error:${error.message}` : 'error:unknown'
    disposeScene()
    return
  }
  loopSubscription = readyContext.renderer.loop.onLoop(() => {
    if (driver === 'manual' && (measuring || samplingIdle)) ticks += 1
  })
  status.value = 'warming-up'
  warmupTimer = setTimeout(startBurst, WARMUP_MS)
}

function onRender(): void {
  if (driver === 'manual') recordFrame(performance.now())
}

function onError(error: unknown): void {
  status.value = error instanceof Error ? `error:${error.message}` : 'error:unknown'
}

onBeforeUnmount(() => {
  if (warmupTimer) clearTimeout(warmupTimer)
  if (idleTimer) clearTimeout(idleTimer)
  loopSubscription?.off()
  stopRendererLoop()
  disposeScene()
})
</script>

<template>
  <main data-tres-loop-probe>
    <p data-status>{{ status }}</p>
    <p data-driver>{{ driver }}</p>
    <p data-backend>{{ backendName }}</p>
    <p data-draws>{{ draws }}</p>
    <p data-burst-ticks>{{ burstTicks }}</p>
    <p data-idle-ticks>{{ idleTicks }}</p>
    <p data-p50>{{ p50?.toFixed(2) ?? 'pending' }}</p>
    <p data-p95>{{ p95?.toFixed(2) ?? 'pending' }}</p>
    <section style="width: min(800px, 100vw); height: min(450px, 60vh); overflow: hidden">
      <TresCanvas
        render-mode="manual"
        :dpr="[1, 2]"
        :renderer="rendererFactory"
        @ready="onReady"
        @render="onRender"
        @error="onError"
      >
        <TresPerspectiveCamera :position="cameraPosition" />
        <TresMesh>
          <TresBoxGeometry />
          <TresMeshBasicMaterial color="#72f1b8" />
        </TresMesh>
      </TresCanvas>
    </section>
  </main>
</template>
