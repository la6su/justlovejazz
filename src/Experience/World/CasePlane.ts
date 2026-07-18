// CasePlane — shared 3D project surface for Works.
//
// It is intentionally a real plane (not a CSS card). BakuCarousel gives it a
// drag velocity; the TSL vertex field turns that velocity into a brief bend
// across the physical surface. This keeps the slider expressive without
// rotating the cards as objects or relying on a screen-space post effect.
//
// UNIFORM OPTIMISATION: `time` is shared at module level (all planes read the
// same clock). Per-plane state (transition, reveal, wobble, etc.) is packed
// into a single vec3 uniform `uState` to stay under the WebGL uniform-group
// limit (~12-16 per material). 14 CasePlane instances × 9 uniforms = 126
// groups → crash. 14 × 2 (time + uState) = 28 groups → safe.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  float,
  mix,
  positionLocal,
  sin,
  cos,
  atan,
  smoothstep,
  sqrt,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  PI,
} from 'three/tsl'

// Shared clock — one uniform for ALL CasePlane instances (not per-instance).
const sharedTime = uniform(0)

export class CasePlane extends THREE.Mesh {
  // Per-plane state packed into a single vec3 uniform to reduce uniform count.
  // x = transition (0..1), y = reveal (0..1), z = wobble (0..1)
  private readonly _state: { value: THREE.Vector3 }
  // Secondary state packed into another vec3: x = motion, y = edgeWarp, z = crt
  private readonly _state2: { value: THREE.Vector3 }
  // Tertiary: x = parallax, y = direction (1 or -1)
  private readonly _state3: { value: THREE.Vector2 }
  private _wobbleValue = 0
  private _wobbleTarget = 0
  private _motionValue = 0
  private _motionTarget = 0
  private _motionDirection = 1
  private _edgeWarpValue = 0
  private _edgeWarpTarget = 0
  private _crtValue = 0

