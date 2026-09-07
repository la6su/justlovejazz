import { TresCanvas } from '@tresjs/core'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { WorksInstallation } from '../Experience/World/WorksInstallation'

const PrimitiveMount = defineComponent({
  props: {
    object: { type: Object, required: true },
  },
  setup(props) {
    return () => h('primitive', { object: props.object, dispose: null })
  },
})

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

describe('WorksInstallation Tres primitive boundary', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  async function mountPrimitive(stage: THREE.Group) {
    const renderer = createRenderer()
    const mounted = { scene: null as THREE.Scene | null }
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
      slots: { default: () => h(PrimitiveMount, { object: stage }) },
    })
    await flushPromises()
    return { wrapper, scene: mounted.scene }
  }

  it('keeps camera-local transforms and GPU disposal with the controller during Tres unmount', async () => {
    const stage = new THREE.Group()
    stage.position.set(2, -3, 5)
    stage.rotation.set(0.2, -0.4, 0.1)
    stage.scale.setScalar(1.7)
    const installation = new WorksInstallation()
    installation.position.set(0.35, 0, -5.6)
    installation.rotation.set(0.1, 0.2, -0.05)
    installation.scale.setScalar(0.8)
    stage.add(installation)
    stage.updateMatrixWorld(true)
    const beforeUnmount = installation.matrixWorld.clone()

    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    let instanced: THREE.InstancedMesh | null = null
    installation.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      geometries.add(node.geometry)
      const material = node.material
      if (Array.isArray(material)) material.forEach((item) => materials.add(item))
      else materials.add(material)
      if (node instanceof THREE.InstancedMesh) instanced = node
    })
    const geometryDispose = [...geometries].map((geometry) => vi.spyOn(geometry, 'dispose'))
    const materialDispose = [...materials].map((material) => vi.spyOn(material, 'dispose'))
    const instancedDispose = vi.spyOn(instanced!, 'dispose')

    const { wrapper, scene } = await mountPrimitive(stage)

    expect(stage.parent).toBe(scene)
    expect(installation.parent).toBe(stage)
    installation.updateMatrixWorld(true)
    expect(installation.matrixWorld.elements).toEqual(beforeUnmount.elements)

    wrapper.unmount()

    expect(stage.parent).toBeNull()
    expect(installation.parent).toBe(stage)
    expect(geometryDispose.every((dispose) => dispose.mock.calls.length === 0)).toBe(true)
    expect(materialDispose.every((dispose) => dispose.mock.calls.length === 0)).toBe(true)
    expect(instancedDispose).not.toHaveBeenCalled()

    installation.dispose()

    expect(geometryDispose.every((dispose) => dispose.mock.calls.length === 1)).toBe(true)
    expect(materialDispose.every((dispose) => dispose.mock.calls.length === 1)).toBe(true)
    expect(instancedDispose).toHaveBeenCalledTimes(1)
  })

  it('can reattach the same stage identity after a Tres root remount without duplicating children', async () => {
    const stage = new THREE.Group()
    const installation = new WorksInstallation()
    stage.add(installation)

    const first = await mountPrimitive(stage)
    expect(first.scene?.children.filter((child) => child === stage)).toHaveLength(1)
    first.wrapper.unmount()
    expect(stage.parent).toBeNull()

    const second = await mountPrimitive(stage)
    expect(second.scene?.children.filter((child) => child === stage)).toHaveLength(1)
    expect(installation.parent).toBe(stage)
    second.wrapper.unmount()
    installation.dispose()
  })
})
