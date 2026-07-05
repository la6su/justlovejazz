// src/core/Section.ts — Junni-style: cameraTransform, bakuTransform, viewingState, switchViewingState()

import * as THREE from 'three'
import { StateBus } from './StateBus'
import { type PhaseConfig } from './WorldConfig'
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

// ── Junni: camera transform per section (where camera is when this section is active)
export interface CameraTransform {
  position: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

// ── Junni: baku transform per section (where character is when this section is active)
export interface BakuTransform {
  position: THREE.Vector3
  rotation: THREE.Quaternion
  scale: THREE.Vector3
  opacity: number
  role: number
  material: {
    color: THREE.Color
    emissive: THREE.Color
    roughness: number
    metalness: number
  }
}

// ── Junni: post processing params per section
export interface PostProcessingParams {
  bloom: number
  vignette: number
  grain: number
  chromatic: number
}

// ── Junni: light data per section
export interface LightData {
  ambientColor: THREE.Color
  intensity: number
}

export class Section extends THREE.Group {
  public phaseConfig: PhaseConfig

  // ── Junni-style transform holders (read from PhaseConfig at construction)
  public cameraTransform: CameraTransform
  public bakuTransform: BakuTransform
  public ppParams: PostProcessingParams
  public lightData: LightData

  // ── Viewing state machinery (Junni: ready/viewing/passed)
  private _state: SectionState = SectionState.READY
  public get state(): SectionState {
    return this._state
  }

  private stateChannel: string
  private opacityChannel: string

  // Cached mesh list for per-frame ops — populated lazily on first update()
  // to avoid traverse() every frame (junni pattern: cache once, update cheap)
  private _cachedMeshes: (THREE.Mesh & { material: THREE.MeshStandardMaterial })[] | null = null
  private _opacityMeshCache: THREE.Mesh[] | null = null // A-008: cache for setMeshOpacity
  private _pulseTime = 0

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

    // ── Extract transforms from PhaseConfig (Junni pattern)
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
      role: config.baku.role as unknown as number,
      material: {
        color: config.baku.material.color.clone(),
        emissive: config.baku.material.emissive.clone(),
        roughness: config.baku.material.roughness,
        metalness: config.baku.material.metalness,
      },
    }

    this.ppParams = {
      bloom: config.post.bloom,
      vignette: config.post.vignette,
      grain: config.post.grain,
      chromatic: config.post.chromatic,
    }

    this.lightData = {
      ambientColor: config.lighting.ambientColor.clone(),
      intensity: config.lighting.intensity,
    }

    const bus = StateBus.getInstance()
    bus.channel(this.stateChannel, STATE_VALUE[SectionState.READY])
    bus.channel(this.opacityChannel, 0)

    bus.on(this.stateChannel, () => {
      const raw = bus.get(this.stateChannel)
      const val = Math.round(THREE.MathUtils.clamp(raw, 0, 2))
      const newState =
        val === 1 ? SectionState.VIEWING : val === 2 ? SectionState.PASSED : SectionState.READY
      if (newState !== this._state) {
        this._state = newState
        this.applyState()
      }
    })

    bus.on(this.opacityChannel, () => this.applyOpacity())
  }

  // ── Junni: switchViewingState(index) — instant или animated + reduced motion aware
  public switchViewingState(
    state: SectionState,
    duration: number = 1.0,
    reduced: boolean = false,
  ): void {
    this.switchState(state, duration, reduced)
  }

  public switchState(target: SectionState, duration: number = 1.0, reduced: boolean = false): void {
    const bus = StateBus.getInstance()
    // A-003 fix: read current value BEFORE any write. Previous code
    // called bus.channel() which overwrote the value, then bus.get()
    // returned the just-written target, and + delta overshot.
    const current = bus.get(this.stateChannel)
    const targetValue = STATE_VALUE[target]
    if (Math.abs(targetValue - current) < 0.001) return
    const dur = reduced ? 0 : duration
    // Animate from current → target (no bus.channel() overwrite)
    bus.animate(this.stateChannel, targetValue, dur, 'easeOutQuart')
    if (reduced) {
      bus.set(this.stateChannel, targetValue)
      this._state = target
      this.applyState(true)
    }
  }

  public fadeIn(duration: number = 0.8): void {
    StateBus.getInstance().animate(this.opacityChannel, 1, duration, 'easeOutQuart')
  }

  public fadeOut(duration: number = 0.8): void {
    StateBus.getInstance().animate(this.opacityChannel, 0, duration, 'easeInOutQuart')
  }

  public splash(): void {
    // ── Junni: splash = export-ready visible state (called on world splash)
    this.visible = true
    this.forceState(SectionState.VIEWING, true)
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
    // A-008 fix: use _opacityMeshCache instead of traverse every call.
    // Lazy-init on first call (same pattern as _cachedMeshes in update()).
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
      const mat = mesh.material as THREE.Material & { opacity: number; needsUpdate: boolean }
      mat.opacity = value
      mat.needsUpdate = true
    }
  }

  public forceState(state: SectionState, reduced: boolean = false): void {
    const bus = StateBus.getInstance()
    bus.set(this.stateChannel, STATE_VALUE[state])
    this._state = state
    this.applyState(reduced)
  }

  public update(dt: number): void {
    // Emissive pulse on cached MeshStandardMaterial meshes.
    // Cache built on first call — avoids traverse() every frame.
    if (this._cachedMeshes === null) {
      this._cachedMeshes = []
      this.traverse((obj: THREE.Object3D) => {
        if (
          obj instanceof THREE.Mesh &&
          !Array.isArray(obj.material) &&
          obj.material instanceof THREE.MeshStandardMaterial
        ) {
          this._cachedMeshes!.push(obj as THREE.Mesh & { material: THREE.MeshStandardMaterial })
        }
      })
    }

    this._pulseTime += dt
    const pulse = Math.sin(this._pulseTime) * 0.15 + 0.85
    for (const mesh of this._cachedMeshes) {
      const m = mesh.material
      m.emissiveIntensity = m.emissiveIntensity * 0.95 + pulse * 0.05
    }
  }

  public dispose(): void {
    const bus = StateBus.getInstance()
    bus.cancel(this.stateChannel)
    bus.cancel(this.opacityChannel)
    bus.off(this.stateChannel)
    bus.off(this.opacityChannel)
    this._cachedMeshes = null
    this._opacityMeshCache = null
    this.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => disposeMaterialDeep(m))
      }
    })
    this.clear()
  }
}
