// WorksPortfolio — 3D card carousel for works page
import * as THREE from 'three'
import { type Project } from '../core/types'

interface ProjectCard {
  group: THREE.Group
  mesh: THREE.Mesh
  mat: THREE.MeshStandardMaterial
  color: THREE.Color
}

export class WorksPortfolio {
  public readonly group = new THREE.Group()
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
  declare onCardClick: (index: number) => void

  constructor(
    private readonly projects: Project[],
    onCardClick: (index: number) => void = () => {}
  ) {
    this.group.name = 'works-portfolio'
    this.onCardClick = onCardClick
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
        color: new THREE.Color(0x222222),
        emissive: col.clone().multiplyScalar(2),
        emissiveIntensity: 3,
        roughness: 0.2,
        metalness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { idx: i }
      grp.add(mesh)
      mesh.lookAt(0, 0.5, 10)
      grp.lookAt(0, 0.5, 10)
      this.group.add(grp)

      this.cards.push({ group: grp, mesh, mat, color: col })
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
    if (e.key === 'ArrowRight' || e.key === ' ') this.goTo(this.currentIdx + 1)
    if (e.key === 'ArrowLeft') this.goTo(this.currentIdx - 1)
  }

  private onPointerDown = (e: PointerEvent) => {
    this.dragging = true
    this.dragStartX = e.clientX
    this.lastX = e.clientX
    this.lastT = performance.now()
    this.vel = 0
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragOff = (e.clientX - this.dragStartX) * 0.004
    const now = performance.now()
    const dt = now - this.lastT
    this.vel = dt > 0 ? (e.clientX - this.lastX) / dt : 0
    this.lastX = e.clientX
    this.lastT = now
  }

  private onPointerUp = () => {
    if (!this.dragging) return
    this.dragging = false
    if (Math.abs(this.vel) > 0.12) {
      this.goTo(this.currentIdx + (this.vel > 0 ? -1 : 1))
    }
    this.dragOff = 0
  }

  goTo(idx: number): void {
    this.targetIdx = ((idx % this.projects.length) + this.projects.length) % this.projects.length
    this.onCardClick(this.targetIdx)
  }

  next(): void { this.goTo(this.currentIdx + 1) }
  prev(): void { this.goTo(this.currentIdx - 1) }

  update(dt: number): void {
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

      const emTarget = Math.abs(w) < 0.1 ? 0.6 : 0.15
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
      this.group.remove(card.group)
    }
    this.cards.length = 0
  }
}