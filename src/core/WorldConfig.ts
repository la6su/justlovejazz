// src/core/WorldConfig.ts — 6 sections (0=Contact finale slot, 1-4=story, 5=Menu)

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
  /** worldDNA vertex displacement amplitude (0=static, 0.3=strong fluid). */
  displace: number
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
  /** Screen-space glass refraction strength (0=off, 0.1=subtle, 0.3=strong). */
  refract: number
  /** Screen border intensity (0=off, 0.3=subtle, 1.0=full black border). */
  border: number
  /** Shadow tint (RGB 0-1, multiplied into dark areas). */
  gradeShadows: [number, number, number]
  /** Highlight tint (RGB 0-1, 1=neutral, pushed into bright areas). */
  gradeHighlights: [number, number, number]
}

export interface SectionLightDef {
  hexColor: string
  intensity?: number
  distance?: number
  position: [number, number, number]
}

/** Per-section 3D scene control. All optional — sections without these
 *  use defaults (objects visible when their scene group is visible,
 *  standard transition). */
export interface SceneControl {
  /** 3D objects visibility per section. false = hidden. */
  objects?: {
    wireframeText?: boolean
    bakuCarousel?: boolean
  }
  /** Transition timing for camera + baku morph when entering this section. */
  transition?: {
    duration: number
    easing: 'linear' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
  }
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
  /** Per-section 3D scene control (background pattern, objects, transition). */
  scene?: SceneControl
  /** Section theme: 'light' = light background (dark text), 'dark' = dark background (light text).
   *  Inverse mode flips these. See ThemeManager + ContentReveal. */
  theme: 'light' | 'dark'
}

type RawScene = {
  id: string
  context: string
  domSection: string
  range: [number, number]
  camPos?: [number, number, number]
  camTarget?: [number, number, number]
  camFov?: number
  camFovOffset?: number
  camFovDuration?: number
  camSmoothing?: number
  bakuRole?: BakuRole
  bakuOpacity?: number
  bakuDisplace?: number
  bakuColor?: number
  bakuEmissive?: number
  postBloom?: number
  postVignette?: number
  postGrain?: number
  postChromatic?: number
  postRefract?: number
  postBorder?: number
  postGradeShadows?: [number, number, number]
  postGradeHighlights?: [number, number, number]
  lightColor?: number
  lightIntensity?: number
  fogColor?: number
  fogDensity?: number
  bgColor?: number
  showGallery?: boolean
  groundColor?: number
  groundOpacity?: number
  /** Per-section theme: 'light' (light bg, dark text) or 'dark' (dark bg, light text). */
  sectionTheme?: 'light' | 'dark'
  /** Per-section 3D scene control (optional — omitted = defaults). */
  sceneObjects?: SceneControl['objects']
  sceneTransition?: SceneControl['transition']
}

// ── Defaults (shared by ~80% of sections) ──
const DEFAULTS: Omit<RawScene, 'id' | 'context' | 'domSection' | 'range'> = {
  camPos: [0, 0, 3.5],
  camTarget: [0, 0, 0],
  camFov: 60,
  camFovOffset: 0.3,
  camFovDuration: 0.8,
  camSmoothing: 5,
  bakuRole: BakuRole.GLASS,
  bakuOpacity: 0.4,
  bakuDisplace: 0.06,
  bakuColor: 0xb8b8b8,
  bakuEmissive: 0x050505,
  postBloom: 0,
  postVignette: 0,
  postGrain: 0,
  postChromatic: 0,
  postRefract: 0,
  postBorder: 0.0,
  postGradeShadows: [1.0, 0.98, 0.95],
  postGradeHighlights: [1.0, 1.0, 1.0],
  lightColor: 0xffffff,
  lightIntensity: 1.2,
  fogColor: 0x000000,
  fogDensity: 0.005,
  bgColor: 0x000000,
  showGallery: false,
  groundColor: 0x101010,
  groundOpacity: 0,
  sectionTheme: 'dark',
  sceneTransition: { duration: 0.8, easing: 'ease-out' },
}

function raw(overrides: RawScene): RawScene {
  return { ...DEFAULTS, ...overrides }
}

// 6 sections (4 story frames + Contact finale/Lab=0 + Menu=5)
// Index: 0=lab, 1=intro, 2=about, 3=works, 4=contact, 5=menu
const RAW: RawScene[] = [
  raw({
    id: 'sec_lab',
    context: 'LAB — Experiments',
    domSection: 'lab',
    range: [0, 1 / 5],
    sectionTheme: 'light',
  }),
  raw({
    id: 'sec_intro',
    context: 'Studio — Home',
    domSection: 'intro',
    range: [1 / 5, 2 / 5],
    sceneTransition: { duration: 1.0, easing: 'ease-in-out' },
  }),
  raw({
    id: 'sec_about',
    context: 'TRINITY — About',
    domSection: 'about',
    range: [2 / 5, 3 / 5],
    camFovOffset: 0.4,
    camFovDuration: 0.9,
    camSmoothing: 6,
    bakuOpacity: 0.35,
    bakuDisplace: 0.15,
    bakuColor: 0xc0c0c0,
    postBloom: 0.4,
    lightColor: 0x050505,
    lightIntensity: 1.2,
    groundOpacity: 0.08,
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  }),
  raw({
    id: 'sec_works',
    context: 'WORKS — Gallery',
    domSection: 'works',
    range: [3 / 5, 4 / 5],
    camFovOffset: 0.5,
    camFovDuration: 1.0,
    camSmoothing: 6,
    bakuOpacity: 0.4,
    bakuDisplace: 0.05,
    bakuColor: 0xc0c0c0,
    showGallery: true,
    lightColor: 0x050505,
    lightIntensity: 1.2,
    groundOpacity: 0.1,
    sceneObjects: { bakuCarousel: true },
    sceneTransition: { duration: 0.8, easing: 'ease-out' },
  }),
  raw({
    id: 'sec_contact',
    context: 'CONTACT — Footer',
    domSection: 'contact',
    range: [4 / 5, 5 / 5],
    postBloom: 0.2,
    lightColor: 0xffffff,
    lightIntensity: 1.5,
    groundColor: 0x121212,
    groundOpacity: 0.4,
    sceneObjects: { wireframeText: true },
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  }),
  raw({
    id: 'sec_menu',
    context: 'MENU — Navigation',
    domSection: 'menu',
    range: [5 / 5, 6 / 5],
    postBloom: 0.2,
    lightColor: 0x050505,
    lightIntensity: 1.2,
    groundOpacity: 0.05,
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  }),
]

