// WorksPortfolio — works slider ON the baku cube.
//
// Instead of separate card meshes, project textures are applied to the 4 side
// faces of the SplashCube (baku). Swiping rotates the cube to show the next face.
// No liquid distortion — clean, simple, cube-based slider.

import * as THREE from 'three'
import { type Project } from '../core/types'

export class WorksPortfolio {
  public readonly group = new THREE.Group()
  private static readonly sharedLoader = new THREE.TextureLoader()
  public projects: Project[]
  public currentIdx = 0
  private targetIdx = 0
  private idxVelocity = 0
  private idxStiffness = 80
  private idxDamping = 14
  private dragOff = 0
  private dragging = false
  private dragStartX = 0
  private vel = 0
  private lastX = 0
  private lastT = 0
  private _touchStartY: number | null = null
  // Public for Experience to re-apply on works section entry (Bug 4).
  textures: (THREE.Texture | null)[] = []
  // Public for Experience to check load state (Bug 4).
  texturesLoaded = false
  private baku: THREE.Object3D | null = null
  private expanding = false
  private expandProgress = 0
  private expandDirection: 'expand' | 'collapse' = 'expand'
  private expandedIdx = -1
  private wheelHandler: ((e: WheelEvent) => void) | null = null
  private wheelAccum = 0
  private wheelAccumTimer: ReturnType<typeof setTimeout> | null = null

  /** Liquid multiplier (kept for DevPanel API compat, no longer used in shader). */
  public liquidMultiplier = 1
  /** Public for DevPanel inspection (empty — cards are on cube now). */
  public cards: unknown[] = []

  declare onCardClick: (index: number) => void
  declare onCardActivate: (index: number) => void
  declare onCardExpanded: (index: number) => void
  declare onCardCollapsed: () => void

  constructor(
    projects: Project[],
    onCardClick: (index: number) => void = () => {},
    onCardActivate: (index: number) => void = () => {},
    onCardExpanded: (index: number) => void = () => {},
    onCardCollapsed: () => void = () => {},
  ) {
    this.group.name = 'works-portfolio'
    this.projects = projects
    this.onCardClick = onCardClick
    this.onCardActivate = onCardActivate
    this.onCardExpanded = onCardExpanded
    this.onCardCollapsed = onCardCollapsed
    this.textures = new Array(projects.length).fill(null)
    this.bindEvents()
  }

  /** Set the baku (SplashCube) that will display project textures on its faces. */
  setBaku(baku: THREE.Object3D): void {
    this.baku = baku
    this.loadAllTextures()
  }

