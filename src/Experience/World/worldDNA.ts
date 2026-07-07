// worldDNA.ts — Persistent world shader (TSL) for the baku cube.
//
// A single TSL Fn() attaches to MeshPhysicalNodeMaterial via:
//   material.positionNode — organic vertex displacement (fluid-like)
//   material.colorNode   — section-driven color blend + iridescent shimmer
//   material.emissiveNode — section-driven emissive blend + rim glow
//   material.roughnessNode — noise-modulated roughness
//
// Section state is fed via uniforms (updated by SplashCube.updateMaterial):
//   uSectionBlend  — 0..1 blend between section colors
//   uColorA / uColorB — adjacent section colors
//   uTime          — elapsed time (for animation)
//   uDisplace      — displacement amplitude (0 = static, 1 = strong)
//
// PREMIUM PATH GATING (IMPROVEMENT_PLAN A1):
// TSL node overrides are attached ONLY when DeviceCapability.isRealWebGPU
// is true (real WebGPU on real hardware). On WebGL2 / WebGLBackend-fallback
// paths, SplashCube uses a plain MeshPhysicalMaterial and attachWorldDNA
// is a no-op — material props are driven from JS (parity path).
//
// OPACITY SAFETY (verified in three r0.184 NodeMaterial.js:843,878):
//   let colorNode = this.colorNode ? vec4( this.colorNode ) : materialColor;
//   diffuseColor.a.assign( diffuseColor.a.mul( opacityNode ) );
// When colorNode returns vec3, vec4(vec3) sets w=1.0, then a *= materialOpacity.
// → opacity works correctly. The old "TSL nodes break opacity" comment was
// a stale bug from an earlier three version. All 4 nodes are safe to attach.

import { Fn, vec3, float, uniform, positionLocal, normalLocal, normalWorld, positionWorld, cameraPosition, mx_noise_float, mix, sin, cos, pow } from 'three/tsl'
import * as THREE from 'three'

// Uniforms — shared across all face materials (set once, mutated per section)
export const worldDNAUniforms = {
  uSectionBlend: uniform(0),
  uColorA: uniform(new THREE.Color(0x3a3a5e)),
  uColorB: uniform(new THREE.Color(0x3a3a5e)),
  uEmissiveA: uniform(new THREE.Color(0x5a5a8a)),
  uEmissiveB: uniform(new THREE.Color(0x5a5a8a)),
  uTime: uniform(0),
  uDisplace: uniform(0.15),
  uPulse: uniform(0),
  // Audio-reactive uniforms (driven by AudioSystem)
  uAudioBass: uniform(0),
  uAudioTreble: uniform(0),
}

// Vertex displacement — organic fluid-like deformation via noise.
// Moves vertices along their normal by a noise field modulated by time.
// Returns vec3 (new position) — safe for positionNode, does not touch fragment alpha.
export const worldPositionNode = Fn(() => {
  const t = worldDNAUniforms.uTime
  const pos = positionLocal
  const nrm = normalLocal

  // Multi-octave noise for organic feel — two frequencies layered
  const n1 = mx_noise_float(pos.mul(2.0).add(vec3(t.mul(0.3), 0, 0)))
  const n2 = mx_noise_float(pos.mul(4.0).add(vec3(0, t.mul(0.5), 0)))
  const noise = n1.mul(0.7).add(n2.mul(0.3))

  // Pulse (opener animation) expands vertices outward
  const pulse = worldDNAUniforms.uPulse

  // Displace along normal — noise + pulse + audio-reactive bass kick.
  // The displacement is what gives the cube its "breathing / fluid" vibe.
  // Audio-bass kicks the cube on low frequencies → makes "jazz" brand real.
  const audioKick = worldDNAUniforms.uAudioBass.mul(0.15)
  const displace = noise.mul(worldDNAUniforms.uDisplace).add(pulse.mul(0.3)).add(audioKick)
  return pos.add(nrm.mul(displace))
})

