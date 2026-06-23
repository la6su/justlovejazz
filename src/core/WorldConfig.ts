// src/core/WorldConfig.ts — 4 sections matching DOM layout
// Order: Hero → About → Works → Footer (scroll-driven, 1:1 with DOM sections)
// Baku removed from experience (no-op placeholder)

import * as THREE from 'three'
import { BakuRole } from './types'

// ── Types ──
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
  hexColor: string
  intensity?: number
  distance?: number
  position: [number, number, number]
}

export interface PhaseConfig {
  id: string
  context: string
  domSection: string
  range: [number, number]
  camera: CameraTransform
  camFovOffset: number
  camFovDuration: number
  camSmoothing: number
  baku: BakuTransform
  lighting: LightTransform
  fog: FogTransform
  post: PostTransform
  ui: { showGallery: boolean }
  background: number
  ground: { color: THREE.Color; opacity: number }
  sectionLights?: SectionLightDef[]
}

// ── Raw data (no Three.js) ──
type RawScene = {
  id: string
  context: string
  domSection: string
  /** Scroll range [start, end] mapped to the section.
   * Values are 0..1 on the full scroll timeline.
   * Ranges are weighted to match DOM section heights so transitions
   * feel proportional to what the user actually sees.
   *   |  |  |  |  |  |  |  |  |sum|
   * Hero: 0.00..0.35  (35%, ~1.1vh)
   * About: 0.35..0.60 (25%, ~0.75vh)
   * Works: 0.60..0.85 (25%, ~0.75vh)
   * Footer: 0.85..1.00 (15%, ~0.45vh)
  */
  range: [number, number]
  camPos: [number, number, number]
  camTarget: [number, number, number]
  camFov: number
  camFovOffset: number
  camFovDuration: number
  camSmoothing: number
  bakuRole: BakuRole
  bakuOpacity: number
  bakuColor: number
  bakuEmissive: number
  postBloom: number
  postVignette: number
  postGrain: number
  postChromatic: number
  lightColor: number
  lightIntensity: number
  fogColor: number
  fogDensity: number
  bgColor: number
  showGallery: boolean
  groundColor: number
  groundOpacity: number
}

// 4 sections: Hero → About → Works → Footer
// Index 0→hero, 1→about, 2→works, 3→footer
const RAW: RawScene[] = [
  {
    id: 'sec_hero',
    context: 'Studio — Home',
    domSection: 'hero',
    range: [0.0, 0.35],
    camPos: [0, 0.5, 7],
    camTarget: [0, 0, -2],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 1,
    bakuColor: 0xeeeeee,
    bakuEmissive: 0x8888aa,
    postBloom: 0,
    postVignette: 1.5,
    postGrain: 0.02,
    postChromatic: 0.002,
    lightColor: 0xffffff,
    lightIntensity: 1,
    fogColor: 0xffffff,
    fogDensity: 0.01,
    bgColor: 0xffffff,
    showGallery: false,
    groundColor: 0xffffff,
    groundOpacity: 0,
  },
  {
    id: 'sec_about',
    context: 'TRINITY — About',
    domSection: 'about',
    range: [0.35, 0.60],
    camPos: [0, 1, 6],
    camTarget: [0, 0, 0],
    camFov: 55,
    camFovOffset: 0.4,
    camFovDuration: 0.9,
    camSmoothing: 5,
    bakuRole: BakuRole.WIRE,
    bakuOpacity: 0.6,
    bakuColor: 0x111111,
    bakuEmissive: 0x020202,
    postBloom: 0.4,
    postVignette: 0.5,
    postGrain: 0.02,
    postChromatic: 0.003,
    lightColor: 0x080812,
    lightIntensity: 1.2,
    fogColor: 0x080812,
    fogDensity: 0.02,
    bgColor: 0x08080c,
    showGallery: false,
    groundColor: 0x080812,
    groundOpacity: 0.08,
  },
  {
    id: 'sec_works',
    context: 'WORKS — Gallery',
    domSection: 'works',
    range: [0.60, 0.85],
    camPos: [0, 1, 7],
    camTarget: [0, 1, 0],
    camFov: 50,
    camFovOffset: 0.5,
    camFovDuration: 1.0,
    camSmoothing: 6,
    bakuRole: BakuRole.WIRE,
    bakuOpacity: 0.4,
    bakuColor: 0x111111,
    bakuEmissive: 0x020202,
    postBloom: 0.4,
    postVignette: 0.4,
    postGrain: 0.02,
    postChromatic: 0.005,
    lightColor: 0x06080e,
    lightIntensity: 1.2,
    fogColor: 0x06080e,
    fogDensity: 0.02,
    bgColor: 0x060608,
    showGallery: true,
    groundColor: 0x06080e,
    groundOpacity: 0.1,
  },
  {
    id: 'sec_footer',
    context: 'CONTACT — Footer',
    domSection: 'footer',
    range: [0.85, 1.0],
    camPos: [0, 0, 8],
    camTarget: [0, 0, 0],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 5,
    bakuRole: BakuRole.NORMAL,
    bakuOpacity: 1,
    bakuColor: 0x111111,
    bakuEmissive: 0x020202,
    postBloom: 0.3,
    postVignette: 0.6,
    postGrain: 0.025,
    postChromatic: 0.004,
    lightColor: 0x050810,
    lightIntensity: 0.8,
    fogColor: 0x050810,
    fogDensity: 0.025,
    bgColor: 0x050507,
    showGallery: false,
    groundColor: 0x050810,
    groundOpacity: 0.05,
  },
]

