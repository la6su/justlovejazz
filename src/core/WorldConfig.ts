// src/core/WorldConfig.ts — 6 sections matching junni.co.jp reference
// Order: Intro → About → Flexible → Challenge → Innovative → Contact (scroll-driven)

import * as THREE from 'three'
import { BakuRole } from './types'

// ── Types (unchanged) ──
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

type RawScene = {
  id: string
  context: string
  domSection: string
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

// 6 sections matching https://next.junni.co.jp/
// Index: 0=intro, 1=about, 2=flexible, 3=challenge, 4=innovative, 5=contact
const RAW: RawScene[] = [
  // ── Section 1: INTRO — White BG, metal drop ──
  {
    id: 'sec_intro',
    context: 'Studio — Home',
    domSection: 'intro',
    range: [0, 1 / 5],
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
  // ── Section 2: ABOUT — Black BG, blob, reflective floor, grey blocks ──
  {
    id: 'sec_about',
    context: 'TRINITY — About',
    domSection: 'about',
    range: [1 / 5, 2 / 5],
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
    lightColor: 0x040408,
    lightIntensity: 1.2,
    fogColor: 0x040408,
    fogDensity: 0.04,
    bgColor: 0x020204,
    showGallery: false,
    groundColor: 0x080812,
    groundOpacity: 0.08,
  },
  // ── Section 3: FLEXIBLE — White/light transition ──
  {
    id: 'sec_flexible',
    context: 'FLEXIBLE — Approach',
    domSection: 'flexible',
    range: [2 / 5, 3 / 5],
    camPos: [0, 0.5, 6],
    camTarget: [0, 0, -1],
    camFov: 50,
    camFovOffset: 0.35,
    camFovDuration: 0.85,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.8,
    bakuColor: 0xdddddd,
    bakuEmissive: 0x999999,
    postBloom: 0.2,
    postVignette: 1.0,
    postGrain: 0.015,
    postChromatic: 0.002,
    lightColor: 0xeeeeee,
    lightIntensity: 1.0,
    fogColor: 0xeeeeee,
    fogDensity: 0.015,
    bgColor: 0xeeeeee,
    showGallery: false,
    groundColor: 0xeeeeee,
    groundOpacity: 0,
  },
  // ── Section 4: CHALLENGE — Dark BG, checkered floor, blue lines ──
  {
    id: 'sec_challenge',
    context: 'WORKS — Gallery',
    domSection: 'challenge',
    range: [3 / 5, 4 / 5],
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
  // ── Section 5: INNOVATIVE — Dark BG, constellation/grid ──
  {
    id: 'sec_innovative',
    context: 'INNOVATIVE — Vision',
    domSection: 'innovative',
    range: [4 / 5, 5 / 5],
    camPos: [0, 0.8, 6],
    camTarget: [0, 0.5, -1],
    camFov: 50,
    camFovOffset: 0.4,
    camFovDuration: 0.9,
    camSmoothing: 5,
    bakuRole: BakuRole.WIRE,
    bakuOpacity: 0.5,
    bakuColor: 0x111111,
    bakuEmissive: 0x020202,
    postBloom: 0.3,
    postVignette: 0.6,
    postGrain: 0.02,
    postChromatic: 0.004,
    lightColor: 0x050810,
    lightIntensity: 1.0,
    fogColor: 0x050810,
    fogDensity: 0.025,
    bgColor: 0x050507,
    showGallery: false,
    groundColor: 0x050810,
    groundOpacity: 0.05,
  },
  // ── Section 6: CONTACT — Dark BG, noisy blocks ──
  {
    id: 'sec_contact',
    context: 'CONTACT — Footer',
    domSection: 'contact',
    range: [5 / 5, 6 / 5],
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

// ── Helpers ──
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

// ── Public API ──
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
