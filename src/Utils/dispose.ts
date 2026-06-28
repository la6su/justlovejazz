import type * as THREE from 'three'

/**
 * Dispose all GPU textures attached to a material (map, normalMap, roughnessMap,
 * metalnessMap, emissiveMap, alphaMap, bumpMap, displacementMap) and then the
 * material itself.
 *
 * Three.js `material.dispose()` does NOT dispose its textures — they must be
 * disposed explicitly or they leak VRAM. This helper prevents that leak for
 * any material that carries texture maps.
 */
export function disposeMaterialDeep(mat: THREE.Material | undefined | null): void {
  if (!mat) return
  const m = mat as THREE.Material & {
    map?: THREE.Texture
    normalMap?: THREE.Texture
    roughnessMap?: THREE.Texture
    metalnessMap?: THREE.Texture
    emissiveMap?: THREE.Texture
    alphaMap?: THREE.Texture
    bumpMap?: THREE.Texture
    displacementMap?: THREE.Texture
  }
  m.map?.dispose()
  m.normalMap?.dispose()
  m.roughnessMap?.dispose()
  m.metalnessMap?.dispose()
  m.emissiveMap?.dispose()
  m.alphaMap?.dispose()
  m.bumpMap?.dispose()
  m.displacementMap?.dispose()
  m.dispose()
}
