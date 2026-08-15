import { Mesh, TorusKnotGeometry, type Camera, type Scene } from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { ParticleBurst } from '../../Experience/World/ParticleBurst'
import { EnvSphere } from '../../Experience/World/EnvSphere'
import { CasePlane } from '../../Experience/World/CasePlane'
import { loadCaseTexture, releaseCaseTexture } from '../../Experience/World/caseTexture'
import { ContactCyprusStage } from '../../Experience/World/ContactCyprusStage'

const REPRESENTATIVE_CASE_TEXTURE = '/assets/projects/ebb-vibes/cover-studio-v2.jpg'

export interface RepresentativeSceneResources {
  environment: EnvSphere
  burst: ParticleBurst
  mesh: Mesh<TorusKnotGeometry, MeshBasicNodeMaterial>
  attach(scene: Scene): void
  loadWorksPlane(): Promise<boolean>
  loadContactModel(camera: Camera): Promise<boolean>
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
  const burst = new ParticleBurst()
  burst.trigger(0, 0, 0)
  burst.update(0.2)
  const geometry = new TorusKnotGeometry(0.9, 0.28, 128, 24)
  const material = new MeshBasicNodeMaterial({ color: '#72f1b8', fog: true })
  const mesh = new Mesh(geometry, material)
  mesh.rotation.set(0.3, 0.5, 0)
  let disposed = false
  let attachedScene: Scene | null = null
  let casePlane: CasePlane | null = null
  let textureAcquired = false
  let caseLoad: Promise<boolean> | null = null
  let contactStage: ContactCyprusStage | null = null
  let contactLoad: Promise<boolean> | null = null

  const releaseTexture = () => {
    if (!textureAcquired) return
    textureAcquired = false
    releaseCaseTexture(REPRESENTATIVE_CASE_TEXTURE)
  }

  return {
    environment,
    burst,
    mesh,
    attach(scene) {
      attachedScene = scene
      scene.add(environment)
      scene.add(burst)
      scene.add(mesh)
    },
    loadWorksPlane() {
      if (caseLoad) return caseLoad
      caseLoad = loadCaseTexture(REPRESENTATIVE_CASE_TEXTURE).then((texture) => {
        textureAcquired = true
        if (disposed || !attachedScene) {
          releaseTexture()
          return false
        }

        casePlane = new CasePlane(texture)
        casePlane.position.set(0.8, -1.1, -0.4)
        casePlane.scale.setScalar(0.85)
        casePlane.setReveal(1)
        casePlane.pulse()
        casePlane.update(0.12, true)
        attachedScene.add(casePlane)
        return true
      })
      return caseLoad
    },
    loadContactModel(camera) {
      if (contactLoad) return contactLoad
      const stage = new ContactCyprusStage()
      stage.setCamera(camera)
      contactLoad = stage.load().then(() => {
        if (disposed || !attachedScene) {
          stage.dispose()
          return false
        }

        stage.setActive(true)
        stage.update(0.52)
        attachedScene.add(stage)
        contactStage = stage
        return true
      })
      return contactLoad
    },
    dispose() {
      if (disposed) return
      disposed = true
      casePlane?.dispose()
      casePlane = null
      releaseTexture()
      contactStage?.dispose()
      contactStage = null
      environment.removeFromParent()
      environment.dispose()
      burst.removeFromParent()
      burst.dispose()
      mesh.removeFromParent()
      geometry.dispose()
      material.dispose()
      attachedScene = null
    },
  }
}
