// WorksPortfolio — 3D card carousel for works page
// Cards carry project textures. On tap (raycast), the active card morphs to
// fullscreen (position + scale animation), then DOM detail overlay appears.
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
  // Shared loader — creating one per card wastes resources.
  private static readonly sharedLoader = new THREE.TextureLoader()
  private cards: ProjectCard[] = []
  private currentIdx = 0
  private targetIdx = 0
  private dragOff = 0
  private dragging = false
  private dragStartX = 0
  private vel = 0
  private lastX = 0
  private lastT = 0
  private spacing = 4.0
  private cardW = 3.0
  private cardH = 2.0

  // Raycaster for tap detection on 3D card meshes.
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private camera: THREE.Camera | null = null

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

      // Texture starts null — loaded lazily when card becomes active.
      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { idx: i, texLoaded: false, texUrl: proj.textureUrl || proj.detailTextureUrl }
      grp.add(mesh)
      mesh.lookAt(0, 0.5, 10)
      grp.lookAt(0, 0.5, 10)
      this.group.add(grp)

      this.cards.push({ group: grp, mesh, mat, color: col, texture: null })
    }
    // Preload the first card immediately so it's visible on first render.
    this.loadCardTexture(0)
  }

  /**
   * Load texture for a card if not already loaded. Called when card
   * becomes active (current) or adjacent (preload neighbors).
   */
  private loadCardTexture(idx: number): void {
    if (idx < 0 || idx >= this.cards.length) return
    const card = this.cards[idx]
    const mesh = card.mesh
    if (mesh.userData.texLoaded || !mesh.userData.texUrl) return

    mesh.userData.texLoaded = true
    WorksPortfolio.sharedLoader.load(mesh.userData.texUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      card.mat.map = tex
      card.mat.emissiveIntensity = 0.2
      card.mat.needsUpdate = true
      card.texture = tex
    })
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
    // Ignore clicks on UI overlay/modal/nav — they have their own handlers.
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
    // Live drag offset for visual feedback during swipe.
    this.dragOff = (e.clientX - this.dragStartX) * 0.004
    const now = performance.now()
    const dt = now - this.lastT
    this.vel = dt > 0 ? (e.clientX - this.lastX) / dt : 0
    this.lastX = e.clientX
    this.lastT = now
  }

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragging = false
    if (this.cards.length === 0) { this.dragOff = 0; return }
    const target = e.target as HTMLElement
    if (target.closest('.jlz-works-ui, #project-modal, #jlj-splash, #main-nav')) {
      this.dragOff = 0
      return
    }
    const dragDistance = Math.abs(e.clientX - this.dragStartX)
    if (Math.abs(this.vel) > 0.12) {
      // Swipe with velocity → change project.
      this.goTo(this.currentIdx + (this.vel > 0 ? -1 : 1))
    } else if (dragDistance < 8) {
      // Tap → raycast to find which card was clicked.
      const hitIdx = this.raycastCard(e.clientX, e.clientY)
      if (hitIdx >= 0) {
        // If clicked card is not current, navigate to it first.
        if (hitIdx !== this.currentIdx) {
          this.goTo(hitIdx)
        }
        // Activate (open detail) for the clicked card.
        this.onCardActivate(hitIdx)
      }
      // If raycast missed (clicked empty space), do nothing.
    } else if (dragDistance > 40) {
      // Slow drag beyond threshold → change project in drag direction.
      this.goTo(this.currentIdx + (e.clientX < this.dragStartX ? 1 : -1))
    }
    this.dragOff = 0
  }

  /**
   * Raycast from screen coords against card meshes.
   * Returns card index if hit, -1 if missed.
   */
  private raycastCard(clientX: number, clientY: number): number {
    if (!this.camera) return -1
    // Convert to NDC (-1 to 1).
    this.pointer.x = (clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    // Collect visible card meshes.
    const meshes: THREE.Object3D[] = []
    for (const card of this.cards) {
      if (card.group.visible) meshes.push(card.mesh)
    }
    if (meshes.length === 0) return -1

    const intersects = this.raycaster.intersectObjects(meshes, false)
    if (intersects.length === 0) return -1

    const hit = intersects[0].object as THREE.Mesh
    const idx = hit.userData?.idx
    return typeof idx === 'number' ? idx : -1
  }

  goTo(idx: number): void {
    this.targetIdx = ((idx % this.projects.length) + this.projects.length) % this.projects.length
    // Lazy-load: load texture for target card + preload neighbors.
    this.loadCardTexture(this.targetIdx)
    this.loadCardTexture(this.targetIdx + 1)
    this.loadCardTexture(this.targetIdx - 1)
    this.onCardClick(this.targetIdx)
  }

  next(): void { this.goTo(this.currentIdx + 1) }
  prev(): void { this.goTo(this.currentIdx - 1) }

  /** Set camera reference for raycasting. Call from Experience after init. */
  setCamera(cam: THREE.Camera): void {
    this.camera = cam
  }

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
    // Can collapse even if expanding animation finished (expanding=false)
    // — we just need a valid expandedIdx.
    if (this.expandedIdx < 0) return
    if (this.cards[this.expandedIdx] === undefined) return
    this.expandDirection = 'collapse'
    this.expandProgress = 0
    this.expanding = true
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
          // Expand complete — card is fullscreen. Keep expanding=true so
          // collapse can run. Notify Experience to open detail overlay.
          this.onCardExpanded(this.expandedIdx)
          // Stop the expand animation loop (card stays fullscreen).
          this.expanding = false
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
      // Add live dragOff so swipe moves cards in real-time during drag.
      const x = (w + this.dragOff) * this.spacing
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
