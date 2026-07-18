// CinematicField.ts — scroll-driven TSL light ribbons shared by every section.
//
// This is the visual "red line" of the horizontal story. Three translucent
// procedural planes sit between EnvSphere and the foreground glass object.
// Their line, travelling light and fluid island are generated in TSL, so the
// same NodeMaterial runs through both the WebGPU and WebGL2 render paths.

import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  abs,
  float,
  fract,
  length,
  max,
  mix,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import { prefersReducedMotion } from '../../core/motionPolicy'

interface FieldLayer {
  mesh: THREE.Mesh<THREE.PlaneGeometry, MeshBasicNodeMaterial>
  phase: ReturnType<typeof uniform>
  strength: ReturnType<typeof uniform>
}

const COOL = vec3(float(0.08), float(0.55), float(0.92))
const VIOLET = vec3(float(0.48), float(0.3), float(0.95))
const WARM = vec3(float(1), float(0.3), float(0.12))
const PEARL = vec3(float(1), float(0.92), float(0.84))

export class CinematicField extends THREE.Group {
  private _uTime = uniform(0)
  private _uProgress = uniform(0.2)
  private _uLightTheme = uniform(1)
  private _layers: FieldLayer[] = []

  constructor() {
    super()
    this.name = 'cinematic-field'
    this.renderOrder = -20

    this._addLayer(0, 0.86, [7.4, 4.2], [0, 0.05, -1.85], [0.02, 0, -0.025])
    this._addLayer(2.15, 0.48, [6.4, 3.7], [-0.25, 0.12, -1.25], [-0.04, -0.12, 0.035])
    this._addLayer(4.4, 0.3, [8.2, 4.8], [0.35, -0.18, -2.35], [0.05, 0.1, -0.015])
  }

  private _addLayer(
    phaseValue: number,
    strengthValue: number,
    size: [number, number],
    position: [number, number, number],
    rotation: [number, number, number],
  ): void {
    const phase = uniform(phaseValue)
    const strength = uniform(strengthValue)
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })

    material.colorNode = Fn(() => {
      const p = uv().sub(vec2(float(0.5)))
      const story = this._uProgress
      const time = this._uTime

      // One continuous, slightly imperfect path — the literal narrative line.
      const largeWave = sin(p.x.mul(5).add(time.mul(0.18)).add(phase)).mul(float(0.055))
      const detailWave = sin(p.x.mul(13).sub(time.mul(0.42)).add(story.mul(7)).add(phase)).mul(
        float(0.075),
      )
      const lineY = largeWave.add(detailWave).add(story.sub(0.5).mul(0.15))
      const lineDistance = abs(p.y.sub(lineY))
      const lineCore = smoothstep(float(0.019), float(0.002), lineDistance)
      const lineGlow = smoothstep(float(0.24), float(0), lineDistance).mul(0.2)

      // A moving energy packet travels through the line instead of using a
      // familiar DOM progress-bar treatment.
      const travel = fract(p.x.add(0.5).sub(time.mul(0.075)).add(story).add(phase.mul(0.07)))
      const packet = smoothstep(float(0.16), float(0), abs(travel.sub(0.5)))
      const packetGlow = packet.mul(smoothstep(float(0.16), float(0), lineDistance))

      // Fluid island: its centre travels with the story and changes vertical
      // position with the same signal as the line, so both forms feel linked.
      const islandX = story.sub(0.5).mul(0.72)
      const islandY = sin(story.mul(7).add(phase)).mul(0.12).add(lineY.mul(0.35))
      const islandPoint = p.sub(vec2(islandX, islandY)).mul(vec2(float(1.25), float(2.2)))
      const islandDistance = length(islandPoint)
      const island = smoothstep(float(0.34), float(0.035), islandDistance)
      const islandRim = smoothstep(float(0.35), float(0.3), islandDistance).mul(
        smoothstep(float(0.21), float(0.28), islandDistance),
      )

      // Fade the plane itself before its rectangular geometry becomes visible.
      const edgeX = smoothstep(float(0.5), float(0.41), abs(p.x))
      const edgeY = smoothstep(float(0.5), float(0.36), abs(p.y))
      const edgeMask = edgeX.mul(edgeY)

      const coolToViolet = mix(COOL, VIOLET, smoothstep(float(0.18), float(0.56), story))
      const storyColor = mix(coolToViolet, WARM, smoothstep(float(0.5), float(0.92), story))
      const lightBoost = mix(float(1.18), float(1.34), this._uLightTheme)
      const color = storyColor
        .mul(
          lineGlow.mul(1.7).add(lineCore.mul(1.15)).add(packetGlow.mul(1.2)).add(island.mul(0.28)),
        )
        .add(PEARL.mul(lineCore.mul(0.3).add(packetGlow.mul(0.45)).add(islandRim.mul(0.34))))
        .mul(lightBoost)

      const alpha = max(
        max(lineCore.mul(0.82), lineGlow),
        max(packetGlow, island.mul(0.2).add(islandRim.mul(0.38))),
      )
        .mul(edgeMask)
        .mul(strength)

      return vec4(color, alpha)
    })()

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1], 1, 1), material)
    mesh.name = `cinematic-field-layer-${this._layers.length + 1}`
    mesh.position.set(...position)
    mesh.rotation.set(...rotation)
    mesh.frustumCulled = false
    mesh.renderOrder = -20 + this._layers.length
    this.add(mesh)
    this._layers.push({ mesh, phase, strength })
  }

  setProgress(progress: number): void {
    this._uProgress.value = THREE.MathUtils.clamp(progress, 0, 1)
  }

  setTheme(isLight: boolean): void {
    this._uLightTheme.value = isLight ? 1 : 0
  }

  update(deltaTime: number): void {
    if (!prefersReducedMotion()) this._uTime.value += deltaTime
  }

  resize(width: number, height: number): void {
    const portrait = width / Math.max(1, height) < 0.82
    this.scale.setScalar(portrait ? 0.78 : 1)
    this.position.y = portrait ? 0.25 : 0
  }

  dispose(): void {
    for (const { mesh } of this._layers) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
    this._layers = []
    this.clear()
  }
}
