import * as THREE from 'three'

/** Shared 1×1 placeholder for gallery cards before real textures load. */
let shared: THREE.DataTexture | null = null

export function getSharedPlaceholderTexture(): THREE.DataTexture {
  if (!shared) {
    shared = new THREE.DataTexture(new Uint8Array([28, 28, 32, 255]), 1, 1, THREE.RGBAFormat)
    shared.needsUpdate = true
    shared.name = 'gallery-placeholder'
  }
  return shared
}