// ── Helpers ──
const _toVec = (v: [number, number, number]) => new THREE.Vector3(...v)
const _toColor = (hex: number) => new THREE.Color(hex)

function toPhaseConfig(r: RawScene): PhaseConfig {
  return {
    id: r.id,
    context: r.context,
    domSection: r.domSection ?? r.id.replace(/^sec_/, ''),
    range: r.range,
    camera: { position: _toVec(r.camPos!), target: _toVec(r.camTarget!), fov: r.camFov! },
    camFovOffset: r.camFovOffset!,
    camFovDuration: r.camFovDuration!,
    camSmoothing: r.camSmoothing!,
    baku: {
      position: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(0.4, 0.4, 0.4),
      opacity: r.bakuOpacity!,
      role: r.bakuRole!,
      displace: r.bakuDisplace!,
      material: {
        // GLASS cube: metalness MUST be 0 (glass is a dielectric, not metal).
        // roughness=0.05 matches SplashCube.buildCube (mirror-smooth glass).
        color: _toColor(r.bakuColor!),
        emissive: _toColor(r.bakuEmissive!),
        roughness: 0.05,
        metalness: 0.0,
      },
    },
    lighting: {
      ambient: _toColor(r.lightColor!),
      ambientColor: _toColor(r.lightColor!),
      intensity: r.lightIntensity!,
    },
    fog: { color: _toColor(r.fogColor!), density: r.fogDensity! },
    post: {
      bloom: r.postBloom!,
      vignette: r.postVignette!,
      grain: r.postGrain!,
      chromatic: r.postChromatic!,
      refract: r.postRefract!,
      border: r.postBorder!,
      gradeShadows: r.postGradeShadows!,
      gradeHighlights: r.postGradeHighlights!,
    },
    ui: { showGallery: r.showGallery! },
    background: r.bgColor!,
    ground: {
      color: _toColor(r.groundColor!),
      opacity: r.groundOpacity!,
    },
    theme: r.sectionTheme!,
    scene:
      r.sceneObjects || r.sceneTransition
        ? { objects: r.sceneObjects, transition: r.sceneTransition }
        : undefined,
  }
}

// ── Content page configs — minimal 3D, unique atmosphere per page ──

type ContentPalette = {
  bakuColor: number
  bakuEmissive: number
  fogColor: number
  groundColor: number
}

const PALETTES: Record<string, ContentPalette> = {
  services: {
    bakuColor: 0xc0b0a0,
    bakuEmissive: 0x8a7a5a,
    fogColor: 0x0a0805,
    groundColor: 0x1a1208,
  },
  manifesto: {
    bakuColor: 0xaac4cc,
    bakuEmissive: 0x6a9aaa,
    fogColor: 0x051015,
    groundColor: 0x081a1a,
  },
  works: { bakuColor: 0xb0b0ce, bakuEmissive: 0x7a7aaa, fogColor: 0x080814, groundColor: 0x101020 },
  lab: { bakuColor: 0xc0b0a0, bakuEmissive: 0x8a7a5a, fogColor: 0x0a0805, groundColor: 0x1a1408 },
  contact: {
    bakuColor: 0xa0c0cc,
    bakuEmissive: 0x6a8a9a,
    fogColor: 0x050a0f,
    groundColor: 0x08141a,
  },
}

function makeContentScenes(pageId: string): PhaseConfig[] {
  const p = PALETTES[pageId]
  if (!p) return RAW.map(toPhaseConfig)
  return Array.from({ length: 6 }, (_, idx) =>
    toPhaseConfig(
      raw({
        id: `content_${pageId}_${idx}`,
        context: `Content — ${pageId} face ${idx}`,
        domSection: `content-${idx}`,
        range: [idx / 5, (idx + 1) / 5] as [number, number],
        bakuColor: p.bakuColor,
        bakuEmissive: p.bakuEmissive,
        postBloom: 0,
        postGradeShadows: [1.0, 1.0, 1.0],
        postGradeHighlights: [1.0, 1.0, 1.0],
        fogColor: p.fogColor,
        groundColor: p.groundColor,
        groundOpacity: 0.05,
      }),
    ),
  )
}

const CONTENT_PAGES = new Set(['services', 'works', 'manifesto', 'lab', 'contact'])

export function getWorldConfigForPage(pageKey: string): readonly PhaseConfig[] {
  if (CONTENT_PAGES.has(pageKey)) {
    return makeContentScenes(pageKey)
  }
  return RAW.map(toPhaseConfig) // home — full scenes
}
