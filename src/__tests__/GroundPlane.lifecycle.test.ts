import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { GroundPlane, type GroundConfig } from '../Experience/Scene/GroundPlane'

const config: GroundConfig = { color: new THREE.Color(0x123456), opacity: 0.5 }

describe('GroundPlane lifecycle', () => {
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
