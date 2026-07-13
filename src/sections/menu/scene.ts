// Section5 — Menu (secret right, nav overlay): TimelineNodes — 4 instanced spheres
// arranged vertically. Each node breathes (phase-offset scale pulse) so the
// face has a living 3D anchor behind the nav overlay.
import * as THREE from 'three'
import { TimelineNodes } from '../../Experience/World/TimelineNodes'

export function createSection5(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'menu'

  const nodes = new TimelineNodes(0.08)
  nodes.position.set(0, 0, -2)
  // InstancedMesh is auto-kept-visible by SectionSceneFactory.hideGeometry(),
  // but the group wrapper we add it to is fine — nodes itself is the instance.
  g.add(nodes)
  // World.update() reads userData.timeline to drive the breathing pulse.
  g.userData.timeline = nodes

  return g
}
