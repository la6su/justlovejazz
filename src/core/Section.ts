// src/core/Section.ts — Per-section state machine + opacity animation

import * as THREE from 'three'
import { StateBus } from './StateBus'
import { type PhaseConfig, type CameraTransform, type BakuTransform } from './WorldConfig'

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
interface LightData {
  ambientColor: THREE.Color
  intensity: number
}

/** Route transition state only; renderable section content lives in SectionGroups. */
export class Section {
  private _disposed = false
  public phaseConfig: PhaseConfig
  public readonly name: string

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

  constructor(
    config: PhaseConfig,
    public phaseIndex: number,
  ) {
    this.name = `section-${config.id}`
    this.phaseConfig = config
    this.stateChannel = `section:${config.id}:state`

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
    }
  }

  public forceState(state: SectionState): void {
    if (this._disposed) return
    const bus = StateBus.getInstance()
    bus.set(this.stateChannel, STATE_VALUE[state])
    this._state = state
  }

  public dispose(): void {
    if (this._disposed) return
    this._disposed = true
    const bus = StateBus.getInstance()
    bus.cancel(this.stateChannel)
    if (this._stateDoneHandler) {
      bus.off(`done:${this.stateChannel}`, this._stateDoneHandler)
      this._stateDoneHandler = null
    }
    bus.removeChannel(this.stateChannel)
  }
}
