// CameraAnchors.ts — Blender-style named anchor points for camera choreography.
//
// Instead of hardcoded camera positions in WorldConfig, anchors provide named
// spatial points the camera can fly between. This decouples camera intent
// ("go to the about anchor") from the concrete position/lookAt/fov values.
//
// Anchors are derived from WorldConfig section transforms at init time, but
// can be added/modified at runtime (e.g. for cinematic focus on a specific
// 3D object). The camera system lerps between anchors driven by scroll.

import * as THREE from 'three'
import type { CameraTarget } from './types'

export interface CameraAnchor extends CameraTarget {
  /** Unique name (e.g. 'intro', 'about', 'about-detail'). */
  name: string
  /** Section index this anchor belongs to (for scroll mapping). */
  sectionIndex: number
  /** Optional: focus object (camera looks at this object's position). */
  focusObject?: THREE.Object3D
}

export class CameraAnchorSystem {
  private anchors: Map<string, CameraAnchor> = new Map()
  private sectionAnchors: CameraAnchor[] = []

  /** Register an anchor. If focusObject is set, lookAt is updated each frame. */
  register(anchor: CameraAnchor): void {
    this.anchors.set(anchor.name, anchor)
    // Rebuild section-indexed array
    this.sectionAnchors = Array.from(this.anchors.values()).sort(
      (a, b) => a.sectionIndex - b.sectionIndex,
    )
  }

  /** Get anchor by name. */
  get(name: string): CameraAnchor | undefined {
    return this.anchors.get(name)
  }

  /** Get the from/to anchors for a given scroll progress (0..1). */
  getBlendTargets(scrollProgress: number, sectionCount: number): {
    from: CameraAnchor
    to: CameraAnchor
    t: number
  } | null {
    if (this.sectionAnchors.length === 0) return null
    const scaled = scrollProgress * (sectionCount - 1)
    const fromIdx = Math.floor(scaled)
    const toIdx = Math.min(fromIdx + 1, sectionCount - 1)
    const t = scaled - fromIdx
    return {
      from: this.sectionAnchors[fromIdx] ?? this.sectionAnchors[0]!,
      to: this.sectionAnchors[toIdx] ?? this.sectionAnchors[0]!,
      t,
    }
  }

  /** Update focus-object-based lookAt for all anchors (call each frame). */
  updateFocusTargets(): void {
    for (const anchor of this.anchors.values()) {
      if (anchor.focusObject) {
        anchor.lookAt.copy(anchor.focusObject.position)
      }
    }
  }

  /** Get all registered anchors (for debugging / DevPanel). */
  getAll(): CameraAnchor[] {
    return Array.from(this.anchors.values())
  }
}

/** Singleton — shared across Experience, World, Camera. */
let _instance: CameraAnchorSystem | null = null
export function getCameraAnchors(): CameraAnchorSystem {
  if (!_instance) _instance = new CameraAnchorSystem()
  return _instance
}
