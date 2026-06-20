import type { Material } from 'three'

/** Common contract for WebGPU (TSL) and WebGL gallery card materials. */
export interface IGalleryCardSurface {
  readonly material: Material
  setProgress(value: number): void
  dispose(): void
}
