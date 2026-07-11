// src/core/WorldConfig.ts — 6 sections (cube-map: 0=secret, 1=intro, 2-4=main, 5=secret)

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
 *  standard transition).
 *
 *  NOTE: envSpherePattern was REMOVED — EnvSphere follows global theme only
 *  (see World.ts §EnvSphere). particles flag was REMOVED — particle visibility
 *  is driven by scene-group visibility, no per-section toggle exists. */
export interface SceneControl {
  /** 3D objects visibility per section. false = hidden. */
  objects?: {
    wireframeText?: boolean   // WireframeTypography (section title in 3D)
    shaderOrb?: boolean       // ShaderOrb (Lab experiment)
    timelineNodes?: boolean   // TimelineNodes (Process)
    bakuCarousel?: boolean    // BakuCarousel (Works gallery)
  }
  /** Transition timing for camera + baku morph when entering this section. */
  transition?: {
    duration: number   // seconds (0 = instant, 1.0 = slow cinematic)
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
   *  Inverse mode flips these. See ThemeManager + Experience.ts. */
  theme: 'light' | 'dark'
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
  bakuDisplace: number
  bakuColor: number
  bakuEmissive: number
  postBloom: number
  postVignette: number
  postGrain: number
  postChromatic: number
  postRefract: number
  postBorder: number
  postGradeShadows: [number, number, number]
  postGradeHighlights: [number, number, number]
  lightColor: number
  lightIntensity: number
  fogColor: number
  fogDensity: number
  bgColor: number
  showGallery: boolean
  groundColor: number
  groundOpacity: number
  /** Per-section theme: 'light' (light bg, dark text) or 'dark' (dark bg, light text).
   *  Intro + Contact = light, middle sections = dark. Inverse flips. */
  sectionTheme: 'light' | 'dark'
  /** Per-section 3D scene control (optional — omitted = defaults). */
  sceneObjects?: SceneControl['objects']
  sceneTransition?: SceneControl['transition']
}

// 6 sections (4 main + 2 secret side: Lab=0, Process=5) — 1:1 with cube faces
// Index: 0=lab, 1=intro, 2=about, 3=works(challenge), 4=contact, 5=process
const RAW: RawScene[] = [
  // ── Section 0: LAB (secret left) — Light BG, experiments ──
  {
    id: 'sec_lab',
    context: 'LAB — Experiments',
    domSection: 'lab',
    range: [0, 1 / 5],
    camPos: [0, 0.5, 7],
    camTarget: [0, 0, -2],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 4,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.4,
    bakuDisplace: 0.08,
    bakuColor: 0x2a4a6e,
    bakuEmissive: 0x4a6a8a,
    postBloom: 0,
    postVignette: 1.0,
    postGrain: 0.02,
    postChromatic: 0.002,
    postRefract: 0.05,
    postBorder: 0.0,
    postGradeShadows: [1.0, 0.98, 0.95],
    postGradeHighlights: [1.0, 1.0, 1.0],
    lightColor: 0xffffff,
    lightIntensity: 1,
    fogColor: 0xffffff,
    fogDensity: 0.01,
    bgColor: 0xf5f5f8,
    showGallery: false,
    groundColor: 0xf5f5f8,
    groundOpacity: 0,
    sectionTheme: 'light',
    sceneObjects: { shaderOrb: true },
    sceneTransition: { duration: 0.8, easing: 'ease-out' },
  },
  // ── Section 1: INTRO — White BG, metal drop ──
  {
    id: 'sec_intro',
    context: 'Studio — Home',
    domSection: 'intro',
    range: [1 / 5, 2 / 5],
    camPos: [0, 0.5, 7],
    camTarget: [0, 0, -2],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 4,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.4,
    bakuDisplace: 0.08,
    bakuColor: 0x3a3a5e,
    bakuEmissive: 0x5a5a8a,
    postBloom: 0,
    postVignette: 1.5,
    postGrain: 0.02,
    postChromatic: 0.002,
    postRefract: 0.05,
    postBorder: 0.0,
    postGradeShadows: [1.0, 0.98, 0.95],
    postGradeHighlights: [1.0, 1.0, 1.0],
    lightColor: 0xffffff,
    lightIntensity: 1,
    fogColor: 0xffffff,
    fogDensity: 0.01,
    bgColor: 0xffffff,
    showGallery: false,
    groundColor: 0xffffff,
    groundOpacity: 0,
    sectionTheme: 'light',
    sceneTransition: { duration: 1.0, easing: 'ease-in-out' },
  },
  {
    id: 'sec_about',
    context: 'TRINITY — About',
    domSection: 'about',
    range: [2 / 5, 3 / 5],
    camPos: [0, 1, 6],
    camTarget: [0, 0, 0],
    camFov: 55,
    camFovOffset: 0.4,
    camFovDuration: 0.9,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.35,
    bakuDisplace: 0.15,
    bakuColor: 0x2a2a3e,
    bakuEmissive: 0x4a4a6a,
    postBloom: 0.4,
    postVignette: 0.5,
    postGrain: 0.02,
    postChromatic: 0.003,
    postRefract: 0.15,
    postBorder: 0.0,
    postGradeShadows: [0.9, 0.92, 1.0],
    postGradeHighlights: [0.85, 0.9, 1.0],
    lightColor: 0x040408,
    lightIntensity: 1.2,
    fogColor: 0x040408,
    fogDensity: 0.04,
    bgColor: 0x020204,
    showGallery: false,
    groundColor: 0x080812,
    groundOpacity: 0.08,
    sectionTheme: 'dark',
    sceneObjects: { wireframeText: true },
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  },
  // ── Section 3: WORKS — BakuCarousel + cube centered, slightly raised ──
  {
    id: 'sec_challenge',
    context: 'WORKS — Gallery',
    domSection: 'challenge',
    range: [3 / 5, 4 / 5],
    camPos: [0, 0.8, 7],
    camTarget: [0, 0.8, 0],
    camFov: 50,
    camFovOffset: 0.5,
    camFovDuration: 1.0,
    camSmoothing: 6,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.4,
    bakuDisplace: 0.05,
    bakuColor: 0x2a2a3e,
    bakuEmissive: 0x4a4a6a,
    postBloom: 0.4,
    postVignette: 0.4,
    postGrain: 0.02,
    postChromatic: 0.005,
    postRefract: 0.1,
    postBorder: 0.0,
    postGradeShadows: [0.88, 0.9, 1.0],
    postGradeHighlights: [0.9, 0.92, 1.0],
    lightColor: 0x06080e,
    lightIntensity: 1.2,
    fogColor: 0x06080e,
    fogDensity: 0.02,
    bgColor: 0x060608,
    showGallery: true,
    groundColor: 0x06080e,
    groundOpacity: 0.1,
    sectionTheme: 'dark',
    sceneObjects: { bakuCarousel: true },
    sceneTransition: { duration: 0.8, easing: 'ease-out' },
  },
  // ── Section 4: CONTACT — Dark BG, closing ──
  {
    id: 'sec_contact',
    context: 'CONTACT — Footer',
    domSection: 'contact',
    range: [4 / 5, 5 / 5],
    camPos: [0, 0, 8],
    camTarget: [0, 0, 0],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.4,
    bakuDisplace: 0.06,
    bakuColor: 0x1a1a2e,
    bakuEmissive: 0x3a3a5a,
    postBloom: 0.2,
    postVignette: 0.4,
    postGrain: 0.015,
    postChromatic: 0.002,
    postRefract: 0.05,
    postBorder: 0.0,
    postGradeShadows: [1.0, 0.96, 0.92],
    postGradeHighlights: [1.0, 0.98, 0.95],
    lightColor: 0xffffff,
    lightIntensity: 1.5,
    fogColor: 0xe8e8e8,
    fogDensity: 0.008,
    bgColor: 0xe8e8e8,
    showGallery: false,
    groundColor: 0x080812,
    groundOpacity: 0.25,
    sectionTheme: 'light',
    sceneObjects: { wireframeText: true },
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  },
  // ── Section 5: PROCESS (secret right) — Dark BG, workflow timeline ──
  {
    id: 'sec_process',
    context: 'PROCESS — Workflow',
    domSection: 'process',
    range: [5 / 5, 6 / 5],
    camPos: [0, 0.5, 7],
    camTarget: [0, 0, 0],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.35,
    bakuDisplace: 0.06,
    bakuColor: 0x1a1a2e,
    bakuEmissive: 0x3a3a5a,
    postBloom: 0.2,
    postVignette: 0.4,
    postGrain: 0.015,
    postChromatic: 0.002,
    postRefract: 0.05,
    postBorder: 0.0,
    postGradeShadows: [1.0, 0.96, 0.92],
    postGradeHighlights: [1.0, 0.98, 0.95],
    lightColor: 0x0a0a0f,
    lightIntensity: 1.2,
    fogColor: 0x0a0a0f,
    fogDensity: 0.008,
    bgColor: 0x0a0a0f,
    showGallery: false,
    groundColor: 0x080812,
    groundOpacity: 0.05,
    sectionTheme: 'dark',
    sceneObjects: { timelineNodes: true },
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  },
]

// ── Helpers ──
const _toVec = (v: [number, number, number]) => new THREE.Vector3(...v)
const _toColor = (hex: number) => new THREE.Color(hex)

function toPhaseConfig(raw: RawScene): PhaseConfig {
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
      displace: raw.bakuDisplace,
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
      refract: raw.postRefract,
      border: raw.postBorder,
      gradeShadows: raw.postGradeShadows,
      gradeHighlights: raw.postGradeHighlights,
    },
    ui: { showGallery: raw.showGallery },
    background: raw.bgColor,
    ground: {
      color: _toColor(raw.groundColor),
      opacity: raw.groundOpacity,
    },
    theme: raw.sectionTheme,
    scene: (raw.sceneObjects || raw.sceneTransition) ? {
      objects: raw.sceneObjects,
      transition: raw.sceneTransition,
    } : undefined,
  }
}

