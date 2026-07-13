// PlayButton3D.ts — TSL shader play button in front of the glass cube.
//
// A ring (RingGeometry) with TSL MeshBasicNodeMaterial that renders a
// glass-morphism play button: glowing ring + play triangle + pulse animation.
// Positioned at z=+0.5 (in front of cube which is 0.8 wide, so 0.4 is the face).
// Click detection via raycasting → opens ShowreelModal.
//
// Only visible on intro section (section 1). Hidden on other sections.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, uniform, uv, float, vec3, vec4, sin, smoothstep, abs, length, mix } from 'three/tsl'
import { DeviceCapability } from '../../core/DeviceCapability'

export class PlayButton3D extends THREE.Mesh {
  private _uTime = uniform(0)
  private _uVisible = uniform(0)
  private _uHover = uniform(0)
  private _raycaster = new THREE.Raycaster()
  private _ndc = new THREE.Vector2()

  constructor() {
    // Ring geometry: inner 0.12, outer 0.18 — sits in front of cube face
    const geo = new THREE.RingGeometry(0.12, 0.18, 64)
    geo.rotateX(-Math.PI / 2)

    // Create material BEFORE super() — use local uniforms, assign to class after
    const uTime = uniform(0)
    const uVisible = uniform(0)
    const uHover = uniform(0)

    const isWebGPU = DeviceCapability.getInstance().isRealWebGPU
    let material: THREE.Material

    if (isWebGPU) {
      const mat = new MeshBasicNodeMaterial()
      mat.transparent = true
      mat.depthWrite = false
      mat.depthTest = false
      mat.side = THREE.DoubleSide

      // TSL shader: glass ring + play triangle + pulse glow
      mat.colorNode = Fn(() => {
        const vUv = uv()
        const cx = float(0.5).sub(vUv.x)
        const cy = float(0.5).sub(vUv.y)
        const dist = length(vec3(cx, cy, float(0)))

        const ringDist = abs(dist.sub(float(0.35)))
        const ringGlow = smoothstep(float(0.15), float(0.0), ringDist)

        const pulse = sin(uTime.mul(2.0)).mul(0.5).add(0.5)
        const pulseGlow = pulse.mul(float(0.3))

        const triDist = length(vec3(vUv.x.sub(0.46), vUv.y.sub(0.5).mul(1.2), float(0)))
        const tri = smoothstep(float(0.08), float(0.04), triDist)

        const hoverBoost = uHover.mul(float(0.3))

        const ringColor = vec3(0.77, 1.0, 0.0)
        const triColor = vec3(1.0, 1.0, 1.0)
        const bgColor = vec3(0.0, 0.0, 0.0)

        const ringAlpha = ringGlow.add(pulseGlow).add(hoverBoost).mul(uVisible)
        const triAlpha = tri.mul(uVisible)

        const color = mix(bgColor, ringColor, ringGlow.add(pulseGlow).add(hoverBoost))
        const finalColor = mix(color, triColor, tri)

        return vec4(finalColor, ringAlpha.max(triAlpha))
      })()

      material = mat as unknown as THREE.Material
    } else {
      material = new THREE.MeshBasicMaterial({
        color: 0xc4ff00,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      })
    }

    super(geo, material)
    this.name = 'play-button-3d'
    this.position.set(0, 0, 0.5)
    this.renderOrder = 10
    this.frustumCulled = false
    // Assign local uniforms to class properties (after super)
    this._uTime = uTime
    this._uVisible = uVisible
    this._uHover = uHover
  }

  /** Set visibility (fade in/out via uniform). */
  setVisible(visible: boolean): void {
    ;(this._uVisible as unknown as { value: number }).value = visible ? 1 : 0
    this.visible = visible
  }

  /** Set hover state (boost glow). */
  setHover(hover: boolean): void {
    ;(this._uHover as unknown as { value: number }).value = hover ? 1 : 0
  }

  /** Update time uniform. */
  update(dt: number): void {
    ;(this._uTime as unknown as { value: number }).value += dt
  }

  /** Check if a screen point (NDC) hits this button. */
  hitTest(ndcX: number, ndcY: number, camera: THREE.Camera): boolean {
    if (!this.visible) return false
    this._ndc.set(ndcX, ndcY)
    this._raycaster.setFromCamera(this._ndc, camera)
    const intersects = this._raycaster.intersectObject(this, false)
    return intersects.length > 0
  }

  dispose(): void {
    this.geometry.dispose()
    if (Array.isArray(this.material)) {
      this.material.forEach(m => m.dispose())
    } else {
      this.material.dispose()
    }
  }
}
