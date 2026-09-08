import { TresCanvas } from '@tresjs/core'
import { h, markRaw, shallowRef } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import WorksStageOwner from '../app/scene/WorksStageOwner.vue'
import { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'
import { WorksInstallation } from '../Experience/World/WorksInstallation'

describe('WorksStageOwner declarative attachment', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
    HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
  })

  afterEach(() => document.body.replaceChildren())

  it.each(['vue-first', 'runtime-first'] as const)(
    'transfers and releases installation nodes (%s)',
    async (order) => {
      const renderer = {
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
      const stage = new WorksPlaneStage()
      const dispose = vi.spyOn(stage, 'dispose')
      const stageRef = shallowRef<WorksPlaneStage | null>(null)
      const installationRef = shallowRef<WorksInstallation | null>(null)
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
        slots: {
          default: () =>
            h(WorksStageOwner, { stage: stageRef.value, installation: installationRef.value }),
        },
      })
      await flushPromises()

      stageRef.value = stage
      await flushPromises()
      expect(stage.parent).toBe(mounted.scene)

      const installation = markRaw(new WorksInstallation())
      const metalDispose = vi.spyOn(installation.metalMaterial, 'dispose')
      const signalDispose = vi.spyOn(installation.signalMaterial, 'dispose')
      installationRef.value = installation
      await flushPromises()
      const assembly = stage.getObjectByName('works-installation-assembly') as THREE.Group
      expect(assembly).toBeInstanceOf(THREE.Group)
      expect(assembly.children).toHaveLength(5)
      const geometries = assembly.children
        .filter((node): node is THREE.Mesh => node instanceof THREE.Mesh)
        .map((node) => node.geometry)
      const geometryDispose = geometries.map((geometry) => vi.spyOn(geometry, 'dispose'))
      const ticks = assembly.children[4] as THREE.InstancedMesh
      const ticksDispose = vi.spyOn(ticks, 'dispose')
      expect(ticks.count).toBe(48)

      const replacement = markRaw(new WorksInstallation())
      const replacementMetalDispose = vi.spyOn(replacement.metalMaterial, 'dispose')
      const replacementSignalDispose = vi.spyOn(replacement.signalMaterial, 'dispose')
      replacement.setProject(1)
      installationRef.value = replacement
      await flushPromises()
      expect(stage.getObjectByName('works-installation-assembly')).toBe(assembly)
      expect((assembly.children[0] as THREE.Mesh).material).toBe(replacement.metalMaterial)
      expect(ticks.material).toBe(replacement.signalMaterial)
      expect(ticks.visible).toBe(false)
      installation.setProject(0)
      installation.setCameraLocalLayout(9, 9, 9, 9)
      expect(ticks.visible).toBe(false)
      expect(assembly.position.x).toBe(0)
      expect(installation.isAnimating).toBe(false)
      expect(geometryDispose.every((dispose) => dispose.mock.calls.length === 0)).toBe(true)

      if (order === 'runtime-first') replacement.dispose()
      installationRef.value = null
      await flushPromises()
      expect(assembly.parent).toBeNull()
      expect(geometryDispose.map((dispose) => dispose.mock.calls.length)).toEqual([1, 1, 1, 1, 1])
      expect(ticksDispose).toHaveBeenCalledTimes(1)
      expect(metalDispose).not.toHaveBeenCalled()
      expect(signalDispose).not.toHaveBeenCalled()
      replacement.setProject(0)
      replacement.setCameraLocalLayout(9, 9, 9, 9)
      expect(ticks.visible).toBe(false)
      expect(assembly.position.x).toBe(0)
      expect(replacement.isAnimating).toBe(false)
      stageRef.value = null
      await flushPromises()
      expect(stage.parent).toBeNull()
      expect(dispose).not.toHaveBeenCalled()

      wrapper.unmount()
      stage.dispose()
      expect(dispose).toHaveBeenCalledTimes(1)
      installation.dispose()
      replacement.dispose()
      expect(replacementMetalDispose).toHaveBeenCalledTimes(1)
      expect(replacementSignalDispose).toHaveBeenCalledTimes(1)
      expect(metalDispose).toHaveBeenCalledTimes(1)
      expect(signalDispose).toHaveBeenCalledTimes(1)
    },
  )
})
