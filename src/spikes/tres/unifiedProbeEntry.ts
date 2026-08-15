import { createApp } from 'vue'
import TresPlugin, { extend } from '@tresjs/core'
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three'
import UnifiedRendererProbe from './UnifiedRendererProbe.vue'

extend({ BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera })

createApp(UnifiedRendererProbe).use(TresPlugin).mount('#app')
