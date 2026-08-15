import { createApp, type Component } from 'vue'
import TresPlugin, { extend } from '@tresjs/core'
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three'

extend({ BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera })

export function mountTresProbe(component: Component): void {
  createApp(component).use(TresPlugin).mount('#app')
}
