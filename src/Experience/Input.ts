// src/Experience/Input.ts
import * as THREE from 'three'

export class Input {
  static instance: Input

  mouse: THREE.Vector2 = new THREE.Vector2()

  // Bound handler ref so removeEventListener works in destroy().
  private readonly _onMouseMove = (event: MouseEvent) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  constructor() {
    if (Input.instance) return Input.instance
    Input.instance = this

    window.addEventListener('mousemove', this._onMouseMove, { passive: true })
  }

  /** Remove window listeners. Call from Experience.destroy(). */
  destroy(): void {
    window.removeEventListener('mousemove', this._onMouseMove)
    // Clear singleton ref so a fresh Input can be constructed after HMR.
    if (Input.instance === this) Input.instance = undefined as unknown as Input
  }

  getMouse() {
    return this.mouse
  }
}

export const input = new Input()