// Color node — section-driven color blend + fresnel iridescence + position shimmer.
// Returns vec3 (RGB). Opacity is applied separately by NodeMaterial
// (diffuseColor.a = 1.0 * materialOpacity) — verified safe, see file header.
//
// 21st.dev glass look (3 layers):
//   1. Base color: section blend (colorA → colorB)
//   2. Fresnel iridescence: rainbow shift at edges (where normal ⊥ view).
//      Uses dot(normalWorld, viewDir) — varies across EACH face because viewDir
//      changes from center to edge. This is the KEY fix: normalLocal is constant
//      per cube face (flat faces), so any shader based on it is uniform. Fresnel
//      uses view direction → varies across the face → visible rainbow edges.
//   3. Position shimmer: sin/cos of positionLocal → varies across face surface.
//      Subtle hue modulation that makes the glass feel "alive" (like oil film).
export const worldColorNode = Fn(() => {
  const blend = worldDNAUniforms.uSectionBlend
  const baseColor = mix(worldDNAUniforms.uColorA, worldDNAUniforms.uColorB, blend)

  // ── Fresnel: 0 at face center (facing camera), 1 at silhouette edges ──
  const viewDir = cameraPosition.sub(positionWorld).normalize()
  const fresnel = normalWorld.dot(viewDir).oneMinus()      // 1 - dot(N, V)
  const fresnelEdge = pow(fresnel, float(2.0))              // sharpen to edges

  // ── Iridescent rainbow at edges (the 21st.dev signature look) ──
  // Spectrum ramp based on fresnel + view angle. sin/cos of fresnel gives
  // a smooth rainbow shift: R→G→B as the angle increases.
  const t = worldDNAUniforms.uTime
  const rainbowPhase = fresnelEdge.mul(3.0).add(t.mul(0.3))
  const irR = sin(rainbowPhase).mul(0.5).add(0.5)
  const irG = sin(rainbowPhase.add(float(2.094))).mul(0.5).add(0.5)   // +120°
  const irB = sin(rainbowPhase.add(float(4.189))).mul(0.5).add(0.5)   // +240°
  const iridescence = vec3(irR, irG, irB)
  // Blend iridescence into base color at edges (fresnelEdge = 0 at center → no shift)
  let color = mix(baseColor, iridescence, fresnelEdge.mul(0.4))

  // ── Position shimmer (oil-film modulation across the face) ──
  // positionLocal varies across each face (not constant like normalLocal).
  // Two sine waves at different frequencies + axes → organic hue drift.
  const pos = positionLocal
  const shimmer = sin(pos.x.mul(4.0).add(t.mul(0.5)))
    .mul(0.5)
    .add(cos(pos.y.mul(3.0).sub(t.mul(0.4))).mul(0.5))
  // Add subtle shimmer to color (amplitude 0.08 — visible but not garish)
  color = color.add(vec3(shimmer.mul(0.08), shimmer.mul(0.05), shimmer.mul(0.10)))

  // ── Audio-reactive treble → shimmer boost ──
  color = color.add(vec3(worldDNAUniforms.uAudioTreble.mul(0.15)))

  return color
})

// Emissive node — section-driven emissive blend + FRESNEL rim glow.
// Returns vec3 — safe for emissiveNode (alpha not touched).
//
// The rim glow uses fresnel (not normalLocal.z) so it's visible on ALL face
// edges, not just the Z-perpendicular ones. Amplitude 0.5 (was 0.1) — this is
// the "lit from within" glass halo, the most visible 21st-style effect.
export const worldEmissiveNode = Fn(() => {
  const blend = worldDNAUniforms.uSectionBlend
  const baseEmissive = mix(worldDNAUniforms.uEmissiveA, worldDNAUniforms.uEmissiveB, blend)

  // Fresnel rim — bright at silhouette edges, dark at face center
  const viewDir = cameraPosition.sub(positionWorld).normalize()
  const fresnel = normalWorld.dot(viewDir).oneMinus()
  const rim = pow(fresnel, float(1.5))    // 0 at center, 1 at edge, softened

  // Rim color: shift hue with time for iridescent edge glow (not just white)
  const t = worldDNAUniforms.uTime
  const rimR = sin(t.mul(0.5)).mul(0.3).add(0.7)
  const rimG = sin(t.mul(0.5).add(float(2.094))).mul(0.3).add(0.7)
  const rimB = sin(t.mul(0.5).add(float(4.189))).mul(0.3).add(0.7)
  const rimColor = vec3(rimR, rimG, rimB)

  return baseEmissive.add(rimColor.mul(rim.mul(0.5)))
})

