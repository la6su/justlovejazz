import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Scene } from 'three'
import GroundPlane from '../app/scene/GroundPlane.vue'
import type { GroundPlaneNode } from '../Experience/Scene/GroundPlane'

function createRenderer() {
  const canvas = document.createElement('canvas')
  return {
    isRenderer: true,
    domElement: canvas,
    init: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    dispose: vi.fn(),
    shadowMap: { enabled: false, type: 0 },
  }
}

describe('GroundPlane declarative Tres component', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  it('mounts and removes the exclusive ground node with the Tres subtree', async () => {
    const renderer = createRenderer()
    const mounted = { scene: null as Scene | null, ground: null as GroundPlaneNode | null }
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
      slots: {
        default: () =>
          h(GroundPlane, { onReady: (node: GroundPlaneNode) => (mounted.ground = node) }),
      },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const scene = mounted.scene as Scene
    const ground = mounted.ground as GroundPlaneNode
    expect(scene.getObjectByName('ground')).toBe(ground)
    expect(ground.geometry.parameters.width).toBe(200)
    expect(ground.material.depthWrite).toBe(false)

    wrapper.unmount()
    expect(scene.getObjectByName('ground')).toBeUndefined()
  })
})
