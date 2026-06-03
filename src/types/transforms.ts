// src/types/transforms.ts — Pure type-safe world transform definitions (zero Three.js)
/**
 * Lightweight, framework-agnostic transforms. Enables usage in rollup/Vite
 * without pulling in the full Three.js runtime, reducing bundle size.
 */

// ── Vector types (pure number arrays) ──
export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface ColorTuple {
  r: number
  g: number
  b: number
}

// ── Transform interfaces ──
export interface CameraTransform {
  position: Vector3
  target: Vector3
  fov: number
}

export interface BakuTransform {
  position: Vector3
  rotation: Quaternion
  scale: Vector3
  opacity: number
  role: string // 'NORMAL' | 'WIRE' | 'GLASS'
  material: {
    color: ColorTuple
    emissive: ColorTuple
    roughness: number
    metalness: number
  }
}

export interface PostTransform {
  bloom: number
  vignette: number
  grain: number
}

export interface LightTransform {
  ambient: ColorTuple
  ambientColor: ColorTuple
  intensity: number
}

export interface FogTransform {
  color: ColorTuple
  density: number
}

// ── Page/scene structure ──
export interface SceneRecord {
  id: string
  camera: CameraTransform
  baku: BakuTransform
  post: PostTransform
  light: LightTransform
  fog: FogTransform
}

export interface PageScene {
  key: string
  name: string
  scenes: SceneRecord[]
}