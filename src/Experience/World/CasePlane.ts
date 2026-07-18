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
  smoothstep,
  sqrt,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
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
      // Photographic film burn: several low-frequency warped SDFs ignite on
      // separate beats. Their broad amber halo, white-hot core and dark char
      // band read as softened emulsion holes rather than electric contour
      // lines. The fields merge only near the fullscreen handoff.
      const burnNoiseA = sin(
        screenUv.x
          .mul(8.5)
          .add(sin(screenUv.y.mul(7.0)).mul(1.65))
          .add(time.mul(0.38)),
      )
        .mul(0.105)
        .add(sin(screenUv.y.mul(13).sub(time.mul(0.31))).mul(0.048))
      const burnNoiseB = sin(
        screenUv.y
          .mul(9.5)
          .sub(sin(screenUv.x.mul(6.5)).mul(1.8))
          .sub(time.mul(0.3)),
      )
        .mul(0.098)
        .add(sin(screenUv.x.add(screenUv.y).mul(14)).mul(0.043))
      const burnNoiseC = sin(
        screenUv.x
          .add(screenUv.y.mul(0.72))
          .mul(10.5)
          .add(sin(screenUv.x.mul(5.5)).mul(1.55))
          .add(time.mul(0.27)),
      )
        .mul(0.094)
        .add(sin(screenUv.y.mul(15)).mul(0.04))
      const burnNoiseD = sin(
        screenUv.y
          .sub(screenUv.x.mul(0.58))
          .mul(11.5)
          .add(sin(screenUv.y.mul(6.0)).mul(1.4))
          .sub(time.mul(0.24)),
      ).mul(0.085)
      const burnDistanceA = screenUv
        .sub(vec2(float(0.18), float(0.68)))
        .mul(vec2(float(0.86), float(1.16)))
        .length()
        .add(burnNoiseA)
      const burnDistanceB = screenUv
        .sub(vec2(float(0.75), float(0.28)))
        .mul(vec2(float(1.05), float(0.84)))
        .length()
        .add(burnNoiseB)
      const burnDistanceC = screenUv
        .sub(vec2(float(0.62), float(0.82)))
        .mul(vec2(float(0.9), float(1.24)))
        .length()
        .add(burnNoiseC)
      const burnDistanceD = screenUv
        .sub(vec2(float(0.38), float(0.3)))
        .mul(vec2(float(1.18), float(0.92)))
        .length()
        .add(burnNoiseD)
      const burnFrontA = transition.mul(1.25).sub(0.1)
      const burnFrontB = transition.mul(1.18).sub(0.19)
      const burnFrontC = transition.mul(1.3).sub(0.3)
      const burnFrontD = transition.mul(1.08).sub(0.34)
      const burnA = smoothstep(
        burnFrontA.sub(0.025),
        burnFrontA.add(0.035),
        burnDistanceA,
      ).oneMinus()
      const burnB = smoothstep(
        burnFrontB.sub(0.025),
        burnFrontB.add(0.035),
        burnDistanceB,
      ).oneMinus()
      const burnC = smoothstep(
        burnFrontC.sub(0.025),
        burnFrontC.add(0.035),
        burnDistanceC,
      ).oneMinus()
      const burnD = smoothstep(
        burnFrontD.sub(0.022),
        burnFrontD.add(0.032),
        burnDistanceD,
      ).oneMinus()
      const burned = burnA.max(burnB).max(burnC).max(burnD)
      const deltaA = burnDistanceA.sub(burnFrontA).abs()
      const deltaB = burnDistanceB.sub(burnFrontB).abs()
      const deltaC = burnDistanceC.sub(burnFrontC).abs()
      const deltaD = burnDistanceD.sub(burnFrontD).abs()
      const halo = smoothstep(0.016, 0.105, deltaA)
        .oneMinus()
        .add(smoothstep(0.016, 0.105, deltaB).oneMinus())
        .add(smoothstep(0.016, 0.105, deltaC).oneMinus())
        .add(smoothstep(0.014, 0.095, deltaD).oneMinus())
        .clamp(0, 1)
      const hotCore = smoothstep(0.004, 0.03, deltaA)
        .oneMinus()
        .add(smoothstep(0.004, 0.03, deltaB).oneMinus())
        .add(smoothstep(0.004, 0.03, deltaC).oneMinus())
        .add(smoothstep(0.004, 0.027, deltaD).oneMinus())
        .clamp(0, 1)
      const charBand = halo.sub(hotCore).clamp(0, 1)
      const burnPulse = sin(transition.mul(3.14159265)).clamp(0, 1)
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