  constructor(mapTexture: THREE.Texture) {
    // Packed uniforms — 3 uniform nodes total per instance (was 9).
    const uState = uniform(new THREE.Vector3(0, 0, 0))     // transition, reveal, wobble
    const uState2 = uniform(new THREE.Vector3(0, 0, 0))    // motion, edgeWarp, crt
    const uState3 = uniform(new THREE.Vector2(0, 1))       // parallax, direction

    const planeHeight = 9 / 16
    const planeAspect = 16 / 9
    const textureImage = mapTexture.image as { width?: number; height?: number } | undefined
    const textureAspect =
      textureImage?.width && textureImage?.height
        ? textureImage.width / textureImage.height
        : planeAspect
    const uvScaleX = textureAspect > planeAspect ? planeAspect / textureAspect : 1
    const uvScaleY = textureAspect < planeAspect ? textureAspect / planeAspect : 1
    const geometry = new THREE.PlaneGeometry(1, planeHeight, 24, 16)
    const material = new MeshBasicNodeMaterial({
      map: mapTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    })

    // Unpack per-plane state from packed uniforms
    const transition = uState.x
    const reveal = uState.y
    const wobble = uState.z
    const motion = uState2.x
    const edgeWarp = uState2.y
    const crt = uState2.z
    const parallax = uState3.x
    const direction = uState3.y
    const time = sharedTime

    // A brief CRT-on pulse belongs to the physical case plane, avoiding a
    // second DOM-only flash during the fullscreen handoff.
    material.colorNode = Fn(() => {
      const screenUv = uv()
      const imageUv = screenUv
        .sub(vec2(float(0.5)))
        .mul(vec2(float(uvScaleX * 0.82), float(uvScaleY * 0.96)))
        .add(vec2(parallax.mul(0.075), float(0)))
        .add(vec2(float(0.5)))
      const base = texture(mapTexture, imageUv)
      const scanline = sin(screenUv.y.mul(420).add(time.mul(54)))
        .mul(0.085)
        .add(0.915)
      const crtColor = base.rgb
        .mul(scanline)
        .add(vec3(float(0.045), float(0.06), float(0.03)).mul(crt))

      // ── Film Burn (Arrlindii-inspired, multi-source) ──
      // Reference: github.com/Arrlindii/Shader-Image-Transition
      // Pattern: multiple noise-warped circle SDFs at different positions +
      // angular noise warp + radial circles → organic multi-source burn.
      //
      // Key difference from previous single-center burn: 4 separate burn
      // sources at different screen positions, each with its own noise warp
      // and timing offset. The burn fronts merge organically via max().

      // Angular noise — warps burn radius for all sources (shared warp function)
      const angle = atan(screenUv.y.sub(0.5).div(screenUv.x.sub(0.5)))
      const angNoise = cos(angle.mul(3.0).add(transition.mul(PI))).add(1.0).mul(0.5)
        .add(sin(angle.mul(5.0).add(time.mul(0.3))).add(1.0).mul(0.5).mul(0.3))
      const burnWarp = angNoise.mul(0.12)

      // Cubic ease-in — burn starts slow, accelerates
      const tEase = transition.mul(transition).mul(transition)
      const burnPulse = sin(transition.mul(PI)).clamp(0, 1)

      // ── 4 burn sources at different positions (Arrlindii multi-source pattern) ──
      // Each source has: position, noise offset, timing offset, scale
      // Source A — upper-left, ignites first
      const distA = screenUv.sub(vec2(float(0.18), float(0.72))).length().add(burnWarp.mul(0.8))
      const frontA = tEase.mul(1.3).sub(0.1)
      const burnA = smoothstep(frontA.sub(0.04), frontA.add(0.02), distA).oneMinus()

      // Source B — lower-right, ignites second
      const distB = screenUv.sub(vec2(float(0.78), float(0.25))).length().add(burnWarp.mul(0.6))
      const frontB = tEase.mul(1.15).sub(0.18)
      const burnB = smoothstep(frontB.sub(0.04), frontB.add(0.02), distB).oneMinus()

      // Source C — center, ignites third (main burn)
      const distC = screenUv.sub(vec2(float(0.5), float(0.5))).length().add(burnWarp)
      const frontC = tEase.mul(1.0).sub(0.05)
      const burnC = smoothstep(frontC.sub(0.04), frontC.add(0.02), distC).oneMinus()

      // Source D — upper-right, ignites last
      const distD = screenUv.sub(vec2(float(0.72), float(0.68))).length().add(burnWarp.mul(0.7))
      const frontD = tEase.mul(1.2).sub(0.28)
      const burnD = smoothstep(frontD.sub(0.04), frontD.add(0.02), distD).oneMinus()

      // Radial circles — 3 jagged burn sources at 120° offsets (Arrlindii pattern)
      const radialOffset = float(0.15)
      const radialDist1 = screenUv.sub(vec2(
        float(0.5).add(cos(float(0.0)).mul(radialOffset)),
        float(0.5).add(sin(float(0.0)).mul(radialOffset)),
      )).length().add(burnWarp.mul(0.5))
      const radialDist2 = screenUv.sub(vec2(
        float(0.5).add(cos(float(2.094)).mul(radialOffset)),
        float(0.5).add(sin(float(2.094)).mul(radialOffset)),
      )).length().add(burnWarp.mul(0.5))
      const radialDist3 = screenUv.sub(vec2(
        float(0.5).add(cos(float(4.189)).mul(radialOffset)),
        float(0.5).add(sin(float(4.189)).mul(radialOffset)),
      )).length().add(burnWarp.mul(0.5))
      const radialMerged = radialDist1.add(radialDist2).add(radialDist3).div(float(3.0))
      const radialBurn = smoothstep(
        tEase.mul(0.9),
        tEase.mul(0.9).add(0.03),
        radialMerged,
      ).oneMinus()

      // Merge all burn sources (max = union)
      const burned = burnA.max(burnB).max(burnC).max(burnD).max(radialBurn.mul(float(0.6)))

      // Edge effects: amber halo + white-hot core + char band (per-source)
      const deltaA = distA.sub(frontA).abs()
      const deltaB = distB.sub(frontB).abs()
      const deltaC = distC.sub(frontC).abs()
      const deltaD = distD.sub(frontD).abs()
      const halo = smoothstep(float(0.02), float(0.12), deltaA).oneMinus()
        .add(smoothstep(float(0.02), float(0.12), deltaB).oneMinus())
        .add(smoothstep(float(0.02), float(0.12), deltaC).oneMinus())
        .add(smoothstep(float(0.02), float(0.12), deltaD).oneMinus())
        .clamp(0, 1)
      const hotCore = smoothstep(float(0.003), float(0.025), deltaA).oneMinus()
        .add(smoothstep(float(0.003), float(0.025), deltaB).oneMinus())
        .add(smoothstep(float(0.003), float(0.025), deltaC).oneMinus())
        .add(smoothstep(float(0.003), float(0.025), deltaD).oneMinus())
        .clamp(0, 1)
      const charBand = halo.sub(hotCore).clamp(0, 1)

      // Color layers: exposed image → charred → amber veil → ember
      const exposed = mix(
        base.rgb,
        vec3(float(1), float(0.2), float(0.025)),
        burned.mul(burnPulse).mul(0.34),
      )
      const charred = mix(
        exposed,
        vec3(float(0.028), float(0.006), float(0.002)),
        charBand.mul(0.68),
      )
      const amberVeil = vec3(float(0.68), float(0.075), float(0.008))
        .mul(burned)
        .mul(burnPulse)
        .mul(0.3)
      const ember = vec3(float(1), float(0.25), float(0.018))
        .mul(halo)
        .mul(0.32)
        .add(vec3(float(1), float(0.9), float(0.36)).mul(hotCore).mul(0.68))

      // Contact-sheet arrival: a slightly imperfect vertical exposure line
      const arrivalNoise = sin(
        screenUv.y
          .mul(37)
          .add(sin(screenUv.x.mul(13)).mul(1.2))
          .add(time.mul(0.55)),
      ).mul(0.022)
      const arrivalCoord = screenUv.x.add(arrivalNoise)
      const arrivalFront = reveal.mul(1.24).sub(0.1)
      const arrivalEdge = smoothstep(arrivalFront.sub(0.028), arrivalFront, arrivalCoord).sub(
        smoothstep(arrivalFront, arrivalFront.add(0.034), arrivalCoord),
      )
      const arrivalSignal = vec3(float(0.28), float(0.84), float(0.74)).mul(arrivalEdge).mul(0.26)
      const authoredDisplayColor = mix(charred, crtColor, crt)
        .add(amberVeil.mul(charBand.mul(0.85).oneMinus()))
        .add(ember)
        .add(arrivalSignal)
        .clamp(0, 1)

      // Pre-invert ACES filmic curve so the global post pass reconstructs
      // the source linear colour instead of lifting midtones.
      const inverseA = vec3(float(6.2)).sub(authoredDisplayColor.mul(4.8))
      const inverseDelta = authoredDisplayColor.sub(0.03)
      const inverseDiscriminant = inverseDelta
        .mul(inverseDelta)
        .add(inverseA.mul(authoredDisplayColor).mul(0.0004))
      return inverseDelta
        .add(sqrt(inverseDiscriminant as never) as never)
        .div(inverseA.mul(2))
        .clamp(0, 1)
    })()

    material.positionNode = Fn(() => {
      const local = positionLocal
      const phase = local.x.mul(8.0).add(time.mul(3.2))
      const ripple = sin(phase).mul(wobble).mul(0.018)
      const edge = float(1.0).sub(local.x.abs().mul(1.8)).clamp(0.0, 1.0)
      const travel = local.x.mul(local.x).mul(motion).mul(-0.045)
      const shear = sin(local.y.mul(12.0).add(time.mul(5.4)))
        .mul(motion)
        .mul(0.008)
      const directionalRipple = sin(local.x.mul(13.0).add(time.mul(7.0)))
        .mul(motion)
        .mul(direction)
        .mul(0.007)
      const edgeBend = local.x.mul(local.x).mul(edgeWarp).mul(-0.22)
      const fabric = sin(local.y.mul(10.0).add(local.x.mul(4.0)).add(time.mul(2.2)))
        .mul(edgeWarp)
        .mul(0.012)

      return vec3(
        local.x,
        local.y.add(ripple.mul(edge)).add(directionalRipple.mul(edge)).add(fabric),
        local.z.add(ripple.mul(0.35)).add(travel).add(shear).add(edgeBend),
      )
    })()

    // ── Opacity via Film Burn mask (same multi-source SDF as colorNode) ──
    // The plane appears/disappears through the SAME burn pattern that drives
    // the color transition — seamless morph, no separate arrival effect.
    // Reuses the `burned` mask from colorNode scope (closures share TSL nodes).
    ;(material as unknown as { opacityNode: unknown }).opacityNode = Fn(() => {
      const screenUv = uv()
      // Same angular noise + 4 burn sources + radial circles as colorNode
      const angle = atan(screenUv.y.sub(0.5).div(screenUv.x.sub(0.5)))
      const angNoise = cos(angle.mul(3.0).add(reveal.mul(PI))).add(1.0).mul(0.5)
        .add(sin(angle.mul(5.0).add(time.mul(0.3))).add(1.0).mul(0.5).mul(0.3))
      const burnWarp = angNoise.mul(0.12)
      const tEase = reveal.mul(reveal).mul(reveal)

      // 4 burn sources (same positions as colorNode)
      const distA = screenUv.sub(vec2(float(0.18), float(0.72))).length().add(burnWarp.mul(0.8))
      const distB = screenUv.sub(vec2(float(0.78), float(0.25))).length().add(burnWarp.mul(0.6))
      const distC = screenUv.sub(vec2(float(0.5), float(0.5))).length().add(burnWarp)
      const distD = screenUv.sub(vec2(float(0.72), float(0.68))).length().add(burnWarp.mul(0.7))

      const frontA = tEase.mul(1.3).sub(0.1)
      const frontB = tEase.mul(1.15).sub(0.18)
      const frontC = tEase.mul(1.0).sub(0.05)
      const frontD = tEase.mul(1.2).sub(0.28)

      const burnA = smoothstep(frontA.sub(0.04), frontA.add(0.02), distA).oneMinus()
      const burnB = smoothstep(frontB.sub(0.04), frontB.add(0.02), distB).oneMinus()
      const burnC = smoothstep(frontC.sub(0.04), frontC.add(0.02), distC).oneMinus()
      const burnD = smoothstep(frontD.sub(0.04), frontD.add(0.02), distD).oneMinus()

      // Merge → opacity mask (burned = visible, not burned = transparent)
      const opacityMask = burnA.max(burnB).max(burnC).max(burnD)
      // Also fade with transition (so plane disappears at end of fullscreen handoff)
      const fadeOut = float(1.0).sub(transition.mul(0.3))
      return opacityMask.mul(reveal).mul(fadeOut)
    })()

    super(geometry, material)
    this._state = uState as unknown as { value: THREE.Vector3 }
    this._state2 = uState2 as unknown as { value: THREE.Vector3 }
    this._state3 = uState3 as unknown as { value: THREE.Vector2 }
    this.name = 'works-case-plane'
    this.frustumCulled = false
    this.renderOrder = 2
  }

