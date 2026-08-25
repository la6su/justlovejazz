import { defineComponent, h, onMounted } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  candidate: {
    dispose: vi.fn(),
    backend: {},
    domElement: document.createElement('canvas'),
  },
  init: vi.fn(),
}))

vi.mock('@tresjs/core', () => ({
  TresCanvas: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => {
        emit('ready', {
          scene: { value: new THREE.Scene() },
          renderer: {
            instance: {
              dispose: vi.fn(),
              domElement: document.createElement('canvas'),
              backend: {},
            },
          },
        })
      })
      return () => h('canvas')
    },
  }),
}))

vi.mock('../core/unifiedRenderer', () => ({
  createUnifiedWebGPUInstance: vi.fn(() => mocks.candidate),
  initUnifiedWebGPUInstance: mocks.init,
  inspectUnifiedBackend: vi.fn(() => ({ backendName: 'WebGPU', isFallbackAdapter: true })),
}))

vi.mock('../core/rendererBackend', () => ({
  planUnifiedBackend: vi.fn(() => ({ recreate: true, mode: 'webgl' })),
}))

import SceneHost from '../app/SceneHost.vue'
import { __resetSceneHostForTests, sceneHost } from '../app/sceneHost'

describe('SceneHost async lifecycle', () => {
  beforeEach(() => {
    mocks.candidate.dispose.mockReset()
    mocks.init.mockReset()
    __resetSceneHostForTests()
  })

  it('disposes a late fallback candidate after unmount', async () => {
    let resolveInit!: () => void
    mocks.init.mockImplementationOnce(() => new Promise<void>((resolve) => (resolveInit = resolve)))

    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()
    wrapper.unmount()
    resolveInit()
    await flushPromises()

    expect(mocks.candidate.dispose).toHaveBeenCalledOnce()
    expect(sceneHost.isSettled).toBe(false)
  })

  it('disposes and rejects when fallback initialization fails', async () => {
    const error = new Error('fallback init failed')
    mocks.init.mockRejectedValueOnce(error)

    const readyRejection = expect(sceneHost.ready).rejects.toBe(error)
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()

    expect(mocks.candidate.dispose).toHaveBeenCalledOnce()
    await readyRejection
    wrapper.unmount()
  })

  it('disposes the resolved renderer when the host unmounts', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()

    wrapper.unmount()

    expect(mocks.candidate.dispose).toHaveBeenCalledOnce()
  })
})
