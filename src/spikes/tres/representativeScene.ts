import { Mesh, TorusKnotGeometry, type Scene } from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { EnvSphere } from '../../Experience/World/EnvSphere'

export interface RepresentativeSceneResources {
  environment: EnvSphere
  mesh: Mesh<TorusKnotGeometry, MeshBasicNodeMaterial>
  attach(scene: Scene): void
  dispose(): void
}

export function canUseTSLPost(backend: string | null): boolean {
  return backend === 'WebGPUBackend'
}

/**
 * Own the smallest fog-compatible TSL scene as an explicit resource scope.
 * The caller owns scene-wide state such as fog, background and camera.
 */
export function createRepresentativeScene(): RepresentativeSceneResources {
  const environment = new EnvSphere()
  environment.snapToSection(1, false)
  const geometry = new TorusKnotGeometry(0.9, 0.28, 128, 24)
  const material = new MeshBasicNodeMaterial({ color: '#72f1b8', fog: true })
  const mesh = new Mesh(geometry, material)
  mesh.rotation.set(0.3, 0.5, 0)
  let disposed = false

  return {
    environment,
    mesh,
    attach(scene) {
      scene.add(environment)
      scene.add(mesh)
    },
    dispose() {
      if (disposed) return
      disposed = true
      environment.removeFromParent()
      environment.dispose()
      mesh.removeFromParent()
      geometry.dispose()
      material.dispose()
    },
  }
}
