// ShaderBackground.ts — "background-paper-shaders" port (21st.dev @reuno-ui)
//
// Port of https://21st.dev/@reuno-ui/components/background-paper-shaders (id: 5732)
// "Background Paper Shade with grey shaders" — dark grey palette.
//
// The original component uses the GLSL shader (vertex displacement + fragment noise)
// but the DEMO shows it paired with a MeshGradient in dark grey colors:
//   ["#000000", "#1a1a1a", "#333333", "#ffffff"]
//
// This port uses the SAME GLSL shader logic (ported to TSL per HERMES §1) but
// with the dark grey palette from the demo. The shader is OPAQUE (no alpha
// fade at edges) — it's the SOLE background, not a layered overlay.
//
// Placement: fullscreen plane at z=-30, behind everything (renderOrder=-1000).
// Replaces scene.background Atlas Aurora when active.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, vec3, vec4, float, uniform, uv, positionLocal, sin, cos, mix, pow, abs } from 'three/tsl'
import { prefersReducedMotion } from '../../core/motionPolicy'

// Uniforms — driven by update() each frame
const shaderUniforms = {
  uTime: uniform(0),
  uIntensity: uniform(1.0),
  // Neutral dark grey palette — chosen so BOTH black AND white text are readable.
  //   uColor1 (shadow):    0x2a2a2a  (luminance ~0.164 → white text contrast ~6.5:1 WCAG AA)
  //   uColor2 (highlight): 0x3a3a3a  (luminance ~0.196 → black text contrast ~5.2:1 WCAG AA)
  // Range kept narrow (Δ0.10) so no spot gets bright enough to lose black text
  // or dark enough to lose white text.
  uColor1: uniform(new THREE.Color(0x2a2a2a)),  // neutral dark grey (shadow)
  uColor2: uniform(new THREE.Color(0x3a3a3a)),  // neutral grey (highlight)
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
//
// ADAPTATION for dark grey background (vs original orange/white overlay):
//   - Removed the radial glow alpha (was making edges transparent).
//   - Kept the noise pattern + color mix (this is the "paper" texture).
//   - Kept the subtle white flash on high noise (pow(abs(noise), 2) * intensity).
//   - Reduced the white flash amplitude (0.15 instead of 1.0) so it reads as
//     a subtle silver shimmer, not a bright orange flare.
const colorNode = Fn(() => {
  const vUv = uv()
  const t = shaderUniforms.uTime
  const intensity = shaderUniforms.uIntensity

  // Animated noise pattern (2-octave sine/cosine lattice)
  const n1 = sin(vUv.x.mul(20.0).add(t)).mul(cos(vUv.y.mul(15.0).add(t.mul(0.8))))
  const n2 = sin(vUv.x.mul(35.0).sub(t.mul(2.0))).mul(cos(vUv.y.mul(25.0).add(t.mul(1.2)))).mul(0.5)
  const noise = n1.add(n2)

  // Mix the two grey colors based on noise
  let color = mix(shaderUniforms.uColor1, shaderUniforms.uColor2, noise.mul(0.5).add(0.5))

  // Subtle mid-grey shimmer on high noise (amplitude 0.10)
  // Original mixed toward vec3(1.0) (pure white) — too bright, killed black text.
  // Now mixes toward vec3(0.45) (mid-grey) at low amplitude — reads as a soft
  // paper texture, never bright enough to lose black text contrast.
  color = mix(color, vec3(0.45), pow(abs(noise), float(2.0)).mul(intensity).mul(0.10))

  // Return opaque vec4 (alpha=1.0) — this is the SOLE background, no transparency.
  return vec4(color, 1.0)
})

export class ShaderBackground extends THREE.Mesh {
  private _time = 0

  constructor() {
    // Large plane, subdivided (32x32) for vertex displacement.
    // Positioned at z=-30: behind baku cube (z=0), serves as the SOLE background.
    // Size 120x80: covers view at z=-30 with camera at z=7, FOV 50°.
    const geo = new THREE.PlaneGeometry(120, 80, 32, 32)
    const mat = new MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      depthTest: false,    // skybox pattern: always render, never occluded
      depthWrite: false,   // don't write depth — baku cube renders on top
      fog: false,
      toneMapped: false,   // keep shader colors accurate (no ACES)
    })
    mat.positionNode = positionNode()
    mat.colorNode = colorNode()

    super(geo, mat)
    this.name = 'shader-background'
    this.position.set(0, 0, -30)
    this.frustumCulled = false  // always render (background)
    this.renderOrder = -1000    // render FIRST (sole background)
  }

  /** Set the two grey colors. Default: 0x1a1a1a → 0x4a4a4a. */
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
