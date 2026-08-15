import { createApp } from 'vue'
import TresPlugin, { extend } from '@tresjs/core'
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three'
import ManualModeProbe from './ManualModeProbe.vue'

extend({ BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera })

createApp(ManualModeProbe).use(TresPlugin).mount('#app')
