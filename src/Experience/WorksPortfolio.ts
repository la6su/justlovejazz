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
  private textures: (THREE.Texture | null)[] = []
  private texturesLoaded = false
  private baku: THREE.Object3D | null = null
  private expanding = false
  private expandProgress = 0
  private expandDirection: 'expand' | 'collapse' = 'expand'
  private expandedIdx = -1

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
    onCardCollapsed: () => void = () => {}
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
      const url = this.projects[i].textureUrl || this.projects[i].detailTextureUrl
      if (!url) { loaded++; continue }
      WorksPortfolio.sharedLoader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        this.textures[i] = tex
        loaded++
        // Apply to cube once all textures are loaded.
        if (loaded >= this.projects.length) {
          this.applyTexturesToCube()
        }
      }, undefined, () => { loaded++ })
    }
  }

  private applyTexturesToCube(): void {
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
  }

  private onKey = (e: KeyboardEvent) => {
    if (this.expanding) return
    if (e.key === 'ArrowRight' || e.key === ' ') this.goTo(this.currentIdx + 1)
    if (e.key === 'ArrowLeft') this.goTo(this.currentIdx - 1)
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.expanding) return
    if (!this.group.visible) return
    const target = e.target as HTMLElement
    if (target.closest('.jlz-works-ui, #project-modal, #jlj-splash, #main-nav')) return
    this.dragging = true
    this.dragStartX = e.clientX
    this.lastX = e.clientX
    this.lastT = performance.now()
    this.vel = 0
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragOff = (e.clientX - this.dragStartX) * 0.005
    const now = performance.now()
    const dt = now - this.lastT
    this.vel = dt > 0 ? (e.clientX - this.lastX) / dt : 0
    this.lastX = e.clientX
    this.lastT = now
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false
    const dragDist = Math.abs(e.clientX - this.dragStartX)
    if (this.vel > 0.12 || dragDist > 40) {
      this.goTo(e.clientX < this.dragStartX ? this.currentIdx + 1 : this.currentIdx - 1)
    } else if (dragDist < 8) {
      // Tap — activate card
      this.onCardActivate(this.currentIdx)
    }
    this.dragOff = 0
  }

  goTo(idx: number): void {
    const n = this.projects.length
    this.targetIdx = ((idx % n) + n) % n
    this.onCardClick(this.targetIdx)
  }

  next(): void { this.goTo(this.currentIdx + 1) }
  prev(): void { this.goTo(this.currentIdx - 1) }

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
    if (this.baku) {
      const targetRotY = -(this.currentIdx * Math.PI / 2) - this.dragOff
      this.baku.rotation.y = THREE.MathUtils.lerp(
        this.baku.rotation.y, targetRotY, Math.min(1, dt * 8)
      )
    }
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onPointerDown, true)
    window.removeEventListener('pointermove', this.onPointerMove, true)
    window.removeEventListener('pointerup', this.onPointerUp, true)
    window.removeEventListener('pointercancel', this.onPointerUp, true)
    window.removeEventListener('keydown', this.onKey)
    for (const tex of this.textures) {
      tex?.dispose()
    }
    this.textures = []
  }
}
