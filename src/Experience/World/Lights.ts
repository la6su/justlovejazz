// src/Experience/World/Lights.ts — Cinematic lights, junni changeSection() pattern.
//
// Junni architecture: each section defines its own light data (position,
// color, intensity). On section change, lights animate toward new targets.
// No warmth/scroll coupling — lights are section-driven, not scroll-driven.
//
// Per-section presets match WorldConfig fog/bg palette so the scene feels
// coherent: light color echoes the section's bg tint.

import * as THREE from 'three'
import type { PhaseConfig } from '../../core/WorldConfig'
import { prefersReducedMotion } from '../../core/motionPolicy'

// ── Per-section light preset ─────────────────────────────────────────────────
interface SectionLightPreset {
  keyColor: number
  keyIntensity: number
  keyPos: [number, number, number]
  fillColor: number
  fillIntensity: number
  rimColor: number
  rimIntensity: number
  hemiSky: number
  hemiGround: number
  hemiIntensity: number
  volumetricColor: number
  volumetricIntensity: number
}

// Presets keyed by PhaseConfig.id — must match WorldConfig RAW[i].id.
// Design intent: key light echoes section accent, fill/hemi give depth.
const SECTION_PRESETS: Record<string, SectionLightPreset> = {
  sec_intro: {
    keyColor:            0xffffff,  // clean white — bright studio feel
    keyIntensity:        2.0,
    keyPos:              [4, 6, 4],
    fillColor:           0xd0d8e8,
    fillIntensity:       0.6,
    rimColor:            0xb0c0d8,
    rimIntensity:        0.8,
    hemiSky:             0xffffff,
    hemiGround:          0xe8e8e8,
    hemiIntensity:       0.5,
    volumetricColor:     0xffffff,
    volumetricIntensity: 0.0,       // off on white bg
  },
  sec_about: {
    keyColor:            0x8899cc,  // cool blue-grey — dark section
    keyIntensity:        1.6,
    keyPos:              [-2, 4, 2],
    fillColor:           0x334466,
    fillIntensity:       0.4,
    rimColor:            0xaa88cc,  // purple rim — adds depth on dark bg
    rimIntensity:        1.4,
    hemiSky:             0x080812,
    hemiGround:          0x000000,
    hemiIntensity:       0.3,
    volumetricColor:     0x6677bb,
    volumetricIntensity: 0.8,
  },
  sec_flexible: {
    keyColor:            0xe8e8e8,  // near-white — soft light section
    keyIntensity:        1.8,
    keyPos:              [3, 5, 3],
    fillColor:           0xc0c8d8,
    fillIntensity:       0.5,
    rimColor:            0xa8b8c8,
    rimIntensity:        0.7,
    hemiSky:             0xeeeeee,
    hemiGround:          0xdddddd,
    hemiIntensity:       0.4,
    volumetricColor:     0xffffff,
    volumetricIntensity: 0.0,
  },
  sec_challenge: {
    keyColor:            0x4466aa,  // blue gallery light — stage feel
    keyIntensity:        1.8,
    keyPos:              [0, 5, 5],
    fillColor:           0x223355,
    fillIntensity:       0.3,
    rimColor:            0x5577cc,
    rimIntensity:        1.6,       // strong rim for card edges
    hemiSky:             0x060810,
    hemiGround:          0x000000,
    hemiIntensity:       0.2,
    volumetricColor:     0x3355aa,
    volumetricIntensity: 1.0,
  },
  sec_innovative: {
    keyColor:            0x6688bb,  // constellation blue
    keyIntensity:        1.4,
    keyPos:              [2, 4, -2],
    fillColor:           0x334455,
    fillIntensity:       0.3,
    rimColor:            0x88aadd,
    rimIntensity:        1.2,
    hemiSky:             0x050810,
    hemiGround:          0x000000,
    hemiIntensity:       0.25,
    volumetricColor:     0x445577,
    volumetricIntensity: 0.6,
  },
  sec_contact: {
    keyColor:            0x556688,  // muted blue — closing feel
    keyIntensity:        1.2,
    keyPos:              [-3, 4, 2],
    fillColor:           0x223344,
    fillIntensity:       0.3,
    rimColor:            0x667799,
    rimIntensity:        1.0,
    hemiSky:             0x050507,
    hemiGround:          0x000000,
    hemiIntensity:       0.2,
    volumetricColor:     0x334455,
    volumetricIntensity: 0.4,
  },
}

// Fallback to sec_about for unknown sections
const DEFAULT_PRESET = SECTION_PRESETS['sec_about']

export class CinematicLights {
  private keyLight: THREE.DirectionalLight
  private fillLight: THREE.DirectionalLight
  private rimLight: THREE.DirectionalLight
  private volumetricLight: THREE.PointLight
  private hemiLight: THREE.HemisphereLight
  private readonly group: THREE.Group

  // Lerp targets — set by changeSection(), consumed by update()
  private _targetKeyColor    = new THREE.Color()
  private _targetFillColor   = new THREE.Color()
  private _targetRimColor    = new THREE.Color()
  private _targetKeyPos      = new THREE.Vector3()
  private _targetKeyIntensity    = 1.8
  private _targetFillIntensity   = 0.5
  private _targetRimIntensity    = 1.2
  private _targetVolumetricIntensity = 0.6
  private _targetHemiIntensity   = 0.3

