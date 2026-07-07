// ShaderBackground.ts — "background-paper-shaders" port (21st.dev @reuno-ui)
//
// Port of the GLSL shader from https://21st.dev/@reuno-ui/components/background-paper-shaders
// into Three.js TSL (HERMES_RULES §1: no raw ShaderMaterial in scene — TSL only).
//
// Original was React Three Fiber <shaderMaterial> with:
//   - Vertex: sine wave displacement on X/Y (paper-like undulation)
//   - Fragment: animated noise pattern, 2-color mix, radial glow, alpha fade
//
// This port uses MeshBasicNodeMaterial with:
//   - positionNode: vertex displacement (sine/cos undulation)
//   - colorNode: fragment shader (noise + color mix + glow + alpha)
//
// Rendered as a fullscreen plane BEHIND the baku cube, ON TOP of scene.background
// (the Atlas Aurora CanvasTexture). The shader has transparent edges (glow-based
// alpha) so the Aurora shows through at the edges → layered cinematic effect.
//
// Skybox-like render pattern: depthTest=false, depthWrite=false, renderOrder=-999
// (renders after scene.background clear, before baku cube at renderOrder=0).

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, vec4, float, uniform, uv, positionLocal, sin, cos, mix, pow, length, abs } from 'three/tsl'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Uniforms — driven by update() each frame
const shaderUniforms = {
  uTime: uniform(0),
  uIntensity: uniform(1.0),
  uColor1: uniform(new THREE.Color(0xff5722)),  // vivid orange (original default)
  uColor2: uniform(new THREE.Color(0xffffff)),  // white
}

// ── Vertex displacement (port of original vertexShader) ──
// pos.y += sin(pos.x * 10.0 + time) * 0.1 * intensity;
// pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.05 * intensity;
const positionNode = Fn(() => {
  const pos = positionLocal
  const t = shaderUniforms.uTime
  const intensity = shaderUniforms.uIntensity

  // Paper-like undulation — subtle X/Y displacement
  const dx = cos(pos.y.mul(8.0).add(t.mul(1.5))).mul(0.05).mul(intensity)
  const dy = sin(pos.x.mul(10.0).add(t)).mul(0.1).mul(intensity)

  return vec3(pos.x.add(dx), pos.y.add(dy), pos.z)
})

// ── Fragment shader (port of original fragmentShader) ──
// float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
// noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
// vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
// color = mix(color, vec3(1.0), pow(abs(noise), 2.0) * intensity);
// float glow = 1.0 - length(uv - 0.5) * 2.0;
// glow = pow(glow, 2.0);
// gl_FragColor = vec4(color * glow, glow * 0.8);
const colorNode = Fn(() => {
  const vUv = uv()
  const t = shaderUniforms.uTime
  const intensity = shaderUniforms.uIntensity

  // Animated noise pattern (2-octave sine/cosine lattice)
  const n1 = sin(vUv.x.mul(20.0).add(t)).mul(cos(vUv.y.mul(15.0).add(t.mul(0.8))))
  const n2 = sin(vUv.x.mul(35.0).sub(t.mul(2.0))).mul(cos(vUv.y.mul(25.0).add(t.mul(1.2)))).mul(0.5)
  const noise = n1.add(n2)

  // Mix colors based on noise and position
  let color = mix(shaderUniforms.uColor1, shaderUniforms.uColor2, noise.mul(0.5).add(0.5))
  // Bright flash on high noise
  color = mix(color, vec3(1.0), pow(abs(noise), float(2.0)).mul(intensity))

  // Radial glow — bright center, fades to transparent at edges
  const glow = pow(float(1.0).sub(length(vUv.sub(0.5)).mul(2.0)), float(2.0))

  // vec4: RGB * glow, alpha = glow * 0.8 (transparent edges → Aurora shows through)
  return vec4(color.mul(glow), glow.mul(0.8))
})

export class ShaderBackground extends THREE.Mesh {
  private _time = 0

  constructor() {
    // Large plane, subdivided (32x32) for vertex displacement.
    // Positioned at z=-20: behind baku cube (z=0), in front of scene.background.
    // Size 80x50: covers view at z=-20 with camera at z=7, FOV 50°.
    const geo = new THREE.PlaneGeometry(80, 50, 32, 32)
    const mat = new MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,    // skybox pattern: always render, never occluded
      depthWrite: false,   // don't write depth — baku cube renders on top
      fog: false,
      toneMapped: false,   // keep shader colors vivid (no ACES)
    })
    mat.positionNode = positionNode()
    mat.colorNode = colorNode()

    super(geo, mat)
    this.name = 'shader-background'
    this.position.set(0, 0, -20)
    this.frustumCulled = false  // always render (background)
    this.renderOrder = -999     // after scene.background (-1000), before baku (0)
  }

  /** Set the two gradient colors. */
  setColors(color1: THREE.Color, color2: THREE.Color): void {
    ;(shaderUniforms.uColor1.value as THREE.Color).copy(color1)
    ;(shaderUniforms.uColor2.value as THREE.Color).copy(color2)
  }

  update(dt: number): void {
    if (!prefersReducedMotion()) {
      this._time += dt
      // Pulsing intensity (original: 1.0 + sin(t * 2) * 0.3)
      shaderUniforms.uIntensity.value = 1.0 + Math.sin(this._time * 2) * 0.3
    }
    shaderUniforms.uTime.value = this._time
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
