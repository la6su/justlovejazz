// Section4 — Contact: floating "HELLO" bubble lettering as a 3D greeting.
import * as THREE from 'three'
import { WireframeTypography } from '../../Experience/World/WireframeTypography'

export function createSection4(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'contact'

  const typography = new WireframeTypography('HELLO', 0.5)
  typography.userData.keepVisible = true
  typography.position.set(0, 0, -2)
  g.add(typography)
  g.userData.typography = typography

  return g
}
