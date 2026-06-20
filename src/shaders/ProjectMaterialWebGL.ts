import * as THREE from 'three'
import type { IGalleryCardSurface } from './GalleryCardSurface'

/** WebGL2 path: simple textured plane (no TSL / node materials). */
export class ProjectMaterialWebGL implements IGalleryCardSurface {
  readonly material: THREE.MeshBasicMaterial

  constructor(map: THREE.Texture, colorHex: string) {
    this.material = new THREE.MeshBasicMaterial({
      map,
      color: new THREE.Color(colorHex),
      toneMapped: false,
    })
  }

  setProgress(_value: number) {
    // Expand transition is WebGPU-only for now; WebGL shows static card.
  }

  dispose() {
    this.material.dispose()
  }
}
