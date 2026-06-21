// src/core/WorldConfig.ts — Page scenes config
// Pure JSON config data → THREE runtime adapter at toPhaseConfig()

import * as THREE from 'three'
import { BakuRole } from './types'

// ── THREE-compatible types (clean, explicit) ──
export interface CameraTransform {
  position: THREE.Vector3
  target: THREE.Vector3
  fov: number
}

export interface BakuTransform {
  position: THREE.Vector3
  rotation: THREE.Quaternion
  scale: THREE.Vector3
  opacity: number
  role: BakuRole
  material: {
    color: THREE.Color
    emissive: THREE.Color
    roughness: number
    metalness: number
  }
}

export interface LightTransform {
  ambient: THREE.Color
  ambientColor: THREE.Color
  intensity: number
}

export interface FogTransform {
  color: THREE.Color
  density: number
}

export interface PostTransform {
  bloom: number
  vignette: number
  grain: number
  chromatic: number
}

export interface SectionLightDef {
  /** Light color */
  color: number
  /** PointLight intensity */
  intensity?: number
  /** PointLight distance (0 = infinite) */
  distance?: number
  /** Position [x, y, z] */
  position: [number, number, number]
}

/** per-section dynamic light definition */
export interface SectionLightDef {
    /** [r, g, b] hex or THREE.Color string */
    /** hex color string or rgba "0xff0000" */
    hexColor: string
    /** light intensity (default: 5) */
    intensity?: number
    /** light distance/fall-off radius (0 = infinite) */
    distance?: number
    /** [x, y, z] position in world space */
    position: [number, number, number]
}

export interface PhaseConfig {
  id: string
  context: string
  range: [number, number]
  camera: CameraTransform
  /** FOV pop amplitude on section arrival (Track 5: per-section, replaces global magic number). */
  camFovOffset: number
  /** FOV pop transition duration in seconds. */
  camFovDuration: number
  /** Camera position/target lerp smoothing factor (higher = snappier). */
  camSmoothing: number
  baku: BakuTransform
  lighting: LightTransform
  fog: FogTransform
  post: PostTransform
  ui: { showGallery: boolean }
  background: number
  /** Per-section dynamic lights (Q6). Applied on section arrival. */
  sectionLights?: SectionLightDef[]
        /** per-section point lights */
}

// ── Pure data (no Three.js, bundle-friendly shape) ──
// Stored as {x,y,z} etc. Converted via toPhaseConfig to THREE objects.
type RawScene = {
  id: string
  camPos: [number, number, number]
  camTarget: [number, number, number]
  camFov: number
  bakuRole: BakuRole
  bakuOpacity: number
  bakuColor: number
  bakuEmissive: number
  postBloom: number
  postVignette: number
  postGrain: number
  lightColor: number
  lightIntensity: number
  fogColor: number
  fogDensity: number
  postChromatic: number
  bgColor: number
  // Track 5: per-section camera arrival tuning (replaces global SECTION_TRANSITION).
  camFovOffset: number
  camFovDuration: number
  camSmoothing: number
}

