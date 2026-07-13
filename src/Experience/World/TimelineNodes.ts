// TimelineNodes.ts — instanced spheres arranged vertically for the Process face.
//
// 4 nodes (one per process step) connected by implied vertical alignment,
// mirroring the DOM .jlz-timeline below. Each node breathes (scale pulse,
// phase-offset) so the face has a living 3D anchor — not an empty group.
//
// InstancedMesh is kept visible by SectionSceneFactory.hideGeometry()
// (the instanceof THREE.InstancedMesh branch). No keepVisible flag needed.
// On-demand: update() only runs when the section is visible + rendering.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'

const NODE_COUNT = 4
const SPACING = 1.0 // vertical gap between nodes (world units)

export class TimelineNodes extends THREE.InstancedMesh {
  private _time = 0
  private _dummy = new THREE.Object3D()

  constructor(radius: number = 0.08) {
    const geo = new THREE.IcosahedronGeometry(radius, 1) // low-poly facetted nodes
    const mat = new MeshBasicNodeMaterial({
      color: 0x6fb7d8,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      fog: false,
    })
    super(geo, mat, NODE_COUNT)
    this.name = 'timeline-nodes'
    this.frustumCulled = false

    // Initial placement (centred vertically around origin)
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = (i - (NODE_COUNT - 1) / 2) * SPACING
      this._dummy.position.set(0, y, 0)
      this._dummy.updateMatrix()
      this.setMatrixAt(i, this._dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true
  }

  update(dt: number): void {
    this._time += dt
    // Breathing pulse — each node phase-offset so they don't beat in unison
    for (let i = 0; i < NODE_COUNT; i++) {
      const y = (i - (NODE_COUNT - 1) / 2) * SPACING
      const phase = i * 0.8
      const s = 1 + Math.sin(this._time * 1.5 + phase) * 0.18
      this._dummy.position.set(0, y, 0)
      this._dummy.scale.setScalar(s)
      this._dummy.rotation.y = this._time * 0.3 + phase
      this._dummy.updateMatrix()
      this.setMatrixAt(i, this._dummy.matrix)
    }
    this.instanceMatrix.needsUpdate = true
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
