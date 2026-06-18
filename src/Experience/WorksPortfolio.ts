// WorksPortfolio — 3D card carousel for works page
// Cards carry project textures. On tap, the active card morphs to fullscreen
// (position + scale animation), then DOM detail overlay appears on top.
import * as THREE from 'three'
import { type Project } from '../core/types'

interface ProjectCard {
  group: THREE.Group
  mesh: THREE.Mesh
  mat: THREE.MeshStandardMaterial
  color: THREE.Color
  texture: THREE.Texture | null
}

/** Easing — easeInOutCubic for smooth expand/collapse. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export class WorksPortfolio {
  public readonly group = new THREE.Group()
  private cards: ProjectCard[] = []
  private currentIdx = 0
  private targetIdx = 0
  private dragOff = 0
  private dragging = false
  private dragStartX = 0
  private spacing = 4.0
  private cardW = 3.0
  private cardH = 2.0

  // Expand transition state
  private expanding = false
  private expandProgress = 0 // 0 = normal carousel, 1 = fullscreen
  private expandDirection: 'expand' | 'collapse' = 'expand'
  private expandedIdx = -1
  // Stored start/end transforms for the expanding card
  private expandStart = { x: 0, y: 0, z: 0, scale: 1 }
  private expandTarget = { x: 0, y: 0, z: 0, scale: 1 }

  declare onCardClick: (index: number) => void
  declare onCardActivate: (index: number) => void
  /** Called when expand animation reaches peak (progress=1) → open detail. */
  declare onCardExpanded: (index: number) => void
  /** Called when collapse animation finishes → return to carousel. */
  declare onCardCollapsed: () => void

  constructor(
    private readonly projects: Project[],
    onCardClick: (index: number) => void = () => {},
    onCardActivate: (index: number) => void = () => {},
    onCardExpanded: (index: number) => void = () => {},
    onCardCollapsed: () => void = () => {}
  ) {
    this.group.name = 'works-portfolio'
    this.onCardClick = onCardClick
    this.onCardActivate = onCardActivate
    this.onCardExpanded = onCardExpanded
    this.onCardCollapsed = onCardCollapsed
    this.buildCards()
    this.bindEvents()
  }

  private buildCards(): void {
    const loader = new THREE.TextureLoader()
    for (let i = 0; i < this.projects.length; i++) {
      const proj = this.projects[i]
      const grp = new THREE.Group()
      grp.name = 'card-' + i

      const geo = new THREE.PlaneGeometry(this.cardW, this.cardH)
      const col = new THREE.Color(proj.color)

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x111111),
        emissive: col.clone().multiplyScalar(1.5),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.7,
        side: THREE.DoubleSide,
        transparent: true,
      })

      // Load project texture asynchronously, apply when ready.
      const texUrl = proj.textureUrl || proj.detailTextureUrl
      let texture: THREE.Texture | null = null
      if (texUrl) {
        loader.load(texUrl, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          mat.map = tex
          mat.emissiveIntensity = 0.2
          mat.needsUpdate = true
          texture = tex
        })
      }

      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { idx: i }
      grp.add(mesh)
      mesh.lookAt(0, 0.5, 10)
      grp.lookAt(0, 0.5, 10)
      this.group.add(grp)

      this.cards.push({ group: grp, mesh, mat, color: col, texture })
    }
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
    // Track pointer down position for tap detection (no swipe drag).
    this.dragging = true
    this.dragStartX = e.clientX
  }

  private onPointerMove = (e: PointerEvent) => {
    // No swipe drag — slider moves only via keyboard arrows / UI buttons.
    // Keep this handler for potential future cursor-follow effects only.
    void e
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false
    if (this.cards.length === 0) { this.dragOff = 0; return }
    // Tap = pointerup with minimal movement (< 8px) → activate card.
    // Swipe drag is intentionally disabled — use arrow keys to navigate.
    const dragDistance = Math.abs(e.clientX - this.dragStartX)
    if (dragDistance < 8) {
      const safeIdx = ((this.currentIdx % this.cards.length) + this.cards.length) % this.cards.length
      this.onCardActivate(safeIdx)
    }
    this.dragOff = 0
  }

  goTo(idx: number): void {
    this.targetIdx = ((idx % this.projects.length) + this.projects.length) % this.projects.length
    this.onCardClick(this.targetIdx)
  }

  next(): void { this.goTo(this.currentIdx + 1) }
  prev(): void { this.goTo(this.currentIdx - 1) }

  /**
   * Start expanding the given card to fullscreen.
   * Stores the card's current carousel transform as start, computes a
   * fullscreen-cover transform as target. Animation runs in update().
   * Calls onCardExpanded(idx) when progress reaches 1.
   */
  expandCard(idx: number): void {
    if (this.expanding) return
    if (this.cards.length === 0) return
    // Clamp idx into valid range — currentIdx can drift during fast swipes.
    const safeIdx = ((idx % this.cards.length) + this.cards.length) % this.cards.length
    const card = this.cards[safeIdx]
    if (!card) return

    this.expanding = true
    this.expandDirection = 'expand'
    this.expandProgress = 0
    this.expandedIdx = safeIdx

    this.expandStart = {
      x: card.group.position.x,
      y: card.group.position.y,
      z: card.group.position.z,
      scale: card.group.scale.x,
    }
    // Target: center of screen (frontal camera at [0,1,7] looking at [0,1,0]).
    // Push card toward camera (z=4) and scale up to fill viewport.
    this.expandTarget = { x: 0, y: 1, z: 4, scale: 3.5 }
  }

  /**
   * Collapse the expanded card back to its carousel position.
   * Calls onCardCollapsed() when progress reaches 0.
   */
  collapseCard(): void {
    if (!this.expanding || this.expandedIdx < 0) return
    this.expandDirection = 'collapse'
    this.expandProgress = 0
    // Collapse starts from current (expanded) state back to carousel.
    const card = this.cards[this.expandedIdx]
    this.expandStart = {
      x: card.group.position.x,
      y: card.group.position.y,
      z: card.group.position.z,
      scale: card.group.scale.x,
    }
    // Recompute the carousel target position for this idx.
    const w = this.wrapOffset(this.expandedIdx - this.currentIdx, this.cards.length)
    const depth = THREE.MathUtils.clamp(Math.abs(w) / 1.5, 0, 1)
    this.expandTarget = {
      x: w * this.spacing,
      y: 1.0 + Math.sin(w * 0.9) * 0.12 * (1 - depth),
      z: -depth * 2.5,
      scale: THREE.MathUtils.lerp(1, 0.6, depth),
    }
  }

  get isExpanding(): boolean { return this.expanding }

  update(dt: number): void {
    // ── Expand/collapse animation takes priority ──
    if (this.expanding) {
      const speed = 2.0 // 0.5s for full transition
      this.expandProgress = Math.min(this.expandProgress + dt * speed, 1)
      const eased = easeInOutCubic(this.expandProgress)

      const card = this.cards[this.expandedIdx]
      if (card) {
        const x = THREE.MathUtils.lerp(this.expandStart.x, this.expandTarget.x, eased)
        const y = THREE.MathUtils.lerp(this.expandStart.y, this.expandTarget.y, eased)
        const z = THREE.MathUtils.lerp(this.expandStart.z, this.expandTarget.z, eased)
        const s = THREE.MathUtils.lerp(this.expandStart.scale, this.expandTarget.scale, eased)
        card.group.position.set(x, y, z)
        card.group.scale.setScalar(s)
        card.group.rotation.y = THREE.MathUtils.lerp(card.group.rotation.y, 0, eased)
        card.mat.opacity = 1
        card.mat.emissiveIntensity = THREE.MathUtils.lerp(card.mat.emissiveIntensity, 0.1, eased)
      }

      // Fade out other cards during expand, fade in during collapse.
      for (let i = 0; i < this.cards.length; i++) {
        if (i === this.expandedIdx) continue
        const c = this.cards[i]
        const targetOpacity = this.expandDirection === 'expand' ? 0 : 1
        c.mat.opacity = THREE.MathUtils.lerp(c.mat.opacity, targetOpacity, eased)
      }

      if (this.expandProgress >= 1) {
        if (this.expandDirection === 'expand') {
          this.onCardExpanded(this.expandedIdx)
        } else {
          this.expanding = false
          this.expandedIdx = -1
          this.onCardCollapsed()
        }
      }
      return
    }

    // ── Normal carousel update ──
    this.dragOff *= 0.9

    const diff = this.targetIdx - this.currentIdx
    if (Math.abs(diff) > 0.001) {
      this.currentIdx += diff * dt * 3
    } else {
      this.currentIdx = this.targetIdx
    }

    const n = this.projects.length
    for (let i = 0; i < n; i++) {
      const card = this.cards[i]
      const w = this.wrapOffset(i - this.currentIdx, n)

      if (Math.abs(w) > 2.5) {
        card.mat.opacity = THREE.MathUtils.lerp(card.mat.opacity, 0, dt * 2)
        card.group.visible = false
        continue
      }
      card.group.visible = true

      const depth = THREE.MathUtils.clamp(Math.abs(w) / 1.5, 0, 1)
      const x = w * this.spacing
      const z = -depth * 2.5
      const y = Math.sin(w * 0.9) * 0.12 * (1 - depth)
      const scale = THREE.MathUtils.lerp(1, 0.6, depth)
      const rotY = -w * 0.06 * (1 - depth * 0.5)
      const opacity = Math.abs(w) < 0.1 ? 1 : THREE.MathUtils.lerp(1, 0.15, depth)

      card.group.position.x = THREE.MathUtils.lerp(card.group.position.x, x, dt * 4)
      card.group.position.y = THREE.MathUtils.lerp(card.group.position.y, 1.0 + y, dt * 4)
      card.group.position.z = THREE.MathUtils.lerp(card.group.position.z, z, dt * 4)
      card.group.scale.setScalar(THREE.MathUtils.lerp(card.group.scale.x, scale, dt * 4))
      card.group.rotation.y = THREE.MathUtils.lerp(card.group.rotation.y, rotY, dt * 4)
      card.mat.opacity = THREE.MathUtils.lerp(card.mat.opacity, opacity, dt * 3)

      const emTarget = Math.abs(w) < 0.1 ? 0.3 : 0.1
      card.mat.emissiveIntensity = THREE.MathUtils.lerp(card.mat.emissiveIntensity, emTarget, dt * 3)
    }
  }

  private wrapOffset(value: number, n: number): number {
    let w = value % n
    if (w > n / 2) w -= n
    if (w < -n / 2) w += n
    return w
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onPointerDown, true)
    window.removeEventListener('pointermove', this.onPointerMove, true)
    window.removeEventListener('pointerup', this.onPointerUp, true)
    window.removeEventListener('pointercancel', this.onPointerUp, true)
    window.removeEventListener('keydown', this.onKey)

    for (const card of this.cards) {
      card.mesh.geometry?.dispose()
      card.mat.dispose()
      card.texture?.dispose()
      this.group.remove(card.group)
    }
    this.cards.length = 0
  }
}