  private loadAllTextures(): void {
    if (this.texturesLoaded || !this.baku) return
    this.texturesLoaded = true
    let loaded = 0
    for (let i = 0; i < this.projects.length; i++) {
      const url = this.projects[i]!.textureUrl || this.projects[i]!.detailTextureUrl
      if (!url) {
        loaded++
        continue
      }
      WorksPortfolio.sharedLoader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          this.textures[i] = tex
          loaded++
          // Apply to cube once all textures are loaded.
          if (loaded >= this.projects.length) {
            this.applyTexturesToCube()
          }
        },
        undefined,
        () => {
          loaded++
        },
      )
    }
  }

  /** Public — Experience calls this on works section entry (Bug 4). */
  applyTexturesToCube(): void {
    const cube = this.baku as unknown as {
      setProjectTextures?: (t: (THREE.Texture | null)[]) => void
    }
    cube?.setProjectTextures?.(this.textures)
  }

  private bindEvents(): void {
    window.addEventListener('pointerdown', this.onPointerDown, true)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerup', this.onPointerUp, true)
    window.addEventListener('pointercancel', this.onPointerUp, true)
    window.addEventListener('keydown', this.onKey)
    // Wheel/scroll drives the carousel when the works section is active.
    // Scroll does NOT navigate sections (SwipeNav scrubber does) — here it
    // cycles through project faces on the cube.
    this.wheelHandler = (e: WheelEvent) => {
      if (this.expanding || !this.group.visible) return
      // Ignore wheel when the nav menu is open (overlay covers screen).
      const overlay = document.getElementById('jlz-menu-overlay')
      if (overlay && overlay.style.visibility === 'visible') return
      // Ignore wheel originating from the SwipeNav / menu / overlay UI.
      const target = e.target as HTMLElement | null
      if (target?.closest('#swipe-nav, #jlz-menu-toggle, #jlz-menu-overlay, #project-modal')) return
      e.preventDefault()
      // Accumulate wheel delta — trackpads fire many small events; mice
      // fire one large event. Threshold-based accumulation handles both.
      this.wheelAccum += e.deltaY
      if (this.wheelAccumTimer) clearTimeout(this.wheelAccumTimer)
      this.wheelAccumTimer = setTimeout(() => {
        this.wheelAccum = 0
      }, 200)
      const threshold = 60
      if (Math.abs(this.wheelAccum) > threshold) {
        const dir = this.wheelAccum > 0 ? 1 : -1
        this.goTo(this.targetIdx + dir)
        this.wheelAccum = 0
      }
    }
    window.addEventListener('wheel', this.wheelHandler, { passive: false })
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.expanding) return
    if (!this.group.visible) return
    // Don't hijack arrows when the menu is open or focus is in a control.
    const overlay = document.getElementById('jlz-menu-overlay')
    if (overlay && overlay.style.visibility === 'visible') return
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault()
      this.goTo(this.currentIdx + 1)
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.goTo(this.currentIdx - 1)
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.expanding) return
    if (!this.group.visible) return
    const target = e.target as HTMLElement
    // Ignore pointerdown on UI chrome — the carousel only reacts to drags
    // on the 3D canvas area.
    if (
      target.closest(
        '.jlz-works-ui, #project-modal, #jlj-splash, #main-nav, #swipe-nav, #jlz-menu-toggle, #jlz-menu-overlay',
      )
    )
      return
    // Touch devices: prevent the page from scrolling while swiping the cube.
    // scroll-snap mandatory would otherwise fight the horizontal drag.
    if (e.pointerType === 'touch') {
      // Only prevent if the drag is likely horizontal (not vertical scroll)
      this._touchStartY = e.clientY
    }
    this.dragging = true
    this.dragStartX = e.clientX
    this.lastX = e.clientX
    this.lastT = performance.now()
    this.vel = 0
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return
    // Touch: if vertical movement dominates, cancel drag (let page scroll)
    if (e.pointerType === 'touch' && this._touchStartY !== null) {
      const dy = Math.abs(e.clientY - this._touchStartY)
      const dx = Math.abs(e.clientX - this.dragStartX)
      if (dy > dx * 1.5 && dy > 10) {
        this.dragging = false
        this.dragOff = 0
        return
      }
      // Horizontal drag — prevent page scroll
      e.preventDefault()
    }
    // Live drag offset in radians — maps ~180px of drag to one cube face (PI/2).
    this.dragOff = (e.clientX - this.dragStartX) * 0.009
    const now = performance.now()
    const dt = now - this.lastT
    this.vel = dt > 0 ? (e.clientX - this.lastX) / dt : 0
    this.lastX = e.clientX
    this.lastT = now
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false
    this._touchStartY = null
    const dragDist = Math.abs(e.clientX - this.dragStartX)
    // Touch: use larger threshold (finger less precise than mouse)
    const swipeThreshold = e.pointerType === 'touch' ? 50 : 40
    if (this.vel > 0.12 || dragDist > swipeThreshold) {
      this.goTo(e.clientX < this.dragStartX ? this.currentIdx + 1 : this.currentIdx - 1)
    } else if (dragDist < 8) {
      // Tap — activate card
      this.onCardActivate(this.currentIdx)
    }
    this.dragOff = 0
  }

  goTo(idx: number): void {
    const n = this.projects.length
    // Round to integer — currentIdx is a float (spring physics) so
    // currentIdx ± 1 is a float, which broke modular indexing (projects[float]
    // = undefined → overlay never updated, cube rotated to non-integer faces).
    const ri = Math.round(idx)
    this.targetIdx = ((ri % n) + n) % n
    this.onCardClick(this.targetIdx)
  }

  // Use targetIdx (the settled integer target), NOT currentIdx (a float that
  // lags behind due to spring physics). Jumping from currentIdx caused prev/next
  // to land on wrong indices when clicked mid-animation.
  next(): void {
    this.goTo(this.targetIdx + 1)
  }
  prev(): void {
    this.goTo(this.targetIdx - 1)
  }

  expandCard(idx: number): void {
    if (this.expanding) return
    this.expanding = true
    this.expandDirection = 'expand'
    this.expandedIdx = idx
    this.expandProgress = 0
  }

  collapseCard(): void {
    if (!this.expanding) return
    this.expandDirection = 'collapse'
    this.expandProgress = 0
  }

  setCamera(_cam: THREE.Camera): void {
    // No raycasting needed — cards are on the cube.
  }

  update(dt: number): void {
    if (this.expanding) {
      this.expandProgress = Math.min(1, this.expandProgress + dt * 2)
      if (this.expandDirection === 'expand' && this.expandProgress >= 1) {
        this.onCardExpanded(this.expandedIdx)
      }
      if (this.expandDirection === 'collapse' && this.expandProgress >= 1) {
        this.expanding = false
        this.expandedIdx = -1
        this.onCardCollapsed()
      }
      return
    }

    // Spring-damper physics for currentIdx toward targetIdx.
    this.dragOff *= 0.85
    const idxDiff = this.targetIdx - this.currentIdx
    const springForce = idxDiff * this.idxStiffness
    const dampingForce = -this.idxVelocity * this.idxDamping
    this.idxVelocity += (springForce + dampingForce) * dt
    this.currentIdx += this.idxVelocity * dt

    // Snap when close enough.
    if (Math.abs(idxDiff) < 0.001 && Math.abs(this.idxVelocity) < 0.01) {
      this.currentIdx = this.targetIdx
      this.idxVelocity = 0
    }

    // Rotate the baku cube to show the current project face.
    // Live drag offset is added to the rotation for real-time swipe feedback.
    // During active drag, follow the target more aggressively (dt*18) so the
    // cube tracks the finger/mouse with minimal lag; when settling after
    // release, use a softer lerp (dt*8) for a smooth spring feel.
    if (this.baku) {
      const targetRotY = -((this.currentIdx * Math.PI) / 2) - this.dragOff
      const lerpFactor = this.dragging ? Math.min(1, dt * 18) : Math.min(1, dt * 8)
      this.baku.rotation.y = THREE.MathUtils.lerp(
        this.baku.rotation.y,
        targetRotY,
        lerpFactor,
      )
    }
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onPointerDown, true)
    window.removeEventListener('pointermove', this.onPointerMove, true)
    window.removeEventListener('pointerup', this.onPointerUp, true)
    window.removeEventListener('pointercancel', this.onPointerUp, true)
    window.removeEventListener('keydown', this.onKey)
    if (this.wheelHandler) window.removeEventListener('wheel', this.wheelHandler)
    if (this.wheelAccumTimer) clearTimeout(this.wheelAccumTimer)
    for (const tex of this.textures) {
      tex?.dispose()
    }
    this.textures = []
  }
}
