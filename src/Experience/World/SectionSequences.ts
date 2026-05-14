// SectionSequences.ts — smoke + stretch lines only (no stars — gradient background)
import * as THREE from 'three'
import BackgroundLines from '../../worlds/components/BackgroundLines'

const ASSETS = '/assets/references'
const textures = new Map<string, THREE.Texture>()

function loadTx(path: string): THREE.Texture {
  const full = `${ASSETS}${path}`
  if (!textures.has(full)) {
    const tex = new THREE.TextureLoader().load(full)
    tex.needsUpdate = true
    textures.set(full, tex)
  }
  return textures.get(full)!
}

// ── smoke planes (2015 reference) ──
function smoke(data: Array<{ x: number; y: number; z: number; rz: number; s: number; front: boolean }>): THREE.Group {
  const g = new THREE.Group()
  const tex = loadTx('/sprite-smoke.png')
  for (const d of data) {
    // PERFORMANCE: FrontSide only — back faces not visible on single-sided smoke planes
    const m = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: d.front ? THREE.NormalBlending : THREE.AdditiveBlending,
      side: THREE.FrontSide,
    })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), m)
    p.position.set(d.x, d.y, d.z)
    p.rotation.z = d.rz
    p.scale.setScalar(d.s)
    // PERFORMANCE: frustum culling enabled by default — only render when visible
    p.frustumCulled = true
    p.userData.type = 'smoke-plane'
    p.userData.smokeBase = p.position.clone()
    g.add(p)
  }
  g.userData.type = 'smoke-system'
  return g
}

// ── background stretch lines (BackgroundLinesObject3D) ──
function bgLines(count: number = 150): THREE.Group {
  // Viewport-aware: Z range close to camera (Z=10)
  const l = new BackgroundLines({ count, rangeX: [-15, 15], rangeY: [-20, 20], rangeZ: [-10, 5] })
  return l.group
}

export type WorldCreator = () => THREE.Object3D[]

export const pageWorlds: Record<string, Record<string, WorldCreator>> = {
  trinity: {
    step01: () => {
      const s = new THREE.Group()
      s.name = 'step01-hello'
      s.add(bgLines(60))
      s.add(smoke([
        { x: 12, y: 4, z: 18, rz: 2.7, s: 4, front: true },
        { x: 22, y: -9, z: 8, rz: 5.5, s: 5, front: true },
        { x: 15, y: 1, z: 20, rz: 1, s: 6, front: false },
        { x: 3, y: -5, z: 18, rz: 3, s: 3.5, front: false },
      ]))
      return [s]
    },
    step02: () => {
      const s = new THREE.Group()
      s.name = 'step02-transition'
      s.add(bgLines(60))
      s.add(smoke([
        { x: -2, y: 8, z: 20, rz: 1.5, s: 7, front: false },
        { x: 7, y: -6, z: 16, rz: 0.5, s: 4, front: false },
        { x: 5, y: 2, z: 22, rz: 2.5, s: 5, front: false },
        { x: -5, y: 5, z: 24, rz: 3.5, s: 3, front: false },
      ]))
      return [s]
    },
  },
  works: {
    step01: () => {
      const s = new THREE.Group()
      s.name = 'step01-hero'
      s.add(bgLines(60))
      s.add(smoke([
        { x: 12, y: 4, z: 18, rz: 2, s: 4, front: true },
        { x: 22, y: -8, z: 8, rz: 4, s: 5, front: true },
      ]))
      return [s]
    },
    step02: () => {
      const s = new THREE.Group()
      s.name = 'step02-transition'
      s.add(bgLines(60))
      s.add(smoke([
        { x: -3, y: 6, z: 20, rz: 1, s: 6, front: false },
        { x: 8, y: -5, z: 15, rz: 3, s: 4, front: false },
      ]))
      return [s]
    },
  },
  home: {
    step01: () => {
      const s = new THREE.Group()
      s.name = 'step01-hero'
      s.add(bgLines(60))
      s.add(smoke([
        { x: 10, y: 3, z: 17, rz: 2.5, s: 4, front: true },
        { x: 20, y: -9, z: 7, rz: 5, s: 5, front: true },
      ]))
      return [s]
    },
    step02: () => {
      const s = new THREE.Group()
      s.name = 'step02-transition'
      s.add(bgLines(60))
      s.add(smoke([
        { x: 0, y: 7, z: 21, rz: 1, s: 7, front: false },
        { x: 6, y: -5, z: 16, rz: 2, s: 3, front: false },
      ]))
      return [s]
    },
  },
  contact: {
    step01: () => {
      const s = new THREE.Group()
      s.name = 'step01-hero'
      s.add(bgLines(60))
      s.add(smoke([
        { x: 11, y: 4, z: 18, rz: 2, s: 4, front: true },
        { x: 23, y: -9, z: 8, rz: 5, s: 5, front: true },
      ]))
      return [s]
    },
    step02: () => {
      const s = new THREE.Group()
      s.name = 'step02-transition'
      s.add(bgLines(60))
      s.add(smoke([
        { x: -1, y: 7, z: 22, rz: 1.5, s: 7, front: false },
        { x: 7, y: -5, z: 15, rz: 3, s: 3, front: false },
      ]))
      return [s]
    },
  },
}

// Backwards compat
export function stepmakers(): Array<{ name: string; fn: () => THREE.Object3D[] }> {
  return [
    { name: 'step01', fn: pageWorlds.trinity.step01 },
    { name: 'step02', fn: pageWorlds.trinity.step02 },
  ]
}