const RAW: RawScene[] = [
  { id: 'step01', camPos: [0,0.5,7], camTarget: [0,0,-2], camFov: 50, bakuRole: BakuRole.NORMAL, bakuOpacity: 1, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.3, postVignette: 0.6, postGrain: 0.025, lightColor: 0x050810, lightIntensity: 0.8, fogColor: 0x050810, fogDensity: 0.025, postChromatic: 0.004, bgColor: 0x050507, camFovOffset: 0.3, camFovDuration: 0.8, camSmoothing: 5 },
  { id: 'step02', camPos: [0,1,6], camTarget: [0,0,0], camFov: 55, bakuRole: BakuRole.WIRE, bakuOpacity: 0.6, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.4, postVignette: 0.5, postGrain: 0.02, lightColor: 0x080812, lightIntensity: 1.2, fogColor: 0x080812, fogDensity: 0.02, postChromatic: 0.003, bgColor: 0x08080c, camFovOffset: 0.4, camFovDuration: 0.9, camSmoothing: 5 },
  { id: 'step03', camPos: [0,1,7], camTarget: [0,1,0], camFov: 50, bakuRole: BakuRole.WIRE, bakuOpacity: 0.4, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.4, postVignette: 0.4, postGrain: 0.02, lightColor: 0x06080e, lightIntensity: 1.2, fogColor: 0x06080e, fogDensity: 0.02, postChromatic: 0.005, bgColor: 0x060608, camFovOffset: 0.5, camFovDuration: 1.0, camSmoothing: 6 },
  { id: 'step04', camPos: [0,1,7], camTarget: [0,1,0], camFov: 50, bakuRole: BakuRole.NORMAL, bakuOpacity: 0.2, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.15, postVignette: 0.6, postGrain: 0.04, lightColor: 0x040608, lightIntensity: 0.6, fogColor: 0x040608, fogDensity: 0.04, postChromatic: 0.005, bgColor: 0x040406, camFovOffset: 0.2, camFovDuration: 0.7, camSmoothing: 3 },
  { id: 'step05', camPos: [0,0,5], camTarget: [0,2,0], camFov: 50, bakuRole: BakuRole.GLASS, bakuOpacity: 1, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.6, postVignette: 0.5, postGrain: 0.02, lightColor: 0x080a14, lightIntensity: 2, fogColor: 0x080a14, fogDensity: 0.05, postChromatic: 0.005, bgColor: 0x050608, camFovOffset: 0.6, camFovDuration: 1.1, camSmoothing: 7 },
  { id: 'step06', camPos: [-2,10,8], camTarget: [0,8,-5], camFov: 60, bakuRole: BakuRole.WIRE, bakuOpacity: 0.3, bakuColor: 0x111111, bakuEmissive: 0x020202, postBloom: 0.3, postVignette: 0.4, postGrain: 0.03, lightColor: 0x06080c, lightIntensity: 1, fogColor: 0x06080c, fogDensity: 0.02, postChromatic: 0.005, bgColor: 0x060608, camFovOffset: 0.35, camFovDuration: 0.85, camSmoothing: 5 },
]

const PAGE_MAP: Record<string, RawScene[]> = {
  trinity: RAW.slice(0, 2),
  works: RAW.slice(2, 4),
  home: RAW.slice(4, 6),
}

// ── Runtime helpers ──
const _toVec = (v: [number, number, number]) => new THREE.Vector3(...v)
const _toColor = (hex: number) => new THREE.Color(hex)

export function toPhaseConfig(raw: RawScene): PhaseConfig {
  const pos = _toVec(raw.camPos)
  const tgt = _toVec(raw.camTarget)
  const bakuPos = new THREE.Vector3()
  const bakuRot = new THREE.Quaternion()
  const bakuSc = new THREE.Vector3(0.4, 0.4, 0.4)
  const color = _toColor(raw.bakuColor)
  const emissive = _toColor(raw.bakuEmissive)
  const lightCol = _toColor(raw.lightColor)
  const fogCol = _toColor(raw.fogColor)

  return {
    id: raw.id,
    context: `phase_${raw.id}`,
    range: [0, 0.5], // placeholder, caller overwrites
    camera: { position: pos, target: tgt, fov: raw.camFov },
    baku: { position: bakuPos, rotation: bakuRot, scale: bakuSc, opacity: raw.bakuOpacity, role: raw.bakuRole, material: { color, emissive, roughness: 0.2, metalness: 0.8 } },
    lighting: { ambient: lightCol, ambientColor: lightCol, intensity: raw.lightIntensity },
    fog: { color: fogCol, density: raw.fogDensity },
    post: { bloom: raw.postBloom, vignette: raw.postVignette, grain: raw.postGrain, chromatic: raw.postChromatic },
  background: raw.bgColor,
    ui: { showGallery: false },
    camFovOffset: raw.camFovOffset,
    camFovDuration: raw.camFovDuration,
    camSmoothing: raw.camSmoothing,
  }
}

export function resolvePageKey(attr?: string): { isAbsolute: boolean; pageKey: string } {
  const raw = attr || document.body?.getAttribute('data-page') || 'home'
  return { isAbsolute: false, pageKey: raw.split('-')[0] }
}

export function getPageScenes(pageKey: string): PhaseConfig[] {
  const scenes = PAGE_MAP[pageKey] || PAGE_MAP['home']
  return scenes.map((raw, i) => {
    const pc = toPhaseConfig(raw)
    pc.range = i === 0 ? [0, 0.5] : [0.5, 1.0]
    return pc
  })
}

export function getWorldConfigForPage(pageKey: string): readonly PhaseConfig[] {
  return getPageScenes(pageKey)
}

export interface PostPreset {
  bloom: number
  vignette: number
  grain: number
  chromatic: number
}
