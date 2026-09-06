// src/core/Section.ts — Per-section state machine + opacity animation

import * as THREE from 'three'
import { StateBus } from './StateBus'
import { type PhaseConfig, type CameraTransform, type BakuTransform } from './WorldConfig'
import { disposeMaterialDeep } from '../Utils/dispose'

export enum SectionState {
  READY = 'ready',
  VIEWING = 'viewing',
  PASSED = 'passed',
}

const STATE_VALUE: Record<SectionState, number> = {
  [SectionState.READY]: 0,
  [SectionState.VIEWING]: 1,
  [SectionState.PASSED]: 2,
}

export type { CameraTransform, BakuTransform }

/** Light data used by Section (subset of LightTransform). */
export interface LightData {
  ambientColor: THREE.Color
  intensity: number
}

export class Section extends THREE.Group {
  private _disposed = false
  public phaseConfig: PhaseConfig

  // Transform holders read from PhaseConfig at construction
  public cameraTransform: CameraTransform
  public bakuTransform: BakuTransform
  public lightData: LightData

  // Viewing state machinery (ready/viewing/passed)
  private _state: SectionState = SectionState.READY
  private _stateDoneHandler: ((eventName: string, data: unknown) => void) | null = null
  public get state(): SectionState {
    return this._state
  }

  private stateChannel: string
  private opacityChannel: string

  // Cache for setMeshOpacity — avoid traverse every call
  private _opacityMeshCache: THREE.Mesh[] | null = null

  constructor(
    config: PhaseConfig,
    public phaseIndex: number,
  ) {
    super()
    this.name = `section-${config.id}`
    this.phaseConfig = config
    this.stateChannel = `section:${config.id}:state`
    this.opacityChannel = `section:${config.id}:opacity`
    this.visible = false

    // Extract transforms from PhaseConfig
    this.cameraTransform = {
      position: config.camera.position.clone(),
      target: config.camera.target.clone(),
      fov: config.camera.fov,
    }

    this.bakuTransform = {
      position: config.baku.position.clone(),
      rotation: config.baku.rotation.clone(),
      scale: config.baku.scale.clone(),
      opacity: config.baku.opacity,
      role: config.baku.role,
      displace: config.baku.displace,
      material: {
        color: config.baku.material.color.clone(),
        emissive: config.baku.material.emissive.clone(),
        roughness: config.baku.material.roughness,
        metalness: config.baku.material.metalness,
      },
    }

    this.lightData = {
      ambientColor: config.lighting.ambientColor.clone(),
      intensity: config.lighting.intensity,
    }

    const bus = StateBus.getInstance()
    bus.channel(this.stateChannel, STATE_VALUE[SectionState.READY])
    bus.channel(this.opacityChannel, 0)
    // Listen for animation completion to sync _state. When the animate()
    // completes, StateBus emits 'done:${name}' and we resolve _state.
    this._stateDoneHandler = (_eventName: string, data: unknown) => {
      if (this._disposed) return
      if (data !== this.stateChannel) return
      const val = bus.get(this.stateChannel)
      let resolved: SectionState
      if (val < 0.5) resolved = SectionState.READY
      else if (val < 1.5) resolved = SectionState.VIEWING
      else resolved = SectionState.PASSED
      if (resolved !== this._state) {
        this._state = resolved
        this.applyState(false)
      }
    }
    bus.on(`done:${this.stateChannel}`, this._stateDoneHandler)
  }

  public switchState(target: SectionState, duration: number = 1.0, reduced: boolean = false): void {
    if (this._disposed) return
    const bus = StateBus.getInstance()
    const current = bus.get(this.stateChannel)
    const targetValue = STATE_VALUE[target]
    if (Math.abs(targetValue - current) < 0.001) return
    const dur = reduced ? 0 : duration
    bus.animate(this.stateChannel, targetValue, dur, 'easeOutQuart')
    if (reduced) {
      bus.set(this.stateChannel, targetValue)
      this._state = target
      this.applyState(true)
    }
  }

  public fadeIn(duration: number = 0.8): void {
    if (this._disposed) return
    StateBus.getInstance().animate(this.opacityChannel, 1, duration, 'easeOutQuart')
  }

  private applyState(reduced: boolean = false): void {
    switch (this._state) {
      case SectionState.READY:
        this.visible = false
        this.setTransforms(0.9, -0.15, reduced)
        this.setMeshOpacity(0)
        break
      case SectionState.VIEWING:
        this.visible = true
        this.applyOpacity()
        this.setTransforms(1.0, 0, reduced)
        break
      case SectionState.PASSED:
        this.visible = false
        this.setTransforms(1.15, 0.1, reduced)
        this.setMeshOpacity(0)
        break
    }
  }

  private setTransforms(scale: number, ry: number, reduced: boolean = false): void {
    this.scale.setScalar(scale)
    this.rotation.y = reduced ? 0 : ry
  }

  private applyOpacity(): void {
    this.setMeshOpacity(StateBus.getInstance().get(this.opacityChannel))
  }

  private setMeshOpacity(value: number): void {
    if (this._opacityMeshCache === null) {
      this._opacityMeshCache = []
      this.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          const mat = obj.material
          if (!Array.isArray(mat) && 'opacity' in mat) {
            if (mat.userData.baseOpacity === undefined) {
              mat.userData.baseOpacity = (mat as THREE.Material & { opacity: number }).opacity
            }
            this._opacityMeshCache!.push(obj)
          }
        }
      })
    }
    for (const mesh of this._opacityMeshCache) {
      const mat = mesh.material as THREE.Material & { opacity: number }
      mat.opacity = value
    }
  }

  public forceState(state: SectionState, reduced: boolean = false): void {
    if (this._disposed) return
    const bus = StateBus.getInstance()
    bus.set(this.stateChannel, STATE_VALUE[state])
    this._state = state
    this.applyState(reduced)
  }

  public dispose(): void {
    if (this._disposed) return
    this._disposed = true
    const bus = StateBus.getInstance()
    bus.cancel(this.stateChannel)
    bus.cancel(this.opacityChannel)
    if (this._stateDoneHandler) {
      bus.off(`done:${this.stateChannel}`, this._stateDoneHandler)
      this._stateDoneHandler = null
    }
    bus.removeChannel(this.stateChannel)
    bus.removeChannel(this.opacityChannel)
    this._opacityMeshCache = null
    this.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => disposeMaterialDeep(m))
      }
    })
    this.removeFromParent()
    this.clear()
  }
}