  get isAnimating(): boolean {
    return (
      this._wobbleValue > 0.002 ||
      this._wobbleTarget > 0.002 ||
      this._motionValue > 0.002 ||
      this._motionTarget > 0.002 ||
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) > 0.002 ||
      this._crtValue > 0.002
    )
  }

  setReveal(value: number): void {
    this._state.value.y = THREE.MathUtils.clamp(value, 0, 1)
    this.visible = value > 0.001
  }

  pulse(amount = 1): void {
    this._wobbleTarget = Math.max(this._wobbleTarget, amount)
  }

  setMotion(amount: number, direction: number): void {
    this._motionTarget = THREE.MathUtils.clamp(amount, 0, 1)
    this._motionDirection = direction >= 0 ? 1 : -1
  }

  setEdgeWarp(amount: number): void {
    this._edgeWarpTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  triggerCrtOn(): void {
    this._crtValue = 1
  }

  setTransition(value: number): void {
    this._state.value.x = THREE.MathUtils.clamp(value, 0, 1)
  }

  setParallax(value: number): void {
    this._state3.value.x = THREE.MathUtils.clamp(value, -1, 1)
  }

  update(dt: number, active: boolean): void {
    if (
      !active &&
      this._wobbleValue < 0.002 &&
      this._wobbleTarget < 0.002 &&
      this._motionValue < 0.002 &&
      this._motionTarget < 0.002 &&
      Math.abs(this._edgeWarpValue - this._edgeWarpTarget) < 0.002 &&
      this._crtValue < 0.002
    ) {
      return
    }

    sharedTime.value += dt
    this._wobbleTarget *= Math.exp(-dt * 7)
    this._wobbleValue += (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * 12)
    this._motionTarget *= Math.exp(-dt * 10)
    this._motionValue += (this._motionTarget - this._motionValue) * Math.min(1, dt * 16)
    this._edgeWarpValue += (this._edgeWarpTarget - this._edgeWarpValue) * Math.min(1, dt * 8)
    this._crtValue *= Math.exp(-dt * 13)

    // Pack updated values into the vec3 uniforms
    this._state.value.z = this._wobbleValue
    this._state2.value.x = this._motionValue
    this._state2.value.y = this._edgeWarpValue
    this._state2.value.z = this._crtValue
    this._state3.value.y = this._motionDirection
  }

  get texture(): THREE.Texture | null {
    const material = this.material as THREE.Material & { map?: THREE.Texture }
    return material.map ?? null
  }

  dispose(): void {
    this.geometry.dispose()
    ;(this.material as THREE.Material).dispose()
  }
}
