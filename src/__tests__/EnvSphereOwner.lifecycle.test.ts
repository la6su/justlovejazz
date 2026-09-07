import { TresCanvas } from '@tresjs/core'
import { defineComponent, h, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Mesh, Scene } from 'three'
import EnvSky from '../app/scene/EnvSky.vue'
import EnvSphereOwner from '../app/scene/EnvSphereOwner.vue'
import type { EnvSphere } from '../Experience/World/EnvSphere'

function createRenderer() {
  return {
    isRenderer: true,
    domElement: document.createElement('canvas'),
    init: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    dispose: vi.fn(),
    shadowMap: { enabled: false, type: 0 },
  }
}

describe('EnvSphereOwner declarative sky lifecycle', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  it('gives Tres the sky geometry while EnvSphere disposes its borrowed material once', async () => {
    const renderer = createRenderer()
    const mounted = {
      scene: null as Scene | null,
      sphere: null as EnvSphere | null,
      sky: null as Mesh | null,
    }
    const Harness = defineComponent({
      setup() {
        const sphere = shallowRef<EnvSphere | null>(null)
        return () => [
          h(EnvSphereOwner, {
            onReady: (owner: EnvSphere) => {
              sphere.value = owner
              mounted.sphere = owner
            },
          }),
          sphere.value
            ? h(EnvSky, {
                material: sphere.value.skyMaterial,
                onReady: (sky: Mesh) => (mounted.sky = sky),
              })
            : null,
        ]
      },
    })

    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer) as never,
        onReady: (context: { scene: { value: Scene }; renderer: { loop: { stop(): void } } }) => {
          mounted.scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: { default: () => h(Harness) },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const scene = mounted.scene as Scene
    const sphere = mounted.sphere as EnvSphere
    const sky = mounted.sky as Mesh
    const disposeMaterial = vi.spyOn(sphere.skyMaterial, 'dispose')
    const disposeGeometry = vi.spyOn(sky.geometry, 'dispose')

    expect(sphere.getObjectByName('pavilion-sky')).toBeUndefined()
    expect(scene.getObjectByName('pavilion-sky')).toBe(sky)
    expect(sky.material).toBe(sphere.skyMaterial)

    wrapper.unmount()

    expect(disposeGeometry).toHaveBeenCalledOnce()
    expect(disposeMaterial).toHaveBeenCalledOnce()
    expect(scene.getObjectByName('pavilion-sky')).toBeUndefined()
    expect(sphere.parent).toBeNull()
  })
})
