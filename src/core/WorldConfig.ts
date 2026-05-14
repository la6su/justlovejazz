import * as THREE from 'three';
import { BakuRole } from './types';

export interface CameraPreset { position: THREE.Vector3; target: THREE.Vector3; fov: number; isRelative: boolean; }
export interface BakuPreset { role: BakuRole; position: THREE.Vector3; rotation: THREE.Quaternion; scale: THREE.Vector3; opacity: number; material: { color: THREE.Color; emissive: THREE.Color; roughness: number; metalness: number; }; }
export interface LightingPreset { ambientColor: THREE.Color; intensity: number; }
export interface FogPreset { color: THREE.Color; density: number; }
export interface PostPreset { bloom: number; vignette: number; grain: number; }
export interface UiPreset { showGallery: boolean; }
export interface PhaseConfig { id: string; context: string; range: [number, number]; camera: CameraPreset; baku: BakuPreset; lighting: LightingPreset; fog: FogPreset; post: PostPreset; ui: UiPreset; }

export const WORLD_CONFIG: PhaseConfig[] = [
  {
    id: 'step01',
    context: 'phase_step01',
    range: [0.0, 0.125],
    camera: { position: new THREE.Vector3(0, 0, 8), target: new THREE.Vector3(0, 0, 0), fov: 55, isRelative: false },
    baku: { role: BakuRole.NORMAL, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 1.0, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x030308), intensity: 0.8 },
    fog: { color: new THREE.Color(0x030308), density: 0.03 },
    post: { bloom: 0.2, vignette: 0.7, grain: 0.03 },
    ui: { showGallery: false }
  },
  {
    id: 'step02',
    context: 'phase_step02',
    range: [0.125, 0.25],
    camera: { position: new THREE.Vector3(-4, 2, 6), target: new THREE.Vector3(0, 0, 0), fov: 65, isRelative: false },
    baku: { role: BakuRole.WIRE, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.6, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x040302), intensity: 1.0 },
    fog: { color: new THREE.Color(0x040302), density: 0.025 },
    post: { bloom: 0.3, vignette: 0.5, grain: 0.025 },
    ui: { showGallery: false }
  },
  {
    id: 'step03',
    context: 'phase_step03',
    range: [0.25, 0.375],
    camera: { position: new THREE.Vector3(3, 5, 7), target: new THREE.Vector3(0, 2, 0), fov: 70, isRelative: false },
    baku: { role: BakuRole.WIRE, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.4, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x030305), intensity: 1.2 },
    fog: { color: new THREE.Color(0x030305), density: 0.02 },
    post: { bloom: 0.4, vignette: 0.4, grain: 0.02 },
    ui: { showGallery: false }
  },
  {
    id: 'step04',
    context: 'phase_step04',
    range: [0.375, 0.5],
    camera: { position: new THREE.Vector3(0, 8, 10), target: new THREE.Vector3(0, 5, 0), fov: 80, isRelative: false },
    baku: { role: BakuRole.NORMAL, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.2, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x020204), intensity: 0.6 },
    fog: { color: new THREE.Color(0x020204), density: 0.04 },
    post: { bloom: 0.15, vignette: 0.6, grain: 0.04 },
    ui: { showGallery: false }
  },
  {
    id: 'step05',
    context: 'phase_step05',
    range: [0.5, 0.625],
    camera: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 2, 0), fov: 50, isRelative: false },
    baku: { role: BakuRole.GLASS, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.0, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x020101), intensity: 2.0 },
    fog: { color: new THREE.Color(0x020101), density: 0.05 },
    post: { bloom: 0.6, vignette: 0.5, grain: 0.02 },
    ui: { showGallery: false }
  },
  {
    id: 'step06',
    context: 'phase_step06',
    range: [0.625, 0.75],
    camera: { position: new THREE.Vector3(-2, 10, 8), target: new THREE.Vector3(0, 8, -5), fov: 60, isRelative: false },
    baku: { role: BakuRole.WIRE, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.3, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x030306), intensity: 1.0 },
    fog: { color: new THREE.Color(0x030306), density: 0.02 },
    post: { bloom: 0.3, vignette: 0.4, grain: 0.03 },
    ui: { showGallery: false }
  },
  {
    id: 'step07',
    context: 'phase_step07',
    range: [0.75, 0.875],
    camera: { position: new THREE.Vector3(0, -5, 6), target: new THREE.Vector3(0, -8, -10), fov: 55, isRelative: false },
    baku: { role: BakuRole.NORMAL, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.1, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x020203), intensity: 0.8 },
    fog: { color: new THREE.Color(0x020203), density: 0.035 },
    post: { bloom: 0.2, vignette: 0.5, grain: 0.03 },
    ui: { showGallery: false }
  },
  {
    id: 'step08',
    context: 'phase_step08',
    range: [0.875, 1.0],
    camera: { position: new THREE.Vector3(0, 2, 7), target: new THREE.Vector3(0, 0, 0), fov: 55, isRelative: false },
    baku: { role: BakuRole.NORMAL, position: new THREE.Vector3(0,0,0), rotation: new THREE.Quaternion(), scale: new THREE.Vector3(0.4,0.4,0.4), opacity: 0.4, material: { color: new THREE.Color(0x111111), emissive: new THREE.Color(0x020202), roughness: 0.2, metalness: 0.8 } },
    lighting: { ambientColor: new THREE.Color(0x030308), intensity: 1.0 },
    fog: { color: new THREE.Color(0x030308), density: 0.025 },
    post: { bloom: 0.3, vignette: 0.5, grain: 0.03 },
    ui: { showGallery: false }
  }];

// ── Pages → 2 scenes each, each gets [0..0.5] and [0.5..1.0] ──
export const PAGE_STEP_MAP: Record<string, string[]> = {
  trinity: ['step01', 'step02'],
  works: ['step03', 'step05'],
  home: ['step07', 'step08'],
  contact: ['step04', 'step06'],
};

/**
 * Return a page-scoped WORLD_CONFIG — only the steps for this page,
 * with ranges remapped to [0, 0.5] and [0.5, 1.0].
 */
export function getWorldConfigForPage(page: string): PhaseConfig[] {
  const steps = PAGE_STEP_MAP[page] || PAGE_STEP_MAP.home;
  return steps.map((stepId, i) => {
    const original = WORLD_CONFIG.find(w => w.id === stepId)!;
    const rangeStart = i === 0 ? 0 : 0.5;
    const rangeEnd = i === 0 ? 0.5 : 1.0;
    return { ...original, range: [rangeStart, rangeEnd] as [number, number] };
  });
}

/**
 * Remap a global scroll value to the active step index (0 or 1)
 * for this page's config.
 */
export function getActiveStepIndex(scroll: number, steps: string[]): number {
  if (scroll < 0.5) return 0;
  if (scroll >= 1.0) return steps.length - 1;
  // Interpolate: 0.5 → last step
  const t = (scroll - 0.5) / 0.5;
  return Math.min(Math.floor(t), steps.length - 1);
}
