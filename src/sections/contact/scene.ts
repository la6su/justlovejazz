// Section4 — Contact: a quiet floating greeting behind the useful DOM action.
import * as THREE from 'three'
import { WireframeTypography } from '../../Experience/World/WireframeTypography'

export function createSection4(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'contact'

  // The bundled typeface is intentionally subset to the HELLO glyphs.
  const typography = new WireframeTypography('HELLO', 0.34)
  typography.userData.keepVisible = true
  typography.position.set(-0.15, 0.35, -2.4)
  g.add(typography)
  g.userData.typography = typography

  return g
}
