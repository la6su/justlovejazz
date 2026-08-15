<script setup lang="ts">
import { computed, ref } from 'vue'
import { TresCanvas } from '@tresjs/core'

const visits = ref(0)
const rendererBinding = computed(() => (TresCanvas ? 'available' : 'missing'))
</script>

<template>
  <section data-phase-one-probe :data-tres-canvas="rendererBinding">
    <p>Vue/Tres phase-one probe</p>
    <button type="button" @click="visits += 1">Probe {{ visits }}</button>
  </section>
</template>
