// caseTexture.ts — centralised case-texture loader with refcount cache.
//
// BakuCarousel (home) and WorksPlaneStage (/works) both decode project case
// textures. Sharing one loader + cache guarantees identical colour-space,
// filter and anisotropy settings AND prevents duplicate GPU textures when
// both consumers request the same URL.
//
// Anisotropy is set to 16 — the GPU clamps to its actual maximum, so this is
// safe on both WebGPU and WebGL2.

import * as THREE from 'three'

/** High anisotropy — clamped by the GPU to its real maximum (typically 8 or 16). */
export const CASE_ANISOTROPY = 16

/**
 * Refcounted texture cache. Maps URL → { texture, refCount }.
 *
 * When `loadCaseTexture(url)` is called, the cache returns the existing
 * texture and increments refCount. When `releaseCaseTexture(url)` is called
 * (by a consumer's dispose()), refCount decrements; at 0 the texture is
 * disposed and removed from the cache.
 *
 * This prevents the ~12 MB GPU waste that happened when BakuCarousel and
 * WorksPlaneStage each loaded their own copy of the same 4 project textures.
 */
const textureCache = new Map<string, { texture: THREE.Texture; refCount: number; loading: Promise<THREE.Texture> }>()

/** Load a case texture with the shared colour-space + filter + anisotropy profile.
 *  Returns a cached texture if one already exists for the URL (refcounted). */
export function loadCaseTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url)
  if (cached) {
    cached.refCount++
    return cached.loading
  }

  const loading = new Promise<THREE.Texture>((resolve, reject) => {
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

  const entry = { texture: null as unknown as THREE.Texture, refCount: 1, loading }
  textureCache.set(url, entry)

  loading.then(
    (tex) => {
      entry.texture = tex
    },
    () => {
      // On load failure, remove the cache entry so a retry can attempt again.
      textureCache.delete(url)
    },
  )

  return loading
}

/** Release a refcount on a cached texture. Disposes the GPU texture when
 *  the last consumer releases it. Call from dispose() methods. */
export function releaseCaseTexture(url: string): void {
  const cached = textureCache.get(url)
  if (!cached) return
  cached.refCount--
  if (cached.refCount <= 0) {
    if (cached.texture) {
      cached.texture.dispose()
    }
    textureCache.delete(url)
  }
}

/** Dispose ALL cached textures. Call from World.dispose() or HMR teardown. */
export function disposeAllCaseTextures(): void {
  for (const { texture } of textureCache.values()) {
    if (texture) texture.dispose()
  }
  textureCache.clear()
}
