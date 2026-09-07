<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import {
  Vector3,
  type DirectionalLight,
  type Group,
  type HemisphereLight,
  type PointLight,
} from 'three'
import type { CinematicLightsNodes } from '../../Experience/World/Lights'

type DeclarativeCinematicLights = CinematicLightsNodes

const emit = defineEmits<{
  ready: [lights: DeclarativeCinematicLights]
  dispose: []
}>()

const group = shallowRef<Group | null>(null)
const key = shallowRef<DirectionalLight | null>(null)
const fill = shallowRef<DirectionalLight | null>(null)
const rim = shallowRef<DirectionalLight | null>(null)
const volumetric = shallowRef<PointLight | null>(null)
const hemisphere = shallowRef<HemisphereLight | null>(null)
const keyPosition = markRaw(new Vector3(4, 6, 4))
const fillPosition = markRaw(new Vector3(-4, 2, 1))
const rimPosition = markRaw(new Vector3(0, 2, -4))
const volumetricPosition = markRaw(new Vector3(0, 1.5, 0))

onMounted(() => {
  if (
    !group.value ||
    !key.value ||
    !fill.value ||
    !rim.value ||
    !volumetric.value ||
    !hemisphere.value
  )
    throw new Error('Declarative cinematic lights did not mount completely.')
  emit('ready', {
    group: group.value,
    key: key.value,
    fill: fill.value,
    rim: rim.value,
    volumetric: volumetric.value,
    hemisphere: hemisphere.value,
  })
})

onBeforeUnmount(() => emit('dispose'))
</script>

<template>
  <TresGroup ref="group" name="cinematic-lights">
    <TresDirectionalLight
      ref="key"
      name="cinematic-key"
      :color="0xffffff"
      :intensity="0.8"
      :position="keyPosition"
    />
    <TresDirectionalLight
      ref="fill"
      name="cinematic-fill"
      :color="0xd0d8e8"
      :intensity="0.3"
      :position="fillPosition"
    />
    <TresDirectionalLight
      ref="rim"
      name="cinematic-rim"
      :color="0xb0c0d8"
      :intensity="0.6"
      :position="rimPosition"
    />
    <TresPointLight
      ref="volumetric"
      name="cinematic-volumetric"
      :color="0xffffff"
      :intensity="0"
      :distance="14"
      :position="volumetricPosition"
    />
    <TresHemisphereLight
      ref="hemisphere"
      name="cinematic-hemisphere"
      :sky-color="0xffffff"
      :ground-color="0xe8e8e8"
      :intensity="0.2"
    />
  </TresGroup>
</template>
