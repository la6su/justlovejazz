// ContactTypographyStage — lazy owner for the decorative Contact greeting.
// The implementation import is intentionally kept behind Experience's route
// dynamic import so FontLoader/TextGeometry do not enter the shared scene graph.

import * as THREE from 'three'
import { WireframeTypography } from './WireframeTypography'
import { prefersReducedMotion } from '../../core/motionPolicy'

export class ContactTypographyStage extends THREE.Group {
  private readonly typography = new WireframeTypography('HELLO', 0.34)
  private active = false

  constructor() {
    super()
    this.name = 'contact-typography-stage'
    this.typography.userData.keepVisible = true
    this.typography.position.set(-0.15, 0.35, -2.4)
    this.add(this.typography)
    this.visible = false
  }

  get isAnimating(): boolean {
    // The authored glyphs keep bobbing after the reveal settles, so this
    // remains an ambient-motion signal rather than only a reveal signal.
    return this.active
  }

  setActive(active: boolean): void {
    this.active = active
    this.visible = active
    this.typography.userData.reducedMotion = prefersReducedMotion()
    this.typography.setActive(active)
  }

  setTheme(isLight: boolean): void {
    this.typography.setTheme(isLight)
  }

  update(dt: number): void {
    if (this.active) this.typography.update(dt)
  }

  dispose(): void {
    this.typography.dispose()
    this.removeFromParent()
  }
}
