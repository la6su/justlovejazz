// JoystickNav.ts — Joystick-based section navigation (replaces CircularNav).
//
// Uses three-joystick for touch/mouse input. The joystick provides moveX/moveY
// deltas. We interpret:
//   moveY > threshold → NEXT section (drag down)
//   moveY < -threshold → PREV section (drag up)
//   moveX > threshold → NEXT section (drag right)
//   moveX < -threshold → PREV section (drag left)
//
// On release: if movement exceeded threshold, commit the transition.
// Progress (0-1) drives the 3D scene transition (same as CircularNav).
//
// Also supports keyboard arrows for desktop.

import { JoystickControls } from 'three-joystick'
import type * as THREE from 'three'

export interface JoystickNavOptions {
  sectionLabels: string[]
}

const MOVE_THRESHOLD = 50 // px — movement beyond this triggers transition
const COMMIT_THRESHOLD = 0.5 // |progress| > this on release → commit
const SETTLE_EPS = 0.01 // |progress - target| < this → snapped

export class JoystickNav {
  public el: HTMLDivElement
  private _joystick: JoystickControls
  private _currentSection = 0
  private _sectionCount: number
  public _progress = 0 // -1..1 transition progress (0 = settled)
  private _targetProgress = 0
  private _transitioning = false
  private _ease = 0.22
  private _onSectionChange: ((index: number) => void) | null = null
  private _onActiveChange: ((active: boolean) => void) | null = null
  private _wasActive = false
  private _moveAccumX = 0
  private _moveAccumY = 0
  private _isDragging = false
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(scene: THREE.Scene, camera: THREE.Camera, sectionCount: number, _opts?: Partial<JoystickNavOptions>) {
    this._sectionCount = Math.max(2, sectionCount)

    // Create a container element for DOM placement (joystick is 3D, but we
    // need an element for Experience to position in the layout)
    this.el = document.createElement('div')
    this.el.id = 'joystick-nav'
    this.el.className = 'jlz-joystick-nav'
    this.el.setAttribute('role', 'slider')
    this.el.setAttribute('aria-label', 'Section navigation')

    // Create joystick controls — adds 3D joystick to scene
    this._joystick = new JoystickControls(camera as THREE.PerspectiveCamera, scene)

    // Prevent joystick from activating when modal menu is open
    this._joystick.preventAction = () => {
      const menu = document.getElementById('jlz-menu-modal')
      return !!(menu && menu.classList.contains('uk-open'))
    }

    this.addKeyboardListener()
  }

  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  onActiveChange(cb: (active: boolean) => void): void {
    this._onActiveChange = cb
  }

  /** Notify Experience of active-state changes (deduplicated). */
  private _setActive(active: boolean): void {
    if (active === this._wasActive) return
    this._wasActive = active
    this._onActiveChange?.(active)
  }

  getSectionIndex(): number {
    return this._currentSection
  }

  isActive(): boolean {
    return Math.abs(this._progress) > 0.001 || this._transitioning
  }

  getOverallProgress(): number {
    const span = this._sectionCount - 1
    return Math.max(0, Math.min(1, (this._currentSection + this._progress) / span))
  }

  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(index)
    this._setActive(true)
    setTimeout(() => this._setActive(false), 300)
  }

  goToDirection(dir: 1 | -1): void {
    if (this._transitioning) {
      this._completeTransition()
    }
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) return
    this.commitTransition(dir)
  }

  private commitTransition(dir: number): void {
    const next = this._currentSection + dir
    if (next < 0 || next >= this._sectionCount) {
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = dir
  }

  private _completeTransition(): void {
    if (!this._transitioning) return
    const dir = this._targetProgress > 0 ? 1 : -1
    this._currentSection = Math.max(0, Math.min(this._sectionCount - 1, this._currentSection + dir))
    this._progress = 0
    this._targetProgress = 0
    this._transitioning = false
    this._onSectionChange?.(this._currentSection)
  }

  private addKeyboardListener(): void {
    this._keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const menu = document.getElementById('jlz-menu-modal')
      if (menu && menu.classList.contains('uk-open')) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        this.goToDirection(1)
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        this.goToDirection(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        this.goToSection(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        this.goToSection(this._sectionCount - 1)
      }
    }
    window.addEventListener('keydown', this._keydownHandler)
  }

  /** Called every frame by Experience. Passes joystick movement. */
  update(): void {
    // Read joystick movement
    this._joystick.update((movement) => {
      if (movement) {
        if (!this._isDragging) {
          this._isDragging = true
          this._moveAccumX = 0
          this._moveAccumY = 0
          this._setActive(true)
        }
        this._moveAccumX = movement.moveX
        this._moveAccumY = movement.moveY

        // Use the larger axis for progress
        const absX = Math.abs(this._moveAccumX)
        const absY = Math.abs(this._moveAccumY)
        let target: number
        if (absY > absX) {
          // Vertical dominant — down = next, up = prev
          target = this._moveAccumY / MOVE_THRESHOLD
        } else {
          // Horizontal dominant — right = next, left = prev
          target = this._moveAccumX / MOVE_THRESHOLD
        }

        // Rubber-band at boundaries
        const atStart = this._currentSection === 0
        const atEnd = this._currentSection === this._sectionCount - 1
        if (atStart && target < 0) target *= 0.3
        if (atEnd && target > 0) target *= 0.3
        target = Math.max(-1, Math.min(1, target))

        this._targetProgress = target
        this._progress = target
      } else {
        // Joystick released — commit or snap back
        if (this._isDragging) {
          this._isDragging = false
          const absProgress = Math.abs(this._progress)
          if (absProgress > COMMIT_THRESHOLD) {
            this.commitTransition(this._progress > 0 ? 1 : -1)
          } else {
            this._targetProgress = 0
          }
          this._moveAccumX = 0
          this._moveAccumY = 0
        }
      }
    })

    // Smooth progress toward target (only when not dragging)
    if (!this._isDragging) {
      this._progress += (this._targetProgress - this._progress) * this._ease
    }

    // Snap to target when close enough
    if (Math.abs(this._targetProgress - this._progress) < SETTLE_EPS * 0.1) {
      this._progress = this._targetProgress
    }

    // Commit complete: transitioning + reached target
    if (this._transitioning && Math.abs(this._targetProgress - this._progress) < SETTLE_EPS) {
      this._completeTransition()
    }

    // Settle complete: not dragging, not transitioning, progress ≈ 0
    if (!this._isDragging && !this._transitioning && Math.abs(this._progress) < SETTLE_EPS) {
      this._progress = 0
      this._targetProgress = 0
      this._setActive(false)
    }
  }

  dispose(): void {
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    this._joystick.destroy()
    this.el.remove()
  }
}
