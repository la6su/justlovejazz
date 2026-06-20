// src/core/TransformsAdapter.ts — Convert pure types ↔ Three.js runtime objects

import * as THREE from 'three'
import type {
  Vector3, Quaternion, ColorTuple, CameraTransform, BakuTransform,
  LightTransform, FogTransform,
} from '../types/transforms'

// ── Pure → THREE ──

export function toVec3(v: Vector3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z)
}

export function toQuat(v: Quaternion): THREE.Quaternion {
  return new THREE.Quaternion(v.x, v.y, v.z, v.w)
}

export function toColor(v: ColorTuple): THREE.Color {
  return new THREE.Color(v.r, v.g, v.b)
}

export function toCameraTransform(t: CameraTransform): {
  position: THREE.Vector3
  target: THREE.Vector3
  fov: number
} {
  return {
    position: toVec3(t.position),
    target: toVec3(t.target),
    fov: t.fov,
  }
}

export function toBakuTransform(t: BakuTransform) {
  return {
    position: toVec3(t.position),
    rotation: toQuat(t.rotation),
    scale: toVec3(t.scale),
    opacity: t.opacity,
    role: t.role,
    material: {
      color: toColor(t.material.color),
      emissive: toColor(t.material.emissive),
      roughness: t.material.roughness,
      metalness: t.material.metalness,
    },
  }
}

export function toLightTransform(t: LightTransform) {
  return {
    ambient: toColor(t.ambient),
    ambientColor: toColor(t.ambientColor),
    intensity: t.intensity,
  }
}

export function toFogTransform(t: FogTransform) {
  return {
    color: toColor(t.color),
    density: t.density,
  }
}

// ── THREE → Pure (for serialization/exports) ──

export function fromVec3(v: THREE.Vector3): Vector3 {
  return { x: v.x, y: v.y, z: v.z }
}

export function fromQuat(q: THREE.Quaternion): Quaternion {
  return { x: q.x, y: q.y, z: q.z, w: q.w }
}

export function fromColor(c: THREE.Color): ColorTuple {
  return { r: c.r, g: c.g, b: c.b }
}
