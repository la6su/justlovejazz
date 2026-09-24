import { TresCanvas } from '@tresjs/core'
import { h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRendererMock, installCanvasPointerShims } from './tresHarness'
import * as THREE from 'three'
import EnvSky from '../app/scene/EnvSky.vue'

describe('EnvSky declarative lifecycle spike', () => {
  beforeAll(() => {
    installCanvasPointerShims()
  })
  afterEach(() => document.body.replaceChildren())

  it('owns the plane geometry while borrowing the ambient material', async () => {
    const renderer = createRendererMock()
    const material = new THREE.MeshBasicMaterial()
    const mounted = { scene: null as THREE.Scene | null, mesh: null as THREE.Mesh | null }
    const wrapper = mount(TresCanvas, {
      attachTo: document.body,
      props: {
        renderMode: 'manual',
        renderer: (() => renderer) as never,
        onReady: (context) => {
          mounted.scene = context.scene.value
          context.renderer.loop.stop()
        },
      },
      slots: {
        default: () =>
          h(EnvSky, { material, onReady: (mesh: THREE.Mesh) => (mounted.mesh = mesh) }),
      },
    })
    await flushPromises()
    expect(mounted.mesh?.parent).toBe(mounted.scene)
    expect(mounted.mesh?.geometry).toBeInstanceOf(THREE.PlaneGeometry)
    expect(mounted.mesh?.material).toBe(material)
    const dispose = vi.spyOn(material, 'dispose')
    wrapper.unmount()
    expect(dispose).not.toHaveBeenCalled()
    expect(material.dispose).not.toHaveBeenCalled()
    material.dispose()
  })
})
