// SwipeNav.ts — Swipe-to-next-section controller.
//
// A fixed bar at the bottom. User drags horizontally 0→100% to trigger
// a transition to the NEXT (or PREV) section. On release:
//   - If dragged >50% → commit transition to next/prev section
//   - If <50% → snap back to 0
// Progress (0-1) is the transition animation, NOT the overall position.
//
// Section navigation (jumping to specific sections) is done via the menu modal.

export class SwipeNav {
  private el: HTMLDivElement
  private track: HTMLDivElement
  private fill: HTMLDivElement
  private label: HTMLDivElement
  private _progress = 0        // current animated progress (0-1)
  private _targetProgress = 0  // target progress (0 or 1)
  private _isDragging = false
  private _dragStartX = 0
  private _currentSection = 0
  private _sectionCount: number
  private _ease = 0.25
  private _transitioning = false
  private _onSectionChange: ((index: number) => void) | null = null

  // Listeners
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _wheelHandler: ((e: WheelEvent) => void) | null = null
  private _isGalleryActive: (() => boolean) | null = null

  constructor(sectionCount: number) {
    this._sectionCount = sectionCount
    this.el = document.createElement('div')
    this.el.id = 'swipe-nav'
    this.el.style.cssText =
      'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
      'z-index:9999;pointer-events:auto;' +
      'display:flex;flex-direction:column;align-items:center;gap:0.5rem;' +
      'user-select:none;-webkit-user-select:none;'

    // Label — shows direction
    this.label = document.createElement('div')
    this.label.id = 'swipe-nav-label'
    this.label.style.cssText =
      'font-family:Inter,sans-serif;font-size:0.65rem;letter-spacing:0.2em;' +
      'text-transform:uppercase;color:rgba(128,128,128,0.6);transition:opacity 0.3s;'
    this.label.textContent = '← Swipe for next →'
    this.el.appendChild(this.label)

    // Track (draggable area)
    this.track = document.createElement('div')
    this.track.style.cssText =
      'position:relative;width:50vw;max-width:300px;height:40px;' +
      'background:rgba(128,128,128,0.1);border-radius:20px;' +
      'cursor:grab;touch-action:none;overflow:hidden;' +
      'border:1px solid rgba(128,128,128,0.15);'

    // Fill (shows drag progress 0-100%)
    this.fill = document.createElement('div')
    this.fill.style.cssText =
      'position:absolute;left:0;top:0;height:100%;width:0%;' +
      'background:linear-gradient(90deg,rgba(200,200,200,0.1),rgba(200,200,200,0.3));' +
      'border-radius:20px;transition:none;pointer-events:none;'
    this.track.appendChild(this.fill)

    // Center line
    const centerLine = document.createElement('div')
    centerLine.style.cssText =
      'position:absolute;left:50%;top:25%;height:50%;width:1px;' +
      'background:rgba(128,128,128,0.3);pointer-events:none;'
    this.track.appendChild(centerLine)

    this.el.appendChild(this.track)
    document.body.appendChild(this.el)

    this.addEventListeners()
    this.updateUI()
  }

  /** Set a callback that returns true when the gallery is active (flexible section).
   *  When gallery is active, SwipeNav wheel is disabled (gallery handles it). */
  setGalleryActiveChecker(checker: () => boolean): void {
    this._isGalleryActive = checker
  }

  /** Set callback for section change. */
  onSectionChange(cb: (index: number) => void): void {
    this._onSectionChange = cb
  }

  /** Get current section index. */
  getSectionIndex(): number {
    return this._currentSection
  }

  /** Get transition progress (0 = settled, 0→1 = animating to next/prev). */
  getTransitionProgress(): number {
    return this._progress
  }

  /** Get overall scroll progress (0-1 across all sections) for World.updateTransform. */
  getOverallProgress(): number {
    // current section base + transition fraction
    const sectionSize = 1 / (this._sectionCount - 1)
    const base = this._currentSection * sectionSize
    const direction = this._targetProgress > 0 ? 1 : 0
    return base + this._progress * sectionSize * (direction ? 1 : -1)
  }

  /** Navigate to a specific section (from menu). */
  goToSection(index: number): void {
    index = Math.max(0, Math.min(this._sectionCount - 1, index))
    if (index === this._currentSection) return
    this._currentSection = index
    this._progress = 0
    this._targetProgress = 0
    this._onSectionChange?.(index)
    this.updateUI()
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      if (this._transitioning) return
      this._isDragging = true
      this._dragStartX = e.clientX
      this.track.style.cursor = 'grabbing'
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      const trackWidth = this.track.offsetWidth
      const dx = (e.clientX - this._dragStartX) / trackWidth
      // Drag right = next section (positive progress)
      // Drag left = prev section (we only allow next for simplicity; left = cancel)
      this._targetProgress = Math.max(0, Math.min(1, dx))
    }
    this._pointerUpHandler = () => {
      if (!this._isDragging) return
      this._isDragging = false
      this.track.style.cursor = 'grab'
      // Commit transition if dragged >50%
      if (this._targetProgress > 0.5) {
        this.commitTransition()
      } else {
        // Snap back to 0
        this._targetProgress = 0
      }
    }

    this._wheelHandler = (e: WheelEvent) => {
      // If gallery is active (flexible section), let gallery handle wheel
      if (this._isGalleryActive?.()) return
      // Otherwise, wheel = section navigation
      e.preventDefault()
      if (e.deltaY > 0) {
        // Scroll down = next section
        if (this._currentSection < this._sectionCount - 1 && !this._transitioning) {
          this._targetProgress = 1
          this.commitTransition()
        }
      } else {
        // Scroll up = prev section
        if (this._currentSection > 0) {
          this.goToSection(this._currentSection - 1)
        }
      }
    }
    this._keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (this._currentSection < this._sectionCount - 1 && !this._transitioning) {
          this._targetProgress = 1
          this.commitTransition()
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        if (this._currentSection > 0) {
          this.goToSection(this._currentSection - 1)
        }
      }
    }
    this.track.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('keydown', this._keydownHandler)
    window.addEventListener('wheel', this._wheelHandler, { passive: false })
  }

  private commitTransition(): void {
    if (this._currentSection >= this._sectionCount - 1) {
      this._targetProgress = 0
      return
    }
    this._transitioning = true
    this._targetProgress = 1
    // Completion checked in update() when _progress reaches target
  }

  /** Call each frame to update progress + UI. */
  update(): void {
    this._progress += (this._targetProgress - this._progress) * this._ease
    // Check transition completion
    if (this._transitioning && this._progress > 0.85) {
      this._currentSection++
      this._progress = 0
      this._targetProgress = 0
      this._transitioning = false
      this._onSectionChange?.(this._currentSection)
    }
    this.updateUI()
  }

  private updateUI(): void {
    this.fill.style.width = (this._progress * 100) + '%'
    // Update label
    if (this._currentSection >= this._sectionCount - 1) {
      this.label.textContent = '← End'
      this.label.style.opacity = '0.3'
    } else if (this._progress > 0.01) {
      this.label.textContent = `→ Section ${this._currentSection + 2}`
      this.label.style.opacity = '1'
    } else {
      this.label.textContent = '← Swipe for next →'
      this.label.style.opacity = '0.6'
    }
  }

  dispose(): void {
    if (this._pointerDownHandler) this.track.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) window.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) window.removeEventListener('pointerup', this._pointerUpHandler)
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler)
    this.el.remove()
  }
}
