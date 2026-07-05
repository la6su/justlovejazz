// SwipeNav.ts — Swipe-based section navigation (replaces scroll-snap).
//
// A fixed bar at the bottom of the screen with 6 section dots.
// User drags horizontally to move between sections. Progress (0-1) maps
// to section index + transition t, fed to World.updateTransform().

export class SwipeNav {
  private el: HTMLDivElement
  private track: HTMLDivElement
  private fill: HTMLDivElement
  private dots: HTMLDivElement[] = []
  private _progress = 0
  private _targetProgress = 0
  private _isDragging = false
  private _dragStartX = 0
  private _dragStartProgress = 0
  private _sectionCount: number
  private _ease = 0.1
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  private _wheelHandler: ((e: WheelEvent) => void) | null = null
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(sectionCount: number, sectionNames: string[]) {
    this._sectionCount = sectionCount
    this.el = document.createElement('div')
    this.el.id = 'swipe-nav'
    this.el.style.cssText =
      'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
      'z-index:9999;pointer-events:auto;' +
      'display:flex;flex-direction:column;align-items:center;gap:0.5rem;' +
      'user-select:none;-webkit-user-select:none;'

    // Label
    const label = document.createElement('div')
    label.style.cssText =
      'font-family:Inter,sans-serif;font-size:0.65rem;letter-spacing:0.2em;' +
      'text-transform:uppercase;color:rgba(128,128,128,0.6);'
    label.textContent = 'Swipe to navigate'
    this.el.appendChild(label)

    // Track (draggable area)
    this.track = document.createElement('div')
    this.track.style.cssText =
      'position:relative;width:60vw;max-width:400px;height:36px;' +
      'background:rgba(128,128,128,0.1);border-radius:18px;' +
      'cursor:grab;touch-action:none;overflow:hidden;'

    // Fill (shows progress)
    this.fill = document.createElement('div')
    this.fill.style.cssText =
      'position:absolute;left:0;top:0;height:100%;width:0%;' +
      'background:rgba(200,200,200,0.2);border-radius:18px;' +
      'transition:none;pointer-events:none;'
    this.track.appendChild(this.fill)

    // Dots
    const dotsRow = document.createElement('div')
    dotsRow.style.cssText =
      'position:absolute;inset:0;display:flex;align-items:center;' +
      'justify-content:space-around;padding:0 18px;pointer-events:none;'
    for (let i = 0; i < sectionCount; i++) {
      const dot = document.createElement('div')
      dot.style.cssText =
        'width:8px;height:8px;border-radius:50%;' +
        'background:rgba(128,128,128,0.4);transition:all 0.3s ease;'
      dot.title = sectionNames[i] ?? `Section ${i + 1}`
      dotsRow.appendChild(dot)
      this.dots.push(dot)
    }
    this.track.appendChild(dotsRow)
    this.el.appendChild(this.track)
    document.body.appendChild(this.el)

    this.addEventListeners()
    this.updateUI()
  }

  private addEventListeners(): void {
    this._pointerDownHandler = (e: PointerEvent) => {
      this._isDragging = true
      this._dragStartX = e.clientX
      this._dragStartProgress = this._targetProgress
      this.track.style.cursor = 'grabbing'
      e.preventDefault()
    }
    this._pointerMoveHandler = (e: PointerEvent) => {
      if (!this._isDragging) return
      const trackWidth = this.track.offsetWidth
      const dx = (e.clientX - this._dragStartX) / trackWidth
      // Drag right = progress increases (next sections)
      this._targetProgress = Math.max(0, Math.min(1, this._dragStartProgress + dx))
    }
    this._pointerUpHandler = () => {
      if (!this._isDragging) return
      this._isDragging = false
      this.track.style.cursor = 'grab'
      // Snap to nearest section
      this.snapToSection()
    }
    this._wheelHandler = (e: WheelEvent) => {
      // Vertical wheel = section navigation (not page scroll)
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      const currentSection = Math.round(this._targetProgress * (this._sectionCount - 1))
      const newSection = Math.max(0, Math.min(this._sectionCount - 1, currentSection + delta))
      this._targetProgress = newSection / (this._sectionCount - 1)
    }
    this._keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const currentSection = Math.round(this._targetProgress * (this._sectionCount - 1))
        const newSection = Math.min(this._sectionCount - 1, currentSection + 1)
        this._targetProgress = newSection / (this._sectionCount - 1)
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const currentSection = Math.round(this._targetProgress * (this._sectionCount - 1))
        const newSection = Math.max(0, currentSection - 1)
        this._targetProgress = newSection / (this._sectionCount - 1)
      }
    }

    this.track.addEventListener('pointerdown', this._pointerDownHandler)
    window.addEventListener('pointermove', this._pointerMoveHandler)
    window.addEventListener('pointerup', this._pointerUpHandler)
    window.addEventListener('wheel', this._wheelHandler, { passive: false })
    window.addEventListener('keydown', this._keydownHandler)
  }

  private snapToSection(): void {
    const sectionSize = 1 / (this._sectionCount - 1)
    const sectionIndex = Math.round(this._targetProgress / sectionSize)
    this._targetProgress = sectionIndex * sectionSize
  }

  /** Set progress directly (0-1). Used for programmatic navigation. */
  setProgress(p: number): void {
    this._targetProgress = Math.max(0, Math.min(1, p))
  }

  /** Get current smoothed progress (0-1). Call each frame. */
  getProgress(): number {
    this._progress += (this._targetProgress - this._progress) * this._ease
    this.updateUI()
    return this._progress
  }

  /** Get current target progress (0-1) — where we're animating to. */
  get targetProgress(): number {
    return this._targetProgress
  }

  /** Get current section index (0-based). */
  getSectionIndex(): number {
    return Math.round(this._progress * (this._sectionCount - 1))
  }

  private updateUI(): void {
    this.fill.style.width = (this._progress * 100) + '%'
    const activeIdx = Math.round(this._progress * (this._sectionCount - 1))
    for (let i = 0; i < this.dots.length; i++) {
      if (i === activeIdx) {
        this.dots[i]!.style.background = 'rgba(255,255,255,0.9)'
        this.dots[i]!.style.transform = 'scale(1.4)'
      } else {
        this.dots[i]!.style.background = 'rgba(128,128,128,0.4)'
        this.dots[i]!.style.transform = 'scale(1)'
      }
    }
  }

  dispose(): void {
    if (this._pointerDownHandler) this.track.removeEventListener('pointerdown', this._pointerDownHandler)
    if (this._pointerMoveHandler) window.removeEventListener('pointermove', this._pointerMoveHandler)
    if (this._pointerUpHandler) window.removeEventListener('pointerup', this._pointerUpHandler)
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler)
    if (this._keydownHandler) window.removeEventListener('keydown', this._keydownHandler)
    this.el.remove()
  }
}
