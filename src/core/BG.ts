// BG — Background color provider (scene.background)
// Supports both section-snap (setSection) and continuous lerp (setProgress)
// for smooth cross-section transitions driven by World.updateTransform(t).
import * as THREE from 'three'
import { getAllScenes } from './WorldConfig'

// Single source of truth: colors come from WorldConfig (previously BG had a
// hardcoded array that drifted from WorldConfig — about was 0x08080c here vs
// 0x020204 in WorldConfig). Now both the 3D scene bg and the fog/ground use
// the same PhaseConfig.background values.
const sectionColors = getAllScenes().map((c) => new THREE.Color(c.background))

export class BG {
  public color = new THREE.Color(0xffffff)

  // Exponential-smoothing target (set by setSection + setProgress)
  private targetColor = new THREE.Color(0xffffff)
  // GC-free lerp scratch
  private _scratch = new THREE.Color()

  constructor() {
    this.targetColor.copy(sectionColors[0])
    this.color.copy(sectionColors[0])
  }

  /**
   * Snap target to a single section color.
   * Called by World.updateTransform when the section index changes.
   */
  public setSection(index: number): void {
    const c = sectionColors[Math.max(0, Math.min(index, sectionColors.length - 1))]
    this.targetColor.copy(c)
  }

  /**
   * Set target as a continuous lerp between two adjacent sections.
   * Called by World.updateTransform with fromIndex, toIndex, and eased t.
   * This gives pixel-perfect background progression while scrolling.
   */
  public setProgress(fromIndex: number, toIndex: number, t: number): void {
    const from = sectionColors[Math.max(0, Math.min(fromIndex, sectionColors.length - 1))]
    const to = sectionColors[Math.max(0, Math.min(toIndex, sectionColors.length - 1))]
    this.targetColor.copy(this._scratch.lerpColors(from, to, t))
  }

  /**
   * Per-frame smooth update — exponential decay toward target.
   * Speed ~6 so the bg tracks scroll-snap section switches in ~0.2s.
   * (Previously 0.4 = ~2.5s lag — the bg was still mid-transition long
   * after the section snapped, causing white-text-on-grey contrast loss
   * on the about section.)
   */
  public update(deltaTime: number): void {
    const lerp = 1 - Math.exp(-6 * deltaTime)
    this.color.lerp(this.targetColor, lerp)
  }
}