// ── Content page configs — minimal 3D, unique atmosphere per page ──
// Services = warm amber tones, Posts = cool teal tones.
// No BakuCarousel, lighter post-processing, same 6-section structure.
// First (idx 0) and last (idx 5) = light, middle = dark.

type ContentPalette = {
  lightBg: number
  darkBg: number
  bakuColor: number
  bakuEmissive: number
  fogColor: number
  lightColor: number
  groundColor: number
}

const SERVICES_PALETTE: ContentPalette = {
  lightBg: 0xf5f0e8,
  darkBg: 0x0a0805,
  bakuColor: 0x4a3a2a,
  bakuEmissive: 0x6a5a3a,
  fogColor: 0x0a0805,
  lightColor: 0xffffff,
  groundColor: 0x1a1208,
}

const MANIFESTO_PALETTE: ContentPalette = {
  lightBg: 0xf0f4f5,   // cool desaturated teal-white
  darkBg: 0x051015,    // deep teal-black
  bakuColor: 0x2a4a5a, // cool steel-teal glass
  bakuEmissive: 0x3a6a7a,
  fogColor: 0x051015,
  lightColor: 0xffffff,
  groundColor: 0x081a1a,
}

const WORKS_PALETTE: ContentPalette = {
  lightBg: 0xf0f0f4,
  darkBg: 0x080814,
  bakuColor: 0x2a2a4e,
  bakuEmissive: 0x4a4a7a,
  fogColor: 0x080814,
  lightColor: 0xffffff,
  groundColor: 0x101020,
}

