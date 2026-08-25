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
})