// ── Helpers (preserve original signatures) ──
const _toVec = (v: [number, number, number]) => new THREE.Vector3(...v)
const _toColor = (hex: number) => new THREE.Color(hex)

export function toPhaseConfig(raw: RawScene): PhaseConfig {
  const pos = _toVec(raw.camPos)
  const tgt = _toVec(raw.camTarget)
  return {
    id: raw.id,
    context: raw.context,
    domSection: raw.domSection ?? raw.id.replace(/^sec_/, ''),
    range: raw.range,
    camera: { position: pos, target: tgt, fov: raw.camFov },
    camFovOffset: raw.camFovOffset,
    camFovDuration: raw.camFovDuration,
    camSmoothing: raw.camSmoothing,
    baku: {
      position: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(0.4, 0.4, 0.4),
      opacity: raw.bakuOpacity,
      role: raw.bakuRole as unknown as BakuRole,
      material: {
        color: _toColor(raw.bakuColor),
        emissive: _toColor(raw.bakuEmissive),
        roughness: 0.2,
        metalness: 0.8,
      },
    },
    lighting: {
      ambient: _toColor(raw.lightColor),
      ambientColor: _toColor(raw.lightColor),
      intensity: raw.lightIntensity,
    },
    fog: { color: _toColor(raw.fogColor), density: raw.fogDensity },
    post: {
      bloom: raw.postBloom,
      vignette: raw.postVignette,
      grain: raw.postGrain,
      chromatic: raw.postChromatic,
    },
    ui: { showGallery: raw.showGallery },
    background: raw.bgColor,
    ground: {
      color: _toColor(raw.groundColor),
      opacity: raw.groundOpacity,
    },
  }
}

// ── Public API (preserve original signatures) ──
export const ALL_SECTIONS = RAW

export function resolvePageKey(_attr?: string): { isAbsolute: boolean; pageKey: string } {
  return { isAbsolute: false, pageKey: 'home' }
}

export function getAllScenes(): PhaseConfig[] {
  return RAW.map((raw) => toPhaseConfig(raw))
}

export function getPageScenes(_pageKey: string): PhaseConfig[] {
  return getAllScenes()
}

export function getWorldConfigForPage(_pageKey: string): readonly PhaseConfig[] {
  return getAllScenes()
}


