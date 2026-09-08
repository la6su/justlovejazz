<script setup lang="ts">
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, shallowRef, toRaw } from 'vue'
import { ServicesStage } from '../../Experience/World/ServicesStage'

const props = defineProps<{ stage: ServicesStage }>()
const root = shallowRef<THREE.Group | null>(null)
const boxGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.08)
const ringGeometry = new THREE.TorusGeometry(1, 0.012, 8, 64)
const parts: THREE.Mesh[] = []
const rings: THREE.Mesh[] = []

onMounted(() => {
  const stage = toRaw(props.stage)
  const group = toRaw(root.value)
  if (!group) return
  for (let i = 0; i < 7; i++) {
    const part = new THREE.Mesh(boxGeometry, i === 3 ? stage.signalMaterial : stage.metalMaterial)
    parts.push(part)
    group.add(part)
  }
  const ringConfigs = [[1.5, 0.3, 0], [2.2, -0.5, 0.4], [2.8, 0.8, -0.3]] as const
  ringConfigs.forEach(([radius, rotX, rotZ], index) => {
    const ring = new THREE.Mesh(ringGeometry, stage.orbitMaterials[index]!)
    ring.scale.setScalar(radius)
    ring.rotation.set(rotX, 0, rotZ)
    ring.position.z = -1
    ring.name = `services-orbit-${index}`
    rings.push(ring)
    group.add(ring)
  })
  stage.adopt({ parts, rings })
})

onBeforeUnmount(() => {
  boxGeometry.dispose()
  ringGeometry.dispose()
  parts.length = 0
  rings.length = 0
})
</script>

<template>
  <TresGroup ref="root" name="services-stage-geometry" :dispose="null" />
</template>
