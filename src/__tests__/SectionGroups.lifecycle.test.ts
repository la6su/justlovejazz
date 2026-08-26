import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { SectionGroups } from '../Experience/Scene/SectionGroups'

describe('SectionGroups lifecycle', () => {
  it('keeps recursive disposal terminal and makes late lookup inert', () => {
    const scene = new THREE.Scene()
    const owner = new SectionGroups(scene, 0)
    const group = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial()
    group.add(new THREE.Mesh(geometry, material))
    scene.add(group)
    owner.groups.push(group)

    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const materialDispose = vi.spyOn(material, 'dispose')
    owner.dispose()
    owner.dispose()

    expect(geometryDispose).toHaveBeenCalledTimes(1)
    expect(materialDispose).toHaveBeenCalledTimes(1)
    expect(owner.at(0)).toBeUndefined()
    expect(owner.groups).toHaveLength(0)
    expect(group.parent).toBeNull()
  })
})