const LAB_PALETTE: ContentPalette = {
  lightBg: 0xf5f5f0,
  darkBg: 0x0a0805,
  bakuColor: 0x3a2a1a,
  bakuEmissive: 0x5a4a2a,
  fogColor: 0x0a0805,
  lightColor: 0xffffff,
  groundColor: 0x1a1408,
}

const CONTACT_PALETTE: ContentPalette = {
  lightBg: 0xf0f4f5,
  darkBg: 0x050a0f,
  bakuColor: 0x1a3a4a,
  bakuEmissive: 0x2a5a6a,
  fogColor: 0x050a0f,
  lightColor: 0xffffff,
  groundColor: 0x08141a,
}

// sceneForContentPage REMOVED — it generated per-page sceneObjects that
// referenced 3D objects on the wrong cube-face indices (e.g. wireframeText on
// idx 1, but WireframeTypography only exists on idx 2/4). The `if (typo)` /
// `if (orb)` guards in World.ts made every assignment a no-op. Scene groups are
// shared across all SPA pages (SectionSceneFactory is hardcoded), so per-page
// sceneObjects config contradicts the architecture. Objects are now visible
// whenever their scene group is visible (see World.ts visibility block).

function makeContentScenes(palette: ContentPalette, pageId: string): RawScene[] {
  const themeFor = (idx: number): 'light' | 'dark' => (idx === 0 || idx === 4) ? 'light' : 'dark'
  const bgFor = (idx: number) => themeFor(idx) === 'light' ? palette.lightBg : palette.darkBg
  const fogFor = (idx: number) => themeFor(idx) === 'light' ? palette.lightBg : palette.fogColor

  return Array.from({ length: 6 }, (_, idx) => ({
    id: `content_${pageId}_${idx}`,
    context: `Content — ${pageId} face ${idx}`,
    domSection: `content-${idx}`,
    range: [idx / 5, (idx + 1) / 5] as [number, number],
    camPos: [0, 0.5, 7] as [number, number, number],
    camTarget: [0, 0, 0] as [number, number, number],
    camFov: 50,
    camFovOffset: 0.3,
    camFovDuration: 0.8,
    camSmoothing: 5,
    bakuRole: BakuRole.GLASS,
    bakuOpacity: 0.35,
    bakuDisplace: 0.06,
    bakuColor: palette.bakuColor,
    bakuEmissive: palette.bakuEmissive,
    postBloom: 0.15,
    postVignette: 0.5,
    postGrain: 0.015,
    postChromatic: 0.002,
    postRefract: 0.05,
    postBorder: 0.0,
    postGradeShadows: themeFor(idx) === 'light' ? [1.0, 0.98, 0.95] : [0.9, 0.92, 1.0],
    postGradeHighlights: themeFor(idx) === 'light' ? [1.0, 1.0, 1.0] : [0.85, 0.9, 1.0],
    lightColor: palette.lightColor,
    lightIntensity: 1.0,
    fogColor: fogFor(idx),
    fogDensity: 0.02,
    bgColor: bgFor(idx),
    showGallery: false,
    groundColor: palette.groundColor,
    groundOpacity: 0.05,
    sectionTheme: themeFor(idx),
    sceneTransition: { duration: 0.6, easing: 'ease-out' },
  }))
}

// (getAllScenes removed — 0 external callers)
// (toPhaseConfig kept private — only used internally by getWorldConfigForPage)

export function getWorldConfigForPage(pageKey: string): readonly PhaseConfig[] {
  if (pageKey === 'services') {
    return makeContentScenes(SERVICES_PALETTE, 'services').map(toPhaseConfig)
  }
  if (pageKey === 'works') {
    return makeContentScenes(WORKS_PALETTE, 'works').map(toPhaseConfig)
  }
  if (pageKey === 'manifesto') {
    return makeContentScenes(MANIFESTO_PALETTE, 'manifesto').map(toPhaseConfig)
  }
  if (pageKey === 'lab') {
    return makeContentScenes(LAB_PALETTE, 'lab').map(toPhaseConfig)
  }
  if (pageKey === 'contact') {
    return makeContentScenes(CONTACT_PALETTE, 'contact').map(toPhaseConfig)
  }
  return RAW.map(toPhaseConfig) // home — full scenes
}
