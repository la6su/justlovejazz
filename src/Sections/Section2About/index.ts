// Section2 — About: dark BG, instanced particles + wireframe typography.
import * as THREE from 'three'
import { makeParticles } from '../_shared/makeParticles'
import { WireframeTypography } from '../../Experience/World/WireframeTypography'

export function createSection2(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'about'
  // Wireframe "ABOUT" text — signature 3D object for this section.
  // Positioned at z=-2 (behind baku cube at z=0), centered.
  const typo = new WireframeTypography('ABOUT', 1.0)
  typo.position.set(0, 0.5, -3)
  typo.userData.keepVisible = true  // don't hide via SectionSceneFactory.hideGeometry
  g.add(typo)
  g.userData.typography = typo  // reference for update()

  g.add(makeParticles({ count: 50, spread: new THREE.Vector3(12, 6, 8), color: 0xff69b4, size: 0.04, opacity: 0.25 }))
  return g
}
