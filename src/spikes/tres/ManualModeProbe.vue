<script setup lang="ts">
import { markRaw, ref } from 'vue'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Vector3 } from 'three'

const status = ref('booting')
const renders = ref(0)
const cameraPosition = markRaw(new Vector3(0, 0, 3))

function onReady(context: TresContext): void {
  status.value = 'manual-ready'
  context.renderer.advance()
}

function onRender(): void {
  renders.value += 1
}
</script>

<template>
  <main data-tres-manual-probe>
    <p data-status>{{ status }}</p>
    <p data-renders>{{ renders }}</p>
    <TresCanvas render-mode="manual" @ready="onReady" @render="onRender">
      <TresPerspectiveCamera :position="cameraPosition" />
      <TresMesh>
        <TresBoxGeometry />
        <TresMeshBasicMaterial color="#ffe600" />
      </TresMesh>
    </TresCanvas>
  </main>
</template>
