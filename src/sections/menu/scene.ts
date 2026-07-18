// Section5 — Menu sheet scene.
// EnvSphere owns the understated backdrop; no foreground object sits behind nav.
import * as THREE from 'three'

export function createSection5(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'menu'

  return g
}
