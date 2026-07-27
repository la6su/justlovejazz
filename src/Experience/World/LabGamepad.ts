import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

/**
 * A self-contained Lab object. It deliberately uses ordinary PBR materials:
 * scene.environment supplies the shared reflection map, so the experiment
 * does not allocate its own PMREM renderer or texture set.
 */
export class LabGamepad extends THREE.Group {
  private readonly _geometries: THREE.BufferGeometry[] = []
  private readonly _materials: THREE.Material[] = []

  constructor() {
    super()
    this.name = 'lab-gamepad'
    this.scale.setScalar(0.009)
    this.position.set(0, 0, 0)
    this.rotation.set(-0.12, -0.24, 0.04)

    const shell = this._material(
      new THREE.MeshPhysicalMaterial({
        color: 0xe9e6df,
        roughness: 0.23,
        metalness: 0.12,
        clearcoat: 0.75,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.2,
      }),
    )
    const accent = this._material(
      new THREE.MeshPhysicalMaterial({
        color: 0xb8f45a,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      }),
    )
    const dark = this._material(
      new THREE.MeshStandardMaterial({ color: 0x101313, roughness: 0.42, metalness: 0.2 }),
    )
    const metal = this._material(
      new THREE.MeshStandardMaterial({ color: 0x9ca5a4, roughness: 0.26, metalness: 0.9 }),
    )

    const body = new THREE.Mesh(this._geometry(new RoundedBoxGeometry(120, 90, 12, 8, 5)), shell)
    body.name = 'gamepad-body'
    body.castShadow = true
    body.receiveShadow = true
    this.add(body)

    this._addBox('screen-frame', 94, 58, 2.4, 0, 11, 7.2, dark)
    this._addBox('screen', 87, 51, 1.8, 0, 11, 9.15, metal)

    const dpad = new THREE.Mesh(this._geometry(this._createDPadGeometry()), accent)
    dpad.name = 'gamepad-dpad'
    dpad.position.set(-35, -25, 8.5)
    dpad.castShadow = true
    this.add(dpad)

    const buttonGeometry = this._geometry(new THREE.CylinderGeometry(6, 6, 3, 32))
    buttonGeometry.rotateX(Math.PI / 2)
    this._addMesh('button-a', buttonGeometry, accent, 25, -25, 8.5)
    this._addMesh('button-b', buttonGeometry, accent, 45, -25, 8.5)

    const screwGeometry = this._geometry(new THREE.CylinderGeometry(2.5, 2.5, 1.2, 20))
    screwGeometry.rotateX(Math.PI / 2)
    const screwPositions: ReadonlyArray<readonly [number, number]> = [
      [-54, -35],
      [54, -35],
      [-54, 35],
      [54, 35],
    ]
    for (const [x, y] of screwPositions) {
      this._addMesh('gamepad-screw', screwGeometry, metal, x, y, 7.4)
    }

    this._addBox('crank-arm', 5.5, 28, 5.5, 65, 0, 0, metal)
    const knob = new THREE.Mesh(this._geometry(new THREE.SphereGeometry(5.5, 24, 16)), accent)
    knob.name = 'gamepad-crank-knob'
    knob.position.set(65, 17, 0)
    knob.castShadow = true
    this.add(knob)
  }

  private _geometry<T extends THREE.BufferGeometry>(geometry: T): T {
    this._geometries.push(geometry)
    return geometry
  }

  private _material<T extends THREE.Material>(material: T): T {
    this._materials.push(material)
    return material
  }

  private _addBox(
    name: string,
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ): void {
    this._addMesh(
      name,
      this._geometry(new RoundedBoxGeometry(width, height, depth, 6, 3)),
      material,
      x,
      y,
      z,
    )
  }

  private _addMesh(
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ): void {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    this.add(mesh)
  }

  private _createDPadGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape()
    const points: Array<[number, number]> = [
      [-8, -3],
      [-3, -3],
      [-3, -8],
      [3, -8],
      [3, -3],
      [8, -3],
      [8, 3],
      [3, 3],
      [3, 8],
      [-3, 8],
      [-3, 3],
      [-8, 3],
    ]
    points.forEach(([x, y], index) => {
      if (index === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 3,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.65,
      bevelThickness: 0.65,
      curveSegments: 4,
    })
    geometry.center()
    return geometry
  }

  public dispose(): void {
    this.removeFromParent()
    this._geometries.forEach((geometry) => geometry.dispose())
    this._materials.forEach((material) => material.dispose())
    this._geometries.length = 0
    this._materials.length = 0
  }
}
