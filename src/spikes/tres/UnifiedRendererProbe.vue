<script setup lang="ts">
import { markRaw, ref, shallowRef } from 'vue'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Vector3, WebGPURenderer } from 'three/webgpu'
import { inspectRendererBackend } from './rendererReadiness'
import { createUnifiedRendererFactory, readBackendPreference } from './unifiedRendererFactory'

const status = ref('booting')
const backendName = ref('pending')
const isFallbackAdapter = ref<boolean | null>(null)
const renders = ref(0)
const renderer = shallowRef<WebGPURenderer>()
const cameraPosition = markRaw(new Vector3(0, 0, 3))
const backendPreference = readBackendPreference(window.location.search)
const rendererFactory = createUnifiedRendererFactory({
  backend: backendPreference,
  onCreated(createdRenderer) {
    renderer.value = markRaw(createdRenderer)
  },
})

function onReady(context: TresContext): void {
  const actualRenderer = renderer.value ?? context.renderer.instance
  const readiness = inspectRendererBackend(actualRenderer)
  backendName.value = readiness.backend ?? 'unknown'
  isFallbackAdapter.value = readiness.isFallbackAdapter
  status.value = readiness.backend ? 'renderer-ready' : 'backend-unknown'
  context.renderer.advance()
}

function onRender(): void {
  renders.value += 1
}

function onError(error: unknown): void {
  status.value = error instanceof Error ? `error:${error.message}` : 'error:unknown'
}
</script>

<template>
  <main data-tres-unified-probe>
    <p data-status>{{ status }}</p>
    <p data-preference>{{ backendPreference }}</p>
    <p data-backend>{{ backendName }}</p>
    <p data-fallback-adapter>{{ isFallbackAdapter ?? 'unknown' }}</p>
    <p data-renders>{{ renders }}</p>
    <TresCanvas
      render-mode="manual"
      :renderer="rendererFactory"
      @ready="onReady"
      @render="onRender"
      @error="onError"
    >
      <TresPerspectiveCamera :position="cameraPosition" />
      <TresMesh>
        <TresBoxGeometry />
        <TresMeshBasicMaterial color="#ff4fd8" />
      </TresMesh>
    </TresCanvas>
  </main>
</template>
