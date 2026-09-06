// src/Experience/Scene/GroundPlane.ts — Phase 8 slice 1: the ground owner.
//
// Migrates the legacy `World.groundPlane` member and the World ground state
// (constructor geometry/material, `syncGroundTheme`, the `updateTransform`
// theme-override/config-lerp write and the dispose block) 1:1 into an
// explicit scene owner: the mesh, its theme/lerp state and its disposal now
// live here, and Experience is the single disposal owner.
//
// Consumer (temporary, Phase 8): `Experience` creates the instance, adds it
// to the Tres-owned scene, drives it from the frame path and disposes it in
// `Experience.destroy()`. The one remaining `World` touch point is the
// injected `applyTransform` call inside `World.updateTransform` (the ground
// lerp needs World's per-section eased `t`); it is removed together with the
// scene-coordination part of `World` when `World` leaves production
// (Phase 8 completion).
//
// The ground plane belongs to the contact state (AGENTS.md): section index 4
// is the only section where it is visible — the per-frame gate stays on the
// Experience frame path, as before.

import * as THREE from 'three'
import type { PhaseConfig } from '../../core/WorldConfig'

/** The per-section ground config shape (WorldConfig `ground` field). */
export type GroundConfig = PhaseConfig['ground']

export class GroundPlane {
  readonly object: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
  private _disposed = false

  // Theme-aware ground adjustment (moved 1:1 from World): the per-section
  // config lerp would reset the ground to faint config values on section
  // navigation; `syncTheme()` flips it to a contrasting tone per theme so it
  // is perceivable on both light and dark themes. `_themeActive` makes
  // `applyTransform` override the WorldConfig lerp until the next theme sync.
  private _themeColor = new THREE.Color(0x1a1a2e)
  private _themeOpacity = 0.4
  private _themeActive = false
  private _targetOpacity = 0
  // GC-free lerp pool (the legacy `_poolGroundColor` — zero allocs/frame).
  private readonly _poolColor = new THREE.Color()
  private _lastFrom: GroundConfig | null = null
  private _lastTo: GroundConfig | null = null
  private _lastT = Number.NaN

  constructor(scene: THREE.Scene) {
    // Built-in MeshStandardMaterial (NOT NodeMaterial) — reduces uniform group
    // count on WebGL2. FrontSide (default) — only top face visible from camera.
    // frustumCulled = true (default) — ground is large but centered, stays in
    // frustum. (Verbatim from the legacy `World` constructor.)
    this.object = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        transparent: true,
        // R-14 fix: depthWrite=false on transparent ground (was default true
        // → writes depth across huge area, would occlude future transparent
        // objects below y=-1). Standard practice for transparent surfaces.
        depthWrite: false,
        opacity: 0.3,
        roughness: 1,
        metalness: 0,
        side: THREE.FrontSide, // default — only render top face
      }),
    )
    this.object.rotation.x = -Math.PI / 2
    this.object.position.y = -1
    this.object.name = 'ground'
    scene.add(this.object)
  }

  /** `World.init()` step: initialize the ground from the intro section config. */
  public applyInitialConfig(ground: GroundConfig | undefined): void {
    if (this._disposed) return
    if (!ground) return
    this.object.material.color.set(ground.color)
    this.object.material.opacity = ground.opacity
    this._targetOpacity = ground.opacity
    this._lastFrom = null
    this._lastTo = null
    this._lastT = Number.NaN
  }

  /** `jlz:theme-applied` step (legacy `World.syncGroundTheme`). */
  public syncTheme(isLight: boolean): void {
    if (this._disposed) return
    if (isLight) {
      // Light theme: dark ground on near-white bg = visible contrast.
      this._themeColor.set(0x161616)
      this._themeOpacity = 0.4
    } else {
      // Dark theme: lighter ground on dark bg = visible contrast.
      this._themeColor.set(0x2a2a2a)
      this._themeOpacity = 0.3
    }
    this._themeActive = true
    this._lastFrom = null
    this._lastTo = null
    this._lastT = Number.NaN
    // Apply immediately (in case applyTransform doesn't run soon)
    this.applyMaterialState(this._themeColor, this._themeOpacity)
    this._targetOpacity = this._themeOpacity
  }

  /**
   * `World.updateTransform()` step (1:1): theme override wins; otherwise lerp
   * color + opacity between the from/to section configs with the eased `t`.
   */
  public applyTransform(from: GroundConfig, to: GroundConfig, t: number): void {
    if (this._disposed) return
    if (this._themeActive) {
      this._targetOpacity = this._themeOpacity
      this.applyMaterialState(this._themeColor, this._themeOpacity)
    } else {
      if (this._lastFrom === from && this._lastTo === to && Object.is(this._lastT, t)) {
        // Keep material reconciliation even when inputs are unchanged: an
        // external owner may have mutated this material between frames.
        this.applyMaterialState(this._poolColor, this._targetOpacity)
        return
      }
      this._lastFrom = from
      this._lastTo = to
      this._lastT = t
      const color = this._poolColor.lerpColors(from.color, to.color, t)
      this._targetOpacity = THREE.MathUtils.lerp(from.opacity, to.opacity, t)
      this.applyMaterialState(color, this._targetOpacity)
    }
  }

  /** Avoid repeating identical material writes during continuous story frames. */
  private applyMaterialState(color: THREE.Color, opacity: number): void {
    const mat = this.object.material
    if (!mat.color.equals(color)) mat.color.copy(color)
    if (mat.opacity !== opacity) mat.opacity = opacity
  }

  /** Per-frame gate: the ground is visible only on section 4 (contact state). */
  public setSectionVisible(visible: boolean): void {
    if (this._disposed) return
    this.object.visible = visible
  }

  public dispose(): void {
    if (this._disposed) return
    this._disposed = true
    this.object.parent?.remove(this.object)
    this.object.geometry.dispose()
    this.object.material.dispose()
  }
}
