// CasePlane — shared 3D project surface for Works.
//
// It is intentionally a real plane (not a CSS card). BakuCarousel gives it a
// drag velocity; the TSL vertex field turns that velocity into a brief bend
// across the physical surface. This keeps the slider expressive without
// rotating the cards as objects or relying on a screen-space post effect.

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

export class CasePlane extends THREE.Mesh {
  private readonly _time: { value: number }
  private readonly _wobble: { value: number }
  private readonly _motion: { value: number }
  private readonly _direction: { value: number }
  private readonly _edgeWarp: { value: number }
  private readonly _reveal: { value: number }
  private readonly _crt: { value: number }
  private readonly _transition: { value: number }
  private readonly _parallax: { value: number }
  private _wobbleValue = 0
  private _wobbleTarget = 0
  private _motionValue = 0
  private _motionTarget = 0
  private _motionDirection = 1
  private _edgeWarpValue = 0
  private _edgeWarpTarget = 0
  private _crtValue = 0

  constructor(mapTexture: THREE.Texture) {
    const time = uniform(0)
    const wobble = uniform(0)
    const motion = uniform(0)
    const direction = uniform(1)
    const edgeWarp = uniform(0)
    const reveal = uniform(0)
    const crt = uniform(0)
    const transition = uniform(0)
    const parallax = uniform(0)
    const planeHeight = 9 / 16
    const planeAspect = 16 / 9
    const textureImage = mapTexture.image as { width?: number; height?: number } | undefined
    const textureAspect =
      textureImage?.width && textureImage?.height
        ? textureImage.width / textureImage.height
        : planeAspect
    const uvScaleX = textureAspect > planeAspect ? planeAspect / textureAspect : 1
    const uvScaleY = textureAspect < planeAspect ? textureAspect / planeAspect : 1
    // Subdivisions let the vertex wobble bend the actual plane rather than
    // merely shifting its texture coordinates.
    const geometry = new THREE.PlaneGeometry(1, planeHeight, 24, 16)
    const material = new MeshBasicNodeMaterial({
      map: mapTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      // The fullscreen DOM poster is unmanaged sRGB. Bypass scene tone
      // mapping for the same authored still so WebGL and DOM match instead of
      // producing a brighter, contrast-shifted copy.
      toneMapped: false,
    })

    // A brief CRT-on pulse belongs to the physical case plane, avoiding a
    // second DOM-only flash during the fullscreen handoff.
    material.colorNode = Fn(() => {
      const screenUv = uv()
      // Cover-crop in UV space so mixed 16:9, 4:3 and square project images
      // keep their authored proportions on the shared 10:7 plane.
      const imageUv = screenUv
        .sub(vec2(float(0.5)))
        // The reference gallery keeps a generous UV buffer and moves the
        // image through it faster than the frame itself. This is texture
        // parallax on the real plane, not a bend or CSS child transform.
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

      // ── Film Burn (Arrlindii-inspired) ──
      // Reference: github.com/Arrlindii/Shader-Image-Transition
      // Pattern: angular noise warp + circle SDF + radial circles + softMin
      // merge → organic burn edge with amber halo, hot core, and char band.
      //
      // Key improvements over the previous fixed-point SDF approach:
      // 1. Angular noise (atan2 + sin/cos waves) warps the burn radius —
      //    the edge breathes and shifts direction, like real emulsion burn.
      // 2. Radial circles arranged at N points create a jagged, irregular
      //    burn front (not a clean circle).
      // 3. softMin merge blends the SDFs smoothly — no hard seams between
      //    burn sources.
      // 4. The burn grows from center outward, driven by `transition` (0→1).

      // Angular noise — warps the burn radius organically (Arrlindii pattern)
      const angle = atan(screenUv.y.sub(0.5).div(screenUv.x.sub(0.5)))
      const angNoise = cos(angle.mul(3.0).add(transition.mul(PI))).add(1.0).mul(0.5)
        .add(sin(angle.mul(5.0).add(time.mul(0.3))).add(1.0).mul(0.5).mul(0.3))
      const burnWarp = angNoise.mul(0.12) // warp amplitude

      // Center distance with noise warp
      const centerDist = screenUv.sub(vec2(float(0.5))).length()
      const warpedDist = centerDist.add(burnWarp.mul(centerDist))

      // Burn front grows from center, eased
      const tEase = transition.mul(transition).mul(transition) // cubic ease-in
      const burnRadius = tEase.mul(1.1) // grows past 1.0 to cover full plane
      const burnEdge = smoothstep(
        burnRadius.sub(0.04),
        burnRadius.add(0.02),
        warpedDist,
      ).oneMinus()

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

      // softMin merge of the radial SDFs (Arrlindii pattern)
      const radialMerged = radialDist1.add(radialDist2).add(radialDist3).div(float(3.0))

      // Final burned mask: center burn + radial burn, merged
      const radialBurn = smoothstep(
        burnRadius.mul(0.9),
        burnRadius.mul(0.9).add(0.03),
        radialMerged,
      ).oneMinus()
      const burned = burnEdge.max(radialBurn.mul(float(0.6)))

      // Edge effects: amber halo + white-hot core + char band
      const burnDelta = warpedDist.sub(burnRadius).abs()
      const halo = smoothstep(float(0.02), float(0.12), burnDelta).oneMinus()
      const hotCore = smoothstep(float(0.003), float(0.025), burnDelta).oneMinus()
      const charBand = halo.sub(hotCore).clamp(0, 1)

      // Burn pulse — peaks at mid-transition, fades at start/end
      const burnPulse = sin(transition.mul(PI)).clamp(0, 1)

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
      // reveals each still once, then leaves the authored image untouched.
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

      // The shared post pipeline applies its filmic curve to the complete
      // scene even when all optional Works effects are disabled. Pre-invert
      // that exact curve for authored case imagery so the following global
      // pass reconstructs the source linear colour instead of lifting its
      // midtones. This keeps the WebGPU plane and the DOM poster continuous.
      // y = x(6.2x + .03) / (x(4.8x + 1) + .0001), solved for positive x.
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
      // A gentle velocity field behaves like fabric catching air, rather than
      // a stiff card flip. Edge warp is supplied by the stream position: the
      // centre slide is calm, while cards near its sides flex into perspective.
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
    const opacityNoise = sin(
      uv()
        .y.mul(37)
        .add(sin(uv().x.mul(13)).mul(1.2)),
    ).mul(0.022)
    const opacityCoord = uv().x.add(opacityNoise)
    const opacityFront = reveal.mul(1.24).sub(0.1)
    const arrivalMask = smoothstep(
      opacityFront.sub(0.075),
      opacityFront.add(0.012),
      opacityCoord,
    ).oneMinus()
    ;(material as unknown as { opacityNode: unknown }).opacityNode = reveal.mul(arrivalMask)

    super(geometry, material)
    this._time = time as unknown as { value: number }
    this._wobble = wobble as unknown as { value: number }
    this._motion = motion as unknown as { value: number }
    this._direction = direction as unknown as { value: number }
    this._edgeWarp = edgeWarp as unknown as { value: number }
    this._reveal = reveal as unknown as { value: number }
    this._crt = crt as unknown as { value: number }
    this._transition = transition as unknown as { value: number }
    this._parallax = parallax as unknown as { value: number }
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
    this._reveal.value = THREE.MathUtils.clamp(value, 0, 1)
    this.visible = value > 0.001
  }

  pulse(amount = 1): void {
    this._wobbleTarget = Math.max(this._wobbleTarget, amount)
  }

  /** Feed the slider's signed velocity into the physical plane deformation. */
  setMotion(amount: number, direction: number): void {
    this._motionTarget = THREE.MathUtils.clamp(amount, 0, 1)
    this._motionDirection = direction >= 0 ? 1 : -1
  }

  /** Static bend for planes sitting at the visible edges of a media stream. */
  setEdgeWarp(amount: number): void {
    this._edgeWarpTarget = THREE.MathUtils.clamp(amount, 0, 1)
  }

  /** Brief TSL CRT pulse used for the selected plane-to-overlay handoff. */
  triggerCrtOn(): void {
    this._crtValue = 1
  }

  /** Film-burn progress for the selected plane-to-fullscreen handoff. */
  setTransition(value: number): void {
    this._transition.value = THREE.MathUtils.clamp(value, 0, 1)
  }

  /** Counter-travel the texture inside the plane without a CSS image layer. */
  setParallax(value: number): void {
    this._parallax.value = THREE.MathUtils.clamp(value, -1, 1)
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

    this._time.value += dt
    this._wobbleTarget *= Math.exp(-dt * 7)
    this._wobbleValue += (this._wobbleTarget - this._wobbleValue) * Math.min(1, dt * 12)
    this._motionTarget *= Math.exp(-dt * 10)
    this._motionValue += (this._motionTarget - this._motionValue) * Math.min(1, dt * 16)
    this._edgeWarpValue += (this._edgeWarpTarget - this._edgeWarpValue) * Math.min(1, dt * 8)
    this._crtValue *= Math.exp(-dt * 13)
    this._wobble.value = this._wobbleValue
    this._motion.value = this._motionValue
    this._direction.value = this._motionDirection
    this._edgeWarp.value = this._edgeWarpValue
    this._crt.value = this._crtValue
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
