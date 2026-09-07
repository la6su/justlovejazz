import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Group, Scene } from 'three'
import SectionGroupRoots from '../app/scene/SectionGroupRoots.vue'

function renderer() {
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

describe('SectionGroupRoots declarative Tres spike', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })
  afterEach(() => document.body.replaceChildren())

  it('emits five stable roots and releases them with the subtree', async () => {
    let scene: Scene | null = null
    let groups: Group[] = []
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer()) as never,
        onReady: (context) => {
          scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: {
        default: () => h(SectionGroupRoots, { onReady: (value: Group[]) => (groups = value) }),
      },
    })
    await flushPromises()
    expect(groups.map((group) => group.name)).toEqual([
      'section-lab',
      'section-intro',
      'section-about',
      'section-contact',
      'section-menu',
    ])
    expect(groups.every((group) => group.parent === scene)).toBe(true)
    wrapper.unmount()
    expect(groups.every((group) => group.parent === null)).toBe(true)
  })
})
