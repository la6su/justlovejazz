import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { Camera } from '../Experience/Camera'
import { Sizes } from '../Experience/Sizes'
import { setCurrentPage } from '../core/routePage'

describe('Camera route ownership', () => {
  beforeEach(() => {
    setCurrentPage('home')
    vi.spyOn(THREE.PerspectiveCamera.prototype, 'lookAt').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.removeAttribute('data-page')
  })

  it('uses the typed route port instead of the body dataset', () => {
    const sizes = new Sizes()
    const camera = new Camera(sizes, new THREE.PerspectiveCamera())
    camera.instance.fov = 75
    camera.instance.aspect = 1
    document.body.dataset.page = 'contact'

    camera.update(1 / 60)
    const homeFov = camera.instance.fov

    expect(homeFov).toBeGreaterThan(75)
    setCurrentPage('contact')
    camera.update(1 / 60)
    const contactFov = camera.instance.fov

    expect(contactFov).not.toBe(homeFov)
    camera.destroy()
    sizes.destroy()
  })
})
