import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { GroundPlane, type GroundConfig } from '../Experience/Scene/GroundPlane'

const config: GroundConfig = { color: new THREE.Color(0x123456), opacity: 0.5 }

describe('GroundPlane lifecycle', () => {
  it('skips unchanged material writes while preserving changed transforms and themes', () => {
    const scene = new THREE.Scene()
    const ground = new GroundPlane(scene)
    const colorCopy = vi.spyOn(ground.object.material.color, 'copy')
    const next = { color: new THREE.Color(0xabcdef), opacity: 0.9 }

    ground.applyTransform(config, config, 0)
    const writesAfterFirstTransform = colorCopy.mock.calls.length
    ground.applyTransform(config, config, 0)

    expect(colorCopy).toHaveBeenCalledTimes(writesAfterFirstTransform)
    ground.applyTransform(config, next, 1)
    expect(ground.object.material.color.getHex()).toBe(0xabcdef)
    expect(ground.object.material.opacity).toBe(0.9)

    ground.syncTheme(true)
    expect(ground.object.material.color.getHex()).toBe(0x161616)
    expect(ground.object.material.opacity).toBe(0.4)
    const writesAfterTheme = colorCopy.mock.calls.length
    ground.applyTransform(config, next, 1)
    expect(colorCopy).toHaveBeenCalledTimes(writesAfterTheme)
    ground.dispose()
  })

  it('ignores late theme, transform and visibility calls after teardown', () => {
    const scene = new THREE.Scene()
    const ground = new GroundPlane(scene)
    ground.setSectionVisible(true)
    const opacity = ground.object.material.opacity

    ground.dispose()
    ground.dispose()
    ground.applyInitialConfig(config)
    ground.syncTheme(true)
    ground.applyTransform(config, { color: new THREE.Color(0xabcdef), opacity: 0.9 }, 1)
    ground.setSectionVisible(false)

    expect(ground.object.material.opacity).toBe(opacity)
    expect(ground.object.visible).toBe(true)
    expect(ground.object.parent).toBeNull()
  })
})
