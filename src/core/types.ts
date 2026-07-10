import * as THREE from 'three'

// NarrativePhase maps to PhaseConfig.id values from WorldConfig.ts.
// Must stay in sync with RAW[i].id — these are the keys used in
// PostProcessingManager.applyPreset() and StateBus section channels.
export enum NarrativePhase {
  INTRO = 'sec_intro',
  ABOUT = 'sec_about',
  CHALLENGE = 'sec_challenge',
  CONTACT = 'sec_contact',
}

export enum BakuRole {
  NORMAL = 'normal',
  GLASS = 'glass',
  WIRE = 'wire',
  GRID = 'grid',
}

export interface CameraTarget {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  fov: number
}

export interface BakuMaterialState {
  role?: BakuRole
  color?: THREE.ColorRepresentation
  emissive?: THREE.ColorRepresentation
  roughness?: number
  metalness?: number
}

export interface WorldState {
  currentPhase: NarrativePhase
  phaseProgress: number
  bakuMaterial: BakuMaterialState
  envColor: THREE.Color
}

export interface Project {
  id: string
  page?: 'home' | 'works' | 'trinity'
  title: string
  description: string
  textureUrl: string
  detailTextureUrl: string
  color: string
  viewPosition: { x: number; y: number; z: number }
  viewLookAt: { x: number; y: number; z: number }
  year?: string
  category?: string
  tags?: string[]
  slug?: string
}
