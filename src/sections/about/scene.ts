// Section2 — About: WireframeTypography (3D wireframe text with TSL displacement).
// The signature 3D object for the About face — "ABOUT" rendered as a living
// wireframe slab that undulates via TSL noise (frozen when idle, on-demand).
import * as THREE from 'three'
import { WireframeTypography } from '../../Experience/World/WireframeTypography'

export function createSection2(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'about'

  const typography = new WireframeTypography('ABOUT', 0.55)
  // keepVisible: SectionSceneFactory.hideGeometry() hides everything except
  // Points/InstancedMesh/keepVisible — the wireframe text must stay visible.
  typography.userData.keepVisible = true
  typography.position.set(0, 0, -2)
  g.add(typography)
  // World.update() reads userData.typography to drive the TSL time uniform.
  g.userData.typography = typography

  return g
}
