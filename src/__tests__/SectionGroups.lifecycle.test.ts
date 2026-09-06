import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { SectionGroups } from '../Experience/Scene/SectionGroups'
import { JunniParticles } from '../Experience/World/JunniParticles'

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

  it('gives particle owners terminal disposal before the generic resource sweep', () => {
    const scene = new THREE.Scene()
    const owner = new SectionGroups(scene, 0)
    const group = new THREE.Group()
    const particles = new JunniParticles({ count: 4 })
    group.userData.particles = particles
    group.add(particles)
    scene.add(group)
    owner.groups.push(group)

    const particleDispose = vi.spyOn(particles, 'dispose')
    const geometryDispose = vi.spyOn(particles.geometry, 'dispose')
    const materialDispose = vi.spyOn(particles.material as THREE.Material, 'dispose')

    owner.dispose()
    owner.dispose()
    particles.update(1)

    expect(particleDispose).toHaveBeenCalledOnce()
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).toHaveBeenCalledOnce()
    expect(particles.parent).toBeNull()
  })
})