  // GC-free scratch for lerping colors
  private _scratchColor = new THREE.Color()

  // Speed multiplier for lerp — higher = faster transition (junni: ~0.5s)
  private static readonly LERP_SPEED = 3.0

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group()
    this.group.name = 'cinematic-lights'

    // ── Key light (main directional, casts shadow) ──
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    this.keyLight.position.set(4, 6, 4)
    this.keyLight.castShadow = false // shadow disabled for perf (WebGPU)
    this.group.add(this.keyLight)

    // ── Fill light (soft fill from opposite side) ──
    this.fillLight = new THREE.DirectionalLight(0xd0d8e8, 0.6)
    this.fillLight.position.set(-4, 2, 1)
    this.group.add(this.fillLight)

    // ── Rim light (back-light, defines object edges) ──
    this.rimLight = new THREE.DirectionalLight(0xb0c0d8, 0.8)
    this.rimLight.position.set(0, 2, -4)
    this.group.add(this.rimLight)

    // ── Volumetric (PointLight, orbits slowly for organic atmosphere) ──
    this.volumetricLight = new THREE.PointLight(0x6677bb, 0.0, 14)
    this.volumetricLight.position.set(0, 1.5, 0)
    this.group.add(this.volumetricLight)

    // ── Hemisphere (ambient sky/ground gradient) ──
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8e8e8, 0.5)
    this.group.add(this.hemiLight)

    scene.add(this.group)

    // Initialise targets from intro preset
    this._applyPresetToTargets(SECTION_PRESETS['sec_intro'])
    // Snap immediately (no lerp on first frame)
    this._snapToTargets()
  }

  /**
   * Junni changeSection() pattern — set targets from PhaseConfig.
   * Lights will lerp smoothly toward the new values in update().
   * Called by World.changeSection() / updateTransform() on index change.
   */
  public changeSection(config: PhaseConfig): void {
    const preset = SECTION_PRESETS[config.id] ?? DEFAULT_PRESET
    this._applyPresetToTargets(preset)
  }

  /**
   * Per-frame smooth update — lerp all light properties toward targets.
   * Uses framerate-independent exponential decay (~0.5s transition).
   */
  public update(dt: number): void {
    const t = Math.min(dt * CinematicLights.LERP_SPEED, 1)

    // Colors
    this.keyLight.color.lerp(this._targetKeyColor, t)
    this.fillLight.color.lerp(this._targetFillColor, t)
    this.rimLight.color.lerp(this._targetRimColor, t)

    // Intensities
    this.keyLight.intensity    += (this._targetKeyIntensity    - this.keyLight.intensity)    * t
    this.fillLight.intensity   += (this._targetFillIntensity   - this.fillLight.intensity)   * t
    this.rimLight.intensity    += (this._targetRimIntensity    - this.rimLight.intensity)    * t
    this.volumetricLight.intensity += (this._targetVolumetricIntensity - this.volumetricLight.intensity) * t
    this.hemiLight.intensity   += (this._targetHemiIntensity   - this.hemiLight.intensity)   * t

    // Key light position (lerp toward target — no alloc, uses lerp in-place)
    this.keyLight.position.lerp(this._targetKeyPos, t)

    // Volumetric light: slow orbit for organic atmosphere
    // (frozen when prefers-reduced-motion — continuous orbit is a vestibular hazard)
    if (!prefersReducedMotion()) {
      const time = performance.now() * 0.0004
      this.volumetricLight.position.x = Math.sin(time) * 2.5
      this.volumetricLight.position.z = Math.cos(time) * 2.5
    }
  }

  public dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Light) obj.dispose()
    })
    this.group.parent?.remove(this.group)
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private _applyPresetToTargets(p: SectionLightPreset): void {
    this._targetKeyColor.setHex(p.keyColor)
    this._targetFillColor.setHex(p.fillColor)
    this._targetRimColor.setHex(p.rimColor)
    this._targetKeyPos.set(...p.keyPos)
    this._targetKeyIntensity        = p.keyIntensity
    this._targetFillIntensity       = p.fillIntensity
    this._targetRimIntensity        = p.rimIntensity
    this._targetVolumetricIntensity = p.volumetricIntensity
    this._targetHemiIntensity       = p.hemiIntensity
    // Hemisphere colors: update immediately (no lerp on hemi colors — minor visual)
    this.hemiLight.color.setHex(p.hemiSky)
    this.hemiLight.groundColor.setHex(p.hemiGround)
    // Volumetric color: update immediately
    this.volumetricLight.color.setHex(p.volumetricColor)
  }

  /** Snap all lights to current targets without lerp (used on init). */
  private _snapToTargets(): void {
    this.keyLight.color.copy(this._targetKeyColor)
    this.fillLight.color.copy(this._targetFillColor)
    this.rimLight.color.copy(this._targetRimColor)
    this.keyLight.position.copy(this._targetKeyPos)
    this.keyLight.intensity        = this._targetKeyIntensity
    this.fillLight.intensity       = this._targetFillIntensity
    this.rimLight.intensity        = this._targetRimIntensity
    this.volumetricLight.intensity = this._targetVolumetricIntensity
    this.hemiLight.intensity       = this._targetHemiIntensity
    // suppress unused var warning
    void this._scratchColor
  }
}
