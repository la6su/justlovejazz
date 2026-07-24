// tsl-helpers.ts — Typed wrappers around TSL API (three 0.184 has incomplete types).
//
// This file isolates all `as any` / `as unknown as` casts for TSL functions
// into one place. The rest of the codebase imports typed wrappers instead of
// using raw TSL functions with casts.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { bloom as _bloom } from 'three/addons/tsl/display/BloomNode.js'
import { pass as _pass } from 'three/tsl'
import type { Scene, Camera } from 'three'

/**
 * Typed pass() wrapper. Creates a scene pass node for post-processing.
 * three 0.184 TS types for pass() are incomplete — cast isolated here.
 */
export function tslPass(scene: Scene, camera: Camera): {
  getTextureNode: () => unknown
  scene: Scene
  camera: Camera
} {
  return _pass(scene as any, camera as any) as any
}

/**
 * Typed bloom() wrapper. Accepts UniformNode (runtime-correct) despite
 * TS types expecting numbers.
 */
export function tslBloom(
  color: unknown,
  strength: unknown,
  radius: unknown,
  threshold: unknown,
): unknown {
  return (_bloom as any)(color, strength, radius, threshold)
}
