// ProjectCarousel - 3D card carousel for works page
import * as THREE from 'three'
import { type Project } from '../core/types'

interface ICard {
  mesh: THREE.Mesh
  mat: THREE.MeshStandardMaterial
  targetX: number
  targetScale: number
  targetOpacity: number
  targetRotY: number
  texReady: boolean
}

export class ProjectCarousel {
  public readonly group = new THREE.Group()
  private cards: ICard[] = []
  private cur = 0
  private spring = 0
  private dragOff = 0
  private dragging = false
  private vel = 0
  private lastX = 0
  private lastT = 0
  private textureReady = new Set<number>()
  private textureLoads = new Map<number, Promise<void>>()
  private placeholder: THREE.Texture

  constructor(private projects: Project[]) {
    this.group.name = 'carousel'
    this.placeholder = this.createPlaceholder()
    this.build()
    this.bind()
  }

  private createPlaceholder(): THREE.Texture {
    const size = 256
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 60
      data[i + 1] = 60
      data[i + 2] = 70
      data[i + 3] = 255
    }
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    t.needsUpdate = true
    return t
  }

  private build(): void {
    for (let i = 0; i < this.projects.length; i++) {
      const g = new THREE.PlaneGeometry(1.8, 1.2)
      const c = new THREE.Color(this.projects[i].color)
      const m = new THREE.MeshStandardMaterial({
        color: c.clone().multiplyScalar(0.3),
        emissive: c.clone().multiplyScalar(0.05),
        emissiveIntensity: 0.3,
        roughness: 0.15,
        metalness: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
      })
      const mesh = new THREE.Mesh(g, m)
      mesh.userData.idx = i
      this.group.add(mesh)
      this.cards.push({
        mesh, mat: m, targetX: 0, targetScale: 1, targetOpacity: 1, targetRotY: 0, texReady: false,
      })
    }
  }

  private bind(): void {
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('pointermove', this.onMove, { passive: true })
    window.addEventListener('pointerdown', this.onDown, true)
    window.addEventListener('pointerup', this.onUp, true)
    window.addEventListener('pointercancel', this.onUp, true)
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') this.next()
    else if (e.key === 'ArrowLeft') this.prev()
  }
  private onDown = (e: PointerEvent) => {
    this.dragging = true
    this.dragOff = 0
    this.lastX = e.clientX
    this.lastT = performance.now()
    this.vel = 0
  }
  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return
    this.dragOff = (e.clientX - this.lastX) * 0.003
    const t = performance.now()
    const dt = t - this.lastT
    if (dt > 0) this.vel = (e.clientX - this.lastX) / dt
    this.lastX = e.clientX
    this.lastT = t
  }
  private onUp = () => {
    if (!this.dragging) return
    this.dragging = false
    if (Math.abs(this.vel) > 0.15) {
      this.vel > 0 ? this.prev() : this.next()
    }
    this.dragOff = 0
  }

  next() { this.go((this.cur + 1) % this.projects.length) }
  prev() { this.go((this.cur - 1 + this.projects.length) % this.projects.length) }
  go(i: number) { this.spring = ((i % this.projects.length) + this.projects.length) % this.projects.length }

  update(dt: number): void {
    this.dragOff *= 0.85
    const d = this.spring - this.cur
    if (Math.abs(d) > 0.001) this.cur += d * dt * 3
    else this.cur = Math.round(this.cur)

    const n = this.cards.length
    for (let i = 0; i < n; i++) {
      const c = this.cards[i]
      const off = i - this.cur
      let w = (off % n + n) % n
      if (w > n / 2) w -= n

      if (Math.abs(w) > 2.5) {
        c.mat.opacity = THREE.MathUtils.lerp(c.mat.opacity, 0, dt * 2)
        c.mesh.visible = false
        continue
      }
      c.mesh.visible = true

      const depth = Math.min(Math.abs(w) / 1.5, 1)
      const z = -depth * 2.5
      const y = Math.sin(w * 0.8) * 0.15 * (1 - depth)
      const s = THREE.MathUtils.lerp(1, 0.65, depth)
      const op = Math.abs(w) < 0.1 ? 1 : THREE.MathUtils.lerp(1, 0.2, depth)
      const ry = w * -0.08 * (1 - depth * 0.6)
      const em = Math.abs(w) < 0.1 ? 0.6 : 0.15

      c.mesh.position.x = THREE.MathUtils.lerp(c.mesh.position.x, w * 0.5, dt * 4)
      c.mesh.position.y = THREE.MathUtils.lerp(c.mesh.position.y, y, dt * 4)
      c.mesh.position.z = THREE.MathUtils.lerp(c.mesh.position.z, z, dt * 4)
      c.mesh.scale.setScalar(THREE.MathUtils.lerp(c.mesh.scale.x, s, dt * 4))
      c.mesh.rotation.y = THREE.MathUtils.lerp(c.mesh.rotation.y, ry, dt * 4)
      c.mat.opacity = THREE.MathUtils.lerp(c.mat.opacity, op, dt * 3)
      c.mat.emissiveIntensity = THREE.MathUtils.lerp(c.mat.emissiveIntensity, em, dt * 3)

      if (!this.textureReady.has(i)) {
        this.scheduleTexture(i)
      }
    }
  }

  private scheduleTexture(idx: number): void {
    if (this.textureReady.has(idx)) return
    const p = this.loadTexture(idx)
    this.textureLoads.set(idx, p)
  }

  private loadTexture(idx: number): Promise<void> {
    return new Promise((resolve) => {
      const proj = this.projects[idx]
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const tex = new THREE.Texture(img)
        tex.needsUpdate = true
        const c = this.cards[idx]
        if (c.mat) c.mat.map = tex
        this.textureReady.add(idx)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = proj.textureUrl
    })
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('pointerdown', this.onDown, true)
    window.removeEventListener('pointermove', this.onMove, true)
    window.removeEventListener('pointerup', this.onUp, true)
    window.removeEventListener('pointercancel', this.onUp, true)
    this.cards.forEach(c => {
      c.mesh.geometry?.dispose()
      c.mat.dispose()
      c.mesh.parent?.remove(c.mesh)
      if (c.mat.map && !this.textureReady.has(c.mesh.userData.idx)) {
        c.mat.map.dispose()
      }
    })
    this.cards.length = 0
    this.textureReady.clear()
    this.textureLoads.clear()
    this.placeholder.dispose()
  }
}
