import * as THREE from 'three'
import vert from './shaders/holoblob.vert'
import frag from './shaders/holoblob.frag'

/**
 * Holoblob — iridescent blob with custom vertex/fragment shaders.
 * Uses built-in Three.js ShaderMaterial.
 *
 * WebGPU note: ShaderMaterial is NOT compatible with WebGPU renderer, so this
 * component is skipped on WebGPU (guarded at the factory call site).
 */
export class Holoblob {
  public mesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  public updateFn: (dt: number, t: number) => void

  constructor(radius: number, position: THREE.Vector3, opacity: number = 0.6) {
    const geometry = new THREE.IcosahedronGeometry(radius, 3)

    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        time: { value: 0 },
        uOpacity: { value: opacity },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.position.copy(position)

    this.updateFn = (dt: number, _t: number) => {
      this.material.uniforms.time.value += dt
    }
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
  }
}
