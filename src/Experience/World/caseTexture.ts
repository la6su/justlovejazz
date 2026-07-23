// caseTexture.ts — centralised case-texture loader.
//
// BakuCarousel (home) and WorksPlaneStage (/works) both decode project case
// textures. Sharing one loader guarantees identical colour-space, filter and
// anisotropy settings, preventing the quality drift that happened when the
// two files maintained separate (and diverging) TextureLoader callbacks.
//
// Anisotropy is set to 16 — the GPU clamps to its actual maximum, so this is
// safe on both WebGPU and WebGL2. The previous value of 4 produced visible
// aliasing and smearing on oblique carousel cards.

import * as THREE from 'three'

/** High anisotropy — clamped by the GPU to its real maximum (typically 8 or 16). */
export const CASE_ANISOTROPY = 16

/** Load a case texture with the shared colour-space + filter + anisotropy profile. */
export function loadCaseTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.generateMipmaps = true
        tex.anisotropy = CASE_ANISOTROPY
        tex.needsUpdate = true
        resolve(tex)
      },
      undefined,
      reject,
    )
  })
}
