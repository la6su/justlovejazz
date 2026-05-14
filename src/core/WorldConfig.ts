// src/core/WorldConfig.ts — PageScenes: pages × 2 scenes per page

import * as THREE from 'three'
import { BakuRole } from './types'

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

export interface PostTransform {
  bloom: number
  vignette: number
  grain: number
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

export interface SceneRecord {
  id: string
  camera: CameraTransform
  baku: BakuTransform
  post: PostTransform
  light: LightTransform
  fog: FogTransform
}

export interface PageScene {
  key: string
  name: string
  scenes: SceneRecord[]
}

const mkLight = (hex: number, intensity: number): LightTransform => ({
  ambient: new THREE.Color(hex),
  ambientColor: new THREE.Color(hex),
  intensity,
})

export const PAGE_SCENES: PageScene[] = [
  {
    key: 'trinity',
    name: 'Trinity',
    scenes: [
      {
        id: 'step01',
        camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 1, role: BakuRole.NORMAL, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.2, vignette: 0.7, grain: 0.03 },
        light: mkLight(0x030308, 0.8),
        fog: { color: new THREE.Color(0x030308), density: 0.03 },
      },
      {
        id: 'step02',
        camera: { position: new THREE.Vector3(-4, 2, 6), target: new THREE.Vector3(0, 0, 0), fov: 65 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 0.6, role: BakuRole.WIRE, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.3, vignette: 0.5, grain: 0.025 },
        light: mkLight(0x040302, 1),
        fog: { color: new THREE.Color(0x040302), density: 0.025 },
      },
    ],
  },
  {
    key: 'works',
    name: 'Works',
    scenes: [
      {
        id: 'step03',
        camera: { position: new THREE.Vector3(3, 5, 7), target: new THREE.Vector3(0, 2, 0), fov: 70 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 0.4, role: BakuRole.WIRE, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.4, vignette: 0.4, grain: 0.02 },
        light: mkLight(0x030305, 1.2),
        fog: { color: new THREE.Color(0x030305), density: 0.02 },
      },
      {
        id: 'step04',
        camera: { position: new THREE.Vector3(0, 8, 10), target: new THREE.Vector3(0, 5, 0), fov: 80 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 0.2, role: BakuRole.NORMAL, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.15, vignette: 0.6, grain: 0.04 },
        light: mkLight(0x020204, 0.6),
        fog: { color: new THREE.Color(0x020204), density: 0.04 },
      },
    ],
  },
  {
    key: 'home',
    name: 'Home',
    scenes: [
      {
        id: 'step05',
        camera: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 2, 0), fov: 50 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 1, role: BakuRole.GLASS, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.6, vignette: 0.5, grain: 0.02 },
        light: mkLight(0x020101, 2),
        fog: { color: new THREE.Color(0x020101), density: 0.05 },
      },
      {
        id: 'step06',
        camera: { position: new THREE.Vector3(-2, 10, 8), target: new THREE.Vector3(0, 8, -5), fov: 60 },
        baku: { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4, 0.4, 0.4), opacity: 0.3, role: BakuRole.WIRE, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
        post: { bloom: 0.3, vignette: 0.4, grain: 0.03 },
        light: mkLight(0x030306, 1),
        fog: { color: new THREE.Color(0x030306), density: 0.02 },
      },
    ],
  },
]

export function resolvePageKey(attr?: string): { isAbsolute: boolean; pageKey: string } {
  const raw = attr || document.body?.getAttribute('data-page') || 'home'
  const pageKey = raw.split('-')[0]
  return { isAbsolute: false, pageKey }
}

export function getPageScene(key: string): PageScene {
  return PAGE_SCENES.find(s => s.key === key) || PAGE_SCENES[2]
}

// ── Legacy compatibility ──
export interface PhaseConfig {
  id: string
  context: string
  range: [number, number]
  camera: CameraTransform
  baku: BakuTransform
  lighting: LightTransform
  fog: FogTransform
  post: PostTransform
  ui: { showGallery: boolean }
}

export function toPhaseConfig(scene: SceneRecord, range: [number, number]): PhaseConfig {
  return {
    id: scene.id,
    context: `phase_${scene.id}`,
    range,
    camera: scene.camera,
    baku: scene.baku,
    lighting: scene.light,
    fog: scene.fog,
    post: scene.post,
    ui: { showGallery: false },
  }
}

export function getWorldConfigForPage(pageKey: string): readonly PhaseConfig[] {
  const pageScene = getPageScene(pageKey)
  return pageScene.scenes.map((scene, i) =>
    toPhaseConfig(scene, i === 0 ? [0, 0.5] : [0.5, 1.0])
  )
}

// ── PostPreset (legacy alias for PostProcessingManager) ──
export interface PostPreset {
  bloom: number
  vignette: number
  grain: number
}
