// ContactTextStage — camera-local pixel-title layer for the Contact route.

import * as THREE from 'three'
import { PixelTextScreen } from './PixelTextScreen'

const CONTACT_TITLE_KEYS = [
  'contact.email.marquee',
  'contact.social.title',
  'contact.location.title',
  'contact.form.title',
] as const

export class ContactTextStage extends THREE.Group {
  private readonly _screen = new PixelTextScreen(CONTACT_TITLE_KEYS)
  private _camera: THREE.Camera | null = null
  private _active = false
  private _sectionIndex = 0
  private _cameraPosition = new THREE.Vector3()

  constructor() {
    super()
    this.name = 'contact-text-stage'
    this.visible = false
    this._screen.position.set(0, 0.85, -7)
    this._screen.setVisible(false)
    this.add(this._screen)
  }

  get isAnimating(): boolean {
    return this._active && (this._screen.isAnimating || this._screen.hasContinuousMotion)
  }

  setCamera(camera: THREE.Camera): void {
    this._camera = camera
  }

  resize(width: number, height: number): void {
    const scale = THREE.MathUtils.clamp(width / height / 1.78, 0.8, 1.35)
    this._screen.scale.setScalar(scale)
  }

  setActive(active: boolean, sectionIndex: number): void {
    const nextSection = THREE.MathUtils.clamp(sectionIndex, 0, CONTACT_TITLE_KEYS.length - 1)
    const changed = nextSection !== this._sectionIndex
    const wasActive = this._active
    this._active = active
    this._sectionIndex = nextSection
    this.visible = active
    this._screen.setSection(nextSection)
    // The former pixel marquee duplicated the useful DOM heading and dominated
    // the transmission panel. Keep the stage dormant while the quieter 3D
    // greeting carries depth behind all Contact chapters.
    const showTitle = false
    if (!showTitle) this._screen.setVisible(false)
    else if (!wasActive || changed) this._screen.setVisible(true)
  }

  setTheme(isLight: boolean): void {
    this._screen.setTheme(isLight)
  }

  refreshLanguage(): void {
    this._screen.refreshLanguage()
  }

  update(dt: number): void {
    if (!this._camera || !this._active) return
    this._camera.getWorldPosition(this._cameraPosition)
    this.position.copy(this._cameraPosition)
    this.quaternion.copy(this._camera.quaternion)
    this._screen.update(dt)
  }

  dispose(): void {
    this._screen.dispose()
    this.removeFromParent()
  }
}
