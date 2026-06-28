// CursorLight — DirectionalLight that follows cursor with spring-damper.
// Junni pattern: cursor drives a light, creating interactive highlights
// on 3D objects as user moves mouse. Subtle but adds life.
import * as THREE from 'three'
import { input } from '../Input'

export class CursorLight {
  private light: THREE.DirectionalLight
  private goalPos = new THREE.Vector3(-1, -1, -0.5)
  private currentPos = new THREE.Vector3(-1, -1, -0.5)
  private velocity = new THREE.Vector3()
  // GC-free scratch — avoids one Vector3 alloc per frame
  private _diff = new THREE.Vector3()

  constructor() {
    this.light = new THREE.DirectionalLight(0x6a8ab5, 0.8)
    this.light.position.copy(this.currentPos)
    this.light.name = 'cursor-light'
  }

  get object(): THREE.DirectionalLight {
    return this.light
  }

  update(dt: number): void {
    const mouse = input.getMouse()
    this.goalPos.set(mouse.x * 2, mouse.y * 2, -0.5)

    // Spring-damper — zero alloc
    this._diff.subVectors(this.goalPos, this.currentPos)
    this.velocity.addScaledVector(this._diff, dt * 2.5)
    this.velocity.multiplyScalar(0.85)
    this.currentPos.add(this.velocity)

    this.light.position.copy(this.currentPos)
  }

  dispose(): void {
    this.light.dispose()
  }
}
