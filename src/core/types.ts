import * as THREE from 'three'

// NarrativePhase maps to PhaseConfig.id values from WorldConfig.ts.
// Must stay in sync with RAW[i].id — these are the keys used in
// PostProcessingManager.applyPreset() and StateBus section channels.
export enum NarrativePhase {
  INTRO = 'sec_intro',
  ABOUT = 'sec_about',
  FLEXIBLE = 'sec_flexible',
  CHALLENGE = 'sec_challenge',
  INNOVATIVE = 'sec_innovative',
  CONTACT = 'sec_contact',
}

export const NARRATIVE_PHASES = [
  'sec_intro',
  'sec_about',
  'sec_flexible',
  'sec_challenge',
  'sec_innovative',
  'sec_contact',
] as const

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
  globalProgress: number
  bakuPosition: THREE.Vector3
  bakuRotation: THREE.Quaternion
  bakuScale: THREE.Vector3
  bakuOpacity: number
  bakuRole: BakuRole
  bakuMaterial: BakuMaterialState
  envColor: THREE.Color
  envIntensity: number
  uiShowGallery: boolean
  post: {
    bloom: number
    vignette: number
    grain: number
    chromatic: number
  }
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

export enum ViewState {
  LIST = 'list',
  TRANSITIONING = 'transitioning',
  FULLSCREEN = 'fullscreen',
}

export enum CameraState {
  INTRO = 'intro',
  EXPLORE = 'explore',
  DETAIL = 'detail',
  TRANSITION = 'transition',
}
