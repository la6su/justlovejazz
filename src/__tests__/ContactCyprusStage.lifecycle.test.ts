import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  loadAsync: vi.fn(),
  dracoDispose: vi.fn(),
}))

vi.mock('three/addons/loaders/DRACOLoader.js', () => ({
  DRACOLoader: class {
    setDecoderPath(): this {
      return this
    }

    dispose(): void {
      mocks.dracoDispose()
    }
  },
  DRACO_GLTF_CONFIG: '/mock-draco/',
}))

vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    setDRACOLoader(): this {
      return this
    }

    loadAsync(...args: unknown[]): Promise<{ scene: THREE.Group }> {
      return mocks.loadAsync(...args)
    }
  },
}))

import { ContactCyprusStage } from '../Experience/World/ContactCyprusStage'

describe('ContactCyprusStage async lifecycle', () => {
  it('does not attach a GLTF result after disposal wins the pending load', async () => {
    mocks.loadAsync.mockReset()
    mocks.dracoDispose.mockReset()
    let resolveLoad!: (result: { scene: THREE.Group }) => void
    mocks.loadAsync.mockImplementation(
      () =>
        new Promise<{ scene: THREE.Group }>((resolve) => {
          resolveLoad = resolve
        }),
    )

    const stage = new ContactCyprusStage()
    const loading = stage.load()
    stage.dispose()
    resolveLoad({ scene: new THREE.Group() })
    await loading

    expect(stage.children).toHaveLength(0)
    expect(mocks.dracoDispose).toHaveBeenCalledTimes(1)
    stage.dispose()
    expect(stage.children).toHaveLength(0)
  })

  it('releases camera, active state and child graph on disposal', () => {
    const stage = new ContactCyprusStage()
    stage.setCamera(new THREE.PerspectiveCamera())
    stage.setActive(true)
    const model = new THREE.Group()
    model.add(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()))
    const internals = stage as unknown as {
      _model: THREE.Object3D | null
      _camera: THREE.Camera | null
      _active: boolean
    }
    internals._model = model
    stage.add(model)

    stage.dispose()

    expect(stage.children).toHaveLength(0)
    expect(internals._model).toBeNull()
    expect(internals._camera).toBeNull()
    expect(internals._active).toBe(false)
    expect(stage.isActive).toBe(false)
  })
})
