import * as THREE from 'three'

/**
 * Cheap fullscreen gradient background — replaces expensive star particle field.
 * Single quad, zero per-frame CPU. No animation, no updates.
 */
export class GradientBackground {
  private _mesh: THREE.Mesh

  constructor(colorTop: THREE.Color = new THREE.Color(0x050510), colorBottom: THREE.Color = new THREE.Color(0x0a0a1a)) {
    // Fullscreen quad — always covers view
    const geo = new THREE.PlaneGeometry(2, 2, 1, 1)

    // Vertex shader gradient — zero texture, zero overdraw
    const mat = new THREE.ShaderMaterial({
      transparent: false,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
      uniforms: {
        uColorTop: { value: colorTop },
        uColorBottom: { value: colorBottom },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorTop;
        uniform vec3 uColorBottom;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(uColorBottom, uColorTop, vUv.y), 1.0);
        }
      `,
    })

    this._mesh = new THREE.Mesh(geo, mat)
    // Billboard — always faces camera
    this._mesh.renderOrder = -1
    // Fullscreen quad always visible — skip frustum test
    this._mesh.frustumCulled = false
  }

  get mesh(): THREE.Mesh {
    return this._mesh
  }

  dispose(): void {
    this._mesh.geometry.dispose()
    const mat = this._mesh.material as THREE.ShaderMaterial
    mat.dispose()
  }
}
