import { defineComponent, h, onMounted } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import * as THREE from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  loopStop: vi.fn(),
  loopStart: vi.fn(),
  onBeforeLoop: vi.fn((_callback?: (time: number) => void) => () => undefined),
  invalidate: vi.fn(),
  replaceRenderFunction: vi.fn(),
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
    setup(_, { emit, slots }) {
      onMounted(() => {
        emit('ready', {
          scene: { value: new THREE.Scene() },
          renderer: {
            loop: {
              stop: mocks.loopStop,
              start: mocks.loopStart,
              onBeforeLoop: mocks.onBeforeLoop,
            },
            instance: {
              dispose: vi.fn(),
              domElement: document.createElement('canvas'),
              backend: {},
            },
            invalidate: mocks.invalidate,
            replaceRenderFunction: mocks.replaceRenderFunction,
          },
        })
      })
      return () => h('div', [h('canvas'), slots.default?.()])
    },
  }),
}))

vi.mock('../app/scene/CinematicLights.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready', {}))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/CinematicCamera.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready', new THREE.PerspectiveCamera()))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/GroundPlane.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready', {}))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/SectionGroupRoots.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready', []))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/ServicesStageOwner.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready', new THREE.Group()))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/EnvSphereOwner.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() =>
        emit(
          'ready',
          Object.assign(new THREE.Group(), { skyMaterial: new THREE.MeshBasicMaterial() }),
        ),
      )
      return () => null
    },
  }),
}))

vi.mock('../app/scene/EnvSky.vue', () => ({
  default: defineComponent({
    emits: ['ready'],
    setup(_, { emit }) {
      onMounted(() => emit('ready'))
      return () => null
    },
  }),
}))

vi.mock('../app/scene/WorksStageOwner.vue', () => ({
  default: defineComponent({
    props: { stage: Object, installation: Object },
    setup(props) {
      return () =>
        h('div', {
          'data-stage-mounted': props.stage ? 'true' : 'false',
          'data-installation-mounted': props.installation ? 'true' : 'false',
        })
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
    mocks.loopStop.mockReset()
    mocks.loopStart.mockReset()
    mocks.onBeforeLoop.mockClear()
    mocks.invalidate.mockReset()
    mocks.replaceRenderFunction.mockReset()
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
    expect(mocks.loopStop).toHaveBeenCalled()
  })

  it('installs the ADR 0005 bridges and stops Tres internal loop when ready hands ownership to RenderScheduler', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()

    // The render step is delegated away from Tres's default render function.
    expect(mocks.replaceRenderFunction).toHaveBeenCalledOnce()
    // The scheduler frame bridge runs inside Tres's before-render hooks.
    expect(mocks.onBeforeLoop).toHaveBeenCalledOnce()
    // Tres auto-starts its loop on ready; SceneHost pauses it immediately —
    // the RenderScheduler owns start/stop from here.
    expect(mocks.loopStop).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('forwards the before-loop bridge to the registered scheduler frame callback', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()
    const host = await sceneHost.ready

    const frames: number[] = []
    host.loop.onFrame((time) => frames.push(time))
    // SceneHost installs exactly one bridge into the Tres loop; driving it
    // (what the Tres loop does every RAF tick) runs the registered callback
    // with a ms timestamp (the Experience Time.update contract).
    expect(mocks.onBeforeLoop).toHaveBeenCalledOnce()
    const bridge = mocks.onBeforeLoop.mock.calls[0]?.[0] as (time: number) => void
    bridge(0)
    expect(frames).toHaveLength(1)
    expect(typeof frames[0]).toBe('number')

    // After unmount the port clears the callback: a late RAF tick is a no-op.
    wrapper.unmount()
    expect(() => bridge(0)).not.toThrow()
    expect(frames).toHaveLength(1)
  })

  it('routes ecosystem invalidate() calls through the typed wake handler', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()
    const host = await sceneHost.ready

    const wake = vi.fn()
    const unbind = host.loop.onExternalInvalidate(wake)
    // After the ADR 0005 wrap, the manager's invalidate is the bridging one:
    // the base manager call keeps its arguments and the scheduler wake fires.
    const wrapped = (host.context.renderer as { invalidate: (...args: unknown[]) => void })
      .invalidate
    wrapped('frame')
    expect(mocks.invalidate).toHaveBeenCalledWith('frame')
    expect(wake).toHaveBeenCalledOnce()

    // Unsubscribing removes the wake handler without breaking the base call.
    unbind()
    wrapped('frame')
    expect(mocks.invalidate).toHaveBeenCalledTimes(2)
    expect(wake).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('loop port calls after unmount are safe no-ops (documented port contract)', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()
    const host = await sceneHost.ready
    wrapper.unmount()

    expect(() => {
      host.loop.start()
      host.loop.stop()
      host.loop.onFrame(null)
      host.loop.onExternalInvalidate(null)
    }).not.toThrow()
  })

  it('publishes the lazy Works attachment boundary with the ready host', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()

    const host = await sceneHost.ready
    const stage =
      new THREE.Group() as unknown as import('../Experience/World/WorksPlaneStage').WorksPlaneStage
    const installation =
      new THREE.Group() as unknown as import('../Experience/World/WorksInstallation').WorksInstallation
    await host.stages.works.mountStage(stage)
    await host.stages.works.mountInstallation(stage, installation)
    expect(
      document
        .querySelector('[data-stage-mounted="true"]')
        ?.getAttribute('data-installation-mounted'),
    ).toBe('true')

    const staleStage =
      new THREE.Group() as unknown as import('../Experience/World/WorksPlaneStage').WorksPlaneStage
    await host.stages.works.unmountStage(staleStage)
    expect(
      document
        .querySelector('[data-stage-mounted="true"]')
        ?.getAttribute('data-installation-mounted'),
    ).toBe('true')

    await host.stages.works.unmountStage(stage)
    expect(
      document
        .querySelector('[data-stage-mounted="false"]')
        ?.getAttribute('data-installation-mounted'),
    ).toBe('false')
    wrapper.unmount()
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

  it('disposes a recovered renderer when the host unmounts', async () => {
    const wrapper = mount(SceneHost, { attachTo: document.body })
    await flushPromises()

    const replacement = {
      dispose: vi.fn(),
    } as unknown as import('../core/unifiedRenderer').UnifiedRenderSurface
    sceneHost.replaceRenderer(replacement)
    wrapper.unmount()

    expect(replacement.dispose).toHaveBeenCalledOnce()
  })
})
