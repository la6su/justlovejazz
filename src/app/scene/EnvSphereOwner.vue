<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { EnvSphere } from '../../Experience/World/EnvSphere'

const emit = defineEmits<{ ready: [owner: EnvSphere] }>()
const context = useTresContext()
const owner = shallowRef<EnvSphere | null>(null)

onMounted(() => {
  const sphere = new EnvSphere(false)
  context.scene.value.add(sphere)
  owner.value = sphere
  emit('ready', sphere)
})

onBeforeUnmount(() => {
  owner.value?.dispose()
  owner.value = null
})
</script>

<template><TresGroup name="env-sphere-owner-anchor" /></template>
