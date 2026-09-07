<script setup lang="ts">
import type { WorksPlaneStage } from '../../Experience/World/WorksPlaneStage'

defineProps<{ stage: WorksPlaneStage | null }>()
</script>

<template>
  <!-- WorksPlaneStage remains the sole route-lazy TSL/texture/motion owner. -->
  <primitive v-if="stage" :object="stage" :dispose="null" />
</template>
