<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { ServicesStage } from '../../Experience/World/ServicesStage'

const emit = defineEmits<{ ready: [stage: ServicesStage] }>()
const context = useTresContext()
const stage = shallowRef<ServicesStage | null>(null)

onMounted(() => {
  const owner = new ServicesStage()
  context.scene.value.add(owner)
  stage.value = owner
  emit('ready', owner)
})

onBeforeUnmount(() => {
  const owner = stage.value
  if (!owner) return
  owner.dispose()
  stage.value = null
})
</script>

<template><TresGroup name="services-stage-owner-anchor" /></template>
