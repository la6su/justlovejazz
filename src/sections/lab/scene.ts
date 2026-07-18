// Section0 — canonical Lab scene behind the public Contact finale.
// The ambient visual belongs to EnvSphere so the DOM content remains the focus.
import * as THREE from 'three'

export function createSection0(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'lab'

  return g
}
