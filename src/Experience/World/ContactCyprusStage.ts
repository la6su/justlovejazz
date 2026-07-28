// ContactCyprusStage — camera-local 3D location marker for Contact / Agros.

import * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { disposeMaterialDeep } from '../../Utils/dispose'

/**
 * The Cyprus asset is a route-owned visual, loaded only when Contact opens.
 * Keeping it camera-local gives Agros a stable hero composition independent
 * of the shared six-slot world's camera interpolation.
 */
export class ContactCyprusStage extends THREE.Group {
  private _camera: THREE.Camera | null = null
  private _model: THREE.Group | null = null
  private _active = false
  private _cameraPosition = new THREE.Vector3()

  constructor() {
    super()
    this.name = 'contact-cyprus-stage'
    this.visible = false
  }

  async load(): Promise<void> {
    // The model is Draco-compressed. Keep the decoder local and route-owned:
    // neither its worker nor the terrain bytes belong on the startup path.
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/assets/draco/')
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader)
    let gltf: Awaited<ReturnType<GLTFLoader['loadAsync']>>
    try {
      gltf = await loader.loadAsync('/assets/gltf/cyprus_3d.glb')
    } finally {
      dracoLoader.dispose()
    }
    const model = gltf.scene
    const bounds = new THREE.Box3().setFromObject(model)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const largestAxis = Math.max(size.x, size.y, size.z, 0.001)

    // Normalize arbitrary authoring units, then compose it as a broad backdrop.
    model.scale.setScalar(7.6 / largestAxis)
    model.position.copy(center).multiplyScalar(-7.6 / largestAxis)
    model.position.add(new THREE.Vector3(0, 0.42, -10))
    // The source terrain is authored flat on the X/Z plane. Turn its relief
    // toward the viewer before adding the small authored perspective tilt.
    model.rotation.set(1.05, -0.3, 0.04)

    model.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.frustumCulled = false
      // MeshPhysicalMaterial uses Three's PhysicalLightingModel on WebGPU.
      // Transmission, thickness and IOR refract the already-rendered scene;
      // roughness turns that into restrained frosted distortion rather than
      // a perfectly clear lens. WebGL2 receives the equivalent physical path.
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      sourceMaterials.forEach((material) => disposeMaterialDeep(material))
      mesh.material = new THREE.MeshPhysicalMaterial({
        color: 0xc4e9c8,
        transmission: 0.82,
        thickness: 13.5,
        ior: 1.32,
        roughness: 0.2,
        metalness: 0.04,
        envMapIntensity: 1.9,
        clearcoat: 0.82,
        clearcoatRoughness: 0.12,
        iridescence: 0.18,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [120, 300],
        dispersion: 0.08,
        attenuationColor: new THREE.Color(0xb9f1c0),
        attenuationDistance: 1.4,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    })

    this._model = model
    this.add(model)
  }

  setCamera(camera: THREE.Camera): void {
    this._camera = camera
  }

  setActive(active: boolean): void {
    this._active = active
    this.visible = active && this._model !== null
  }

  resize(width: number, height: number): void {
    const scale = THREE.MathUtils.clamp(width / height / 1.78, 0.78, 1.2)
    this.scale.setScalar(scale)
  }

  update(): void {
    if (!this._active || !this._camera) return
    this._camera.getWorldPosition(this._cameraPosition)
    this.position.copy(this._cameraPosition)
    this.quaternion.copy(this._camera.quaternion)
  }

  dispose(): void {
    this._model?.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => disposeMaterialDeep(material))
    })
    this._model = null
    this.removeFromParent()
  }
}
