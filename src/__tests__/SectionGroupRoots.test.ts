import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createRendererMock, installCanvasPointerShims } from './tresHarness'
import type { Group, Scene } from 'three'
import SectionGroupRoots from '../app/scene/SectionGroupRoots.vue'

describe('SectionGroupRoots declarative Tres spike', () => {
  beforeAll(() => {
    installCanvasPointerShims()
  })
  afterEach(() => document.body.replaceChildren())

  it('emits five stable roots and releases them with the subtree', async () => {
    let scene: Scene | null = null
    let groups: Group[] = []
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => createRendererMock()) as never,
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
