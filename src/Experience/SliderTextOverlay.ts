import * as THREE from 'three'
import { Text as TroikaText } from 'troika-three-text'
import { type Project } from '../core/types'

export class SliderTextOverlay {
  public group: THREE.Group
  private meshes: any[] = []
  private mats: THREE.MeshBasicMaterial[] = []
  private fade = 1

  constructor(project: Project) {
    this.group = new THREE.Group()

    const c = new THREE.Color(project.color).multiplyScalar(1.8)

    const mk = (txt: string, sz: number, al: number, y: number, letterSpacing = 0) => {
      const t = new TroikaText() as any
      t.text = txt
      t.fontSize = sz
      t.fontWeight = sz > 40 ? 700 : 400
      t.anchorX = 'center'
      t.anchorY = 'middle'
      t.font = 'Inter'
      t.letterSpacing = letterSpacing
      t.fontSize *= window.devicePixelRatio > 1 ? 0.9 : 1
      const rm = new THREE.MeshBasicMaterial({
        color: c.clone().multiplyScalar(al),
        transparent: true,
        opacity: 1,
        depthWrite: false,
      })
      t.material = rm
      t.position.set(0, y, 6)
      this.group.add(t as unknown as THREE.Object3D)
      this.meshes.push(t)
      this.mats.push(rm)
    }

    mk(project.title.toUpperCase(), 82, 1, 2.05, 0.02)
    mk((project.category || 'untitled').toUpperCase(), 22, 0.62, 1.47, 0.05)
    mk(`(${project.year || ''})`, 18, 0.38, 1.2, 0.08)

    // Batch font load
    const loadAll = async () => {
      for (const _ of this.meshes) await new Promise(r => setTimeout(r, 1500))
    }
    loadAll()
  }

  setFade(v: number) {
    this.fade = THREE.MathUtils.clamp(v, 0, 1)
    for (const m of this.mats) m.opacity = this.fade
  }

  update(_dt: number) {}

  dispose() {
    for (const m of this.meshes) m.dispose?.()
    for (const m of this.mats) m.dispose()
  }
}