// Roughness node — noise-modulated for varied surface response.
// Returns float — safe for roughnessNode (alpha not touched).
// Very low base (0.03) + subtle noise (±0.02) = 0.03-0.05 range.
// This gives razor-sharp glass reflections with tiny imperfections.
// Higher values would blur the env-map reflections and lose the glass look.
export const worldRoughnessNode = Fn(() => {
  const n = mx_noise_float(positionLocal.mul(3.0))
  return n.mul(0.02).add(0.03)
})

// Type alias for the node-material shape we attach to.
// Duck-typed via `isMeshPhysicalNodeMaterial` — no hard type import needed,
// so this file stays decoupled from `three/webgpu` (keeps parity-path clean).
interface NodeMaterialLike {
  isMeshPhysicalNodeMaterial?: boolean
  positionNode?: unknown
  colorNode?: unknown
  emissiveNode?: unknown
  roughnessNode?: unknown
}

/**
 * Attach worldDNA TSL nodes to a material. Call once per material.
 *
 * PREMIUM PATH (IMPROVEMENT_PLAN A1):
 * On real WebGPU (DeviceCapability.isRealWebGPU === true) the material passed
 * in is a MeshPhysicalNodeMaterial — we attach all 4 TSL nodes (position,
 * color, emissive, roughness). The cube gets vertex displacement, iridescent
 * shimmer, rim glow, and noise-modulated roughness. Audio-reactive uniforms
 * (uAudioBass, uAudioTreble) drive the displacement + shimmer → the "jazz"
 * brand becomes real.
 *
 * PARITY PATH (WebGL2 / WebGLBackend fallback):
 * The material is a plain MeshPhysicalMaterial (no `isMeshPhysicalNodeMaterial`).
 * This function is a no-op — material.color/emissive/roughness are driven
 * from JS (SplashCube.update) on every frame. Visual outcome is the same
 * minus the GPU-side displacement + shimmer. This is acceptable: parity path
 * users get a clean glass cube, premium-path users get the full vibe.
 */
export function attachWorldDNA(mat: THREE.MeshPhysicalMaterial): void {
  const nodeMat = mat as unknown as NodeMaterialLike
  if (!nodeMat.isMeshPhysicalNodeMaterial) {
    // Parity path — no TSL nodes, JS-driven material props (as before).
    return
  }
  // Premium path — attach TSL nodes. Each call to worldXxxNode() creates a
  // fresh node-graph instance; uniforms are shared (module-level worldDNAUniforms).
  nodeMat.positionNode = worldPositionNode()
  nodeMat.colorNode = worldColorNode()
  nodeMat.emissiveNode = worldEmissiveNode()
  nodeMat.roughnessNode = worldRoughnessNode()
}

/** Update audio-reactive uniforms. Called by Experience.update each frame. */
export function updateWorldDNAAudio(bass: number, _mid: number, treble: number): void {
  worldDNAUniforms.uAudioBass.value = bass
  worldDNAUniforms.uAudioTreble.value = treble
}

/** Update worldDNA uniforms from section state. Called by SplashCube.updateMaterial. */
export function updateWorldDNA(params: {
  sectionBlend: number
  colorA: THREE.Color
  colorB: THREE.Color
  emissiveA: THREE.Color
  emissiveB: THREE.Color
  time: number
  displace: number
  pulse: number
}): void {
  worldDNAUniforms.uSectionBlend.value = params.sectionBlend
  ;(worldDNAUniforms.uColorA.value as THREE.Color).copy(params.colorA)
  ;(worldDNAUniforms.uColorB.value as THREE.Color).copy(params.colorB)
  ;(worldDNAUniforms.uEmissiveA.value as THREE.Color).copy(params.emissiveA)
  ;(worldDNAUniforms.uEmissiveB.value as THREE.Color).copy(params.emissiveB)
  worldDNAUniforms.uTime.value = params.time
  worldDNAUniforms.uDisplace.value = params.displace
  worldDNAUniforms.uPulse.value = params.pulse
}
