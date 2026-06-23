// src/core/WorldConfig.ts — 4 clear sections (Hero → Trinity/About → Works → Footer)
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

// 5 sections: Hero → Trinity/About → Works → Footer → Flexible
const RAW: RawScene[] = [
  {
    id: 'sec_hero',
    context: 'Studio — Home',
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
  {
    id: 'sec_flexible',
    context: 'FLEXIBLE — Showcase',
    camPos: [0, 0.5, 6],
    camTarget: [0, 0, 0],
    camFov: 50,
    camFovOffset: 0.5,
    camFovDuration: 1.0,
    camSmoothing: 5,
    bakuRole: BakuRole.WIRE,
    bakuOpacity: 0.5,
    bakuColor: 0xeeeeee,
    bakuEmissive: 0x515d84,
    postBloom: 0,
    postVignette: 0.8,
    postGrain: 0.02,
    postChromatic: 0.003,
    lightColor: 0xf0f0f0,
    lightIntensity: 1,
    fogColor: 0xf0f0f0,
    fogDensity: 0.008,
    bgColor: 0xf0f0f0,
    showGallery: false,
    groundColor: 0xf0f0f0,
    groundOpacity: 0.3,
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
    range: [0, 0], /* placeholder; overwritten by getAllScenes().computeRanges() */
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
  const ranges = computeRanges(RAW.length)
  return RAW.map((raw, i) => {
    const pc = toPhaseConfig(raw)
    pc.range = ranges[i]
    return pc
  })
}

export function getPageScenes(_pageKey: string): PhaseConfig[] {
  return getAllScenes()
}

export function getWorldConfigForPage(_pageKey: string): readonly PhaseConfig[] {
  return getAllScenes()
}

function computeRanges(count: number): [number, number][] {
  const ranges: [number, number][] = []
  for (let i = 0; i < count; i++) {
    ranges.push([i / count, (i + 1) / count])
  }
  return ranges
}
