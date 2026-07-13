// Section0 — Lab (secret left): ShaderOrb — a TSL-displaced icosahedron that
// embodies the "shader R&D" theme. The faceted wireframe undulates + shifts
// amber→cyan, giving the Lab face a real shader experiment centerpiece.
import * as THREE from 'three'
import { ShaderOrb } from '../../Experience/World/ShaderOrb'

export function createSection0(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'lab'

  const orb = new ShaderOrb(0.7, 2)
  orb.userData.keepVisible = true
  orb.position.set(0, 0, -2)
  g.add(orb)
  // World.update() reads userData.orb to drive the TSL time uniform + spin.
  g.userData.orb = orb

  return g
}
