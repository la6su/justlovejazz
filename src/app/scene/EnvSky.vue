<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import type { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'

const props = defineProps<{ material: MeshBasicMaterial }>()
const emit = defineEmits<{ ready: [mesh: Mesh<PlaneGeometry, MeshBasicMaterial>] }>()
const mesh = shallowRef<Mesh<PlaneGeometry, MeshBasicMaterial> | null>(null)

onMounted(() => {
  if (!mesh.value) throw new Error('Declarative environment sky did not mount.')
  emit('ready', mesh.value)
})
</script>

<template>
  <TresMesh
    ref="mesh"
    name="pavilion-sky"
    :material="props.material"
    :position="[0, 0, -44]"
    :render-order="-1001"
    :frustum-culled="false"
  >
    <TresPlaneGeometry :args="[140, 96]" />
  </TresMesh>
</template>
