import * as THREE from 'three'

export interface SmokeSystemConfig {
  count?: number
  spread?: number
  depth?: number
  opacityRange?: [number, number]
  color?: THREE.Color
  scrollCoupling?: number
}

export class SmokeSystem extends THREE.Group {
  private particles: THREE.Points
  private velocities: Float32Array
  private config: Required<SmokeSystemConfig>

  constructor(config: SmokeSystemConfig = {}) {
    super()

    this.config = {
      count: config.count ?? 200,
      spread: config.spread ?? 12,
      depth: config.depth ?? 8,
      opacityRange: config.opacityRange ?? [0.02, 0.12],
      color: config.color ?? new THREE.Color(0.08, 0.08, 0.12),
      scrollCoupling: config.scrollCoupling ?? 0.4,
    }

    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(this.config.count * 3)
    this.velocities = new Float32Array(this.config.count * 3)

    for (let i = 0; i < this.config.count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * this.config.spread
      positions[i3 + 1] = (Math.random() - 0.5) * this.config.depth
      positions[i3 + 2] = (Math.random() - 0.5) * this.config.spread

      this.velocities[i3] = (Math.random() - 0.5) * 0.01
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.005
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.01
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const texture = this.createSmokeTexture()
    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: texture,
      transparent: true,
      opacity: 0.5,
      color: this.config.color,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    this.particles = new THREE.Points(geo, material)
    this.add(this.particles)
  }

  update(delta: number, scrollProgress: number): void {
    for (let i = 0; i < this.config.count; i++) {
      const i3 = i * 3
      this.velocities[i3] += (Math.random() - 0.5) * 0.001
      this.velocities[i3 + 1] += (Math.random() - 0.5) * 0.0005
      this.velocities[i3 + 2] += (Math.random() - 0.5) * 0.001

      this.particles.geometry.attributes.position.array[i3] += this.velocities[i3] * delta
      this.particles.geometry.attributes.position.array[i3 + 1] += this.velocities[i3 + 1] * delta
      this.particles.geometry.attributes.position.array[i3 + 2] += this.velocities[i3 + 2] * delta

      const spread = this.config.spread / 2
      if (Math.abs(this.particles.geometry.attributes.position.array[i3]) > spread) {
        this.particles.geometry.attributes.position.array[i3] *= -0.5
        this.velocities[i3] *= 0.1
      }
      if (Math.abs(this.particles.geometry.attributes.position.array[i3 + 1]) > this.config.depth / 2) {
        this.velocities[i3 + 1] *= -0.1
      }
    }

    this.particles.position.y -= scrollProgress * this.config.scrollCoupling * delta
    this.particles.rotation.y += delta * 0.01
    this.particles.geometry.attributes.position.needsUpdate = true
  }

  dispose(): void {
    this.particles.geometry.dispose()
    if (this.particles.material && typeof (this.particles.material as THREE.Material).dispose === 'function') {
        (this.particles.material as THREE.Material).dispose()
    }
    super.clear()
  }

  private createSmokeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
    gradient.addColorStop(0.5, 'rgba(250, 250, 255, 0.08)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }
}
