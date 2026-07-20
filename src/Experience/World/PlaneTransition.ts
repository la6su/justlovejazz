// PlaneTransition — unified plane-to-fullscreen handoff animation.
//
// Used by both BakuCarousel (home works slider) and WorksPlaneStage (/works page)
// to animate a CasePlane from its current position/scale/rotation to a
// camera-facing fullscreen fill. At 86% completion, a callback fires to open
// the DOM overlay while the real 3D plane still fills the viewport.
//
// The CasePlane's TSL `setTransition(t)` drives a per-instance opacity/fade
// shader effect that creates the visual handoff.

import * as THREE from 'three'
import type { CasePlane } from './CasePlane'
import { prefersReducedMotion } from '../../core/motionPolicy'

export const TRANSITION_DURATION = 1.15 // seconds
export const TRANSITION_TAKEOVER = 0.86 // fraction when DOM overlay opens
export const CASE_PLANE_HEIGHT = 9 / 16

export interface TransitionState {
  card: CasePlane
  index: number
  time: number
  started: boolean
  reducedMotion: boolean
  openOverlay: (index: number) => void
  startPosition: THREE.Vector3
  startScale: number
  startRotation: THREE.Euler | THREE.Quaternion
  /** For quaternion-based rotations (BakuCarousel) */
  startQuaternion?: THREE.Quaternion
}

/** Create a new transition state for a card. */
export function beginTransition(
  card: CasePlane,
  index: number,
  openOverlay: (index: number) => void,
  startRotation?: THREE.Euler | THREE.Quaternion,
): TransitionState {
  return {
    card,
    index,
    time: 0,
    started: false,
    reducedMotion: prefersReducedMotion(),
    openOverlay,
    startPosition: card.position.clone(),
    startScale: card.scale.x,
    startRotation: startRotation?.clone() ?? card.rotation.clone(),
    startQuaternion: startRotation instanceof THREE.Quaternion ? startRotation.clone() : undefined,
  }
}

/** Advance the transition by dt. Returns true when the overlay callback has fired. */
export function updateTransition(
  state: TransitionState,
  dt: number,
  camera: THREE.Camera,
  groupWorldQuaternion?: THREE.Quaternion,
): boolean {
  state.time = state.reducedMotion ? 1 : Math.min(1, state.time + dt / TRANSITION_DURATION)
  const t = state.time

  // Compute camera-facing fullscreen position/scale
  const cameraPosition = new THREE.Vector3()
  const cameraDirection = new THREE.Vector3()
  camera.getWorldPosition(cameraPosition)
  camera.getWorldDirection(cameraDirection)
  const fullscreenPosition = cameraPosition.clone().addScaledVector(cameraDirection, 0.92)

  let fullscreenScale = 1
  const perspCam = camera as THREE.PerspectiveCamera
  if (perspCam.isPerspectiveCamera) {
    const frameHeight = 2 * Math.tan(THREE.MathUtils.degToRad(perspCam.fov * 0.5)) * 0.92
    const frameWidth = frameHeight * perspCam.aspect
    fullscreenScale = Math.max(frameWidth, frameHeight / CASE_PLANE_HEIGHT) * 1.015
  }

  // Smoothstep interpolation
  const focus = THREE.MathUtils.smoothstep(t / 0.9, 0, 1)

  // Interpolate position
  if (groupWorldQuaternion && state.startQuaternion) {
    // Quaternion-based (BakuCarousel): transform target to group local space
    const targetLocal = fullscreenPosition.clone()
    const camQuat = new THREE.Quaternion()
    camera.getWorldQuaternion(camQuat)
    const invGroupQuat = groupWorldQuaternion.clone().invert()
    camQuat.premultiply(invGroupQuat)
    targetLocal.applyQuaternion(invGroupQuat)

    state.card.position.lerpVectors(state.startPosition, targetLocal, focus)
    state.card.quaternion.slerpQuaternions(state.startQuaternion, camQuat, focus)
  } else {
    // Euler-based (WorksPlaneStage): simple lerp
    const targetPosition = new THREE.Vector3(0, 0, -0.92)
    state.card.position.lerpVectors(state.startPosition, targetPosition, focus)
    state.card.rotation.set(
      THREE.MathUtils.lerp((state.startRotation as THREE.Euler).x, 0, focus),
      THREE.MathUtils.lerp((state.startRotation as THREE.Euler).y, 0, focus),
      THREE.MathUtils.lerp((state.startRotation as THREE.Euler).z, 0, focus),
    )
  }

  // Interpolate scale
  state.card.scale.setScalar(THREE.MathUtils.lerp(state.startScale, fullscreenScale, focus))

  // Drive CasePlane TSL transition shader
  state.card.setReveal(1)
  state.card.setMotion(0, 1)
  state.card.setEdgeWarp(0)
  state.card.setParallax(0)
  state.card.setTransition(THREE.MathUtils.smoothstep(t, 0, 1))
  state.card.update(dt, true)

  // Fire overlay callback at takeover point
  if (!state.started && t >= TRANSITION_TAKEOVER) {
    state.started = true
    state.openOverlay(state.index)
    return true
  }
  return false
}

/** Reset the transition (called when overlay closes). */
export function resetTransition(state: TransitionState | null): void {
  state?.card.setTransition(0)
}