import * as THREE from 'three'

/**
 * Parallax star field with scroll-reactive glow.
 *
 * Layers at different depths move at different speeds (parallax).
 * Each star has a time-varying attraction to scroll delta — when the user
 * scrolls, stars "bloom" (opacity ↑, size ↑) then decay back to baseline.
 */
export class StarField {
  private group = new THREE.Group()

  // Per-layer: geometry + Points + depth
  private layers: { geo: THREE.BufferGeometry; points: THREE.Points; depth: number; baseOpacity: number }[] = []
  private glowIntensity = 0
  private decayRate = 1.5
  private lastScroll = 0

  constructor(parent: THREE.Object3D, count: number = 200) {
    this.buildLayers(count)
    parent.add(this.group)
  }

  /** Build 3 depth layers: far (slow), mid, near (fast) */
  private buildLayers(starsTotal: number): void {
    const layers: { depth: number; baseOpacity: number; spread: number; count: number }[] = [
      { depth: 30, baseOpacity: 0.12, spread: 80, count: Math.floor(starsTotal * 0.6) },   // far
      { depth: 15, baseOpacity: 0.22, spread: 50, count: Math.floor(starsTotal * 0.3) },   // mid
      { depth: 5,  baseOpacity: 0.35, spread: 30, count: Math.ceil(starsTotal * 0.1) },     // near
    ]

    for (const L of layers) {
      const positions = new Float32Array(L.count * 3)
      const sizes = new Float32Array(L.count)       //自定义 per-star base size
      const twinklePhase = new Float32Array(L.count) // random phase for twinkle

      for (let i = 0; i < L.count; i++) {
        const i3 = i * 3
        positions[i3]     = (Math.random() - 0.5) * L.spread
        positions[i3 + 1] = (Math.random() - 0.5) * L.spread * 1.5
        positions[i3 + 2] = (Math.random() - 0.5) * L.spread
        sizes[i] = 0.03 + Math.random() * 0.06
        twinklePhase[i] = Math.random() * Math.PI * 2
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      geo.setAttribute('aPhase', new THREE.BufferAttribute(twinklePhase, 1))

      // Custom TSL point material: glow-reactive per-particle size + opacity
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uGlow: { value: 0 },
          uBaseOpacity: { value: L.baseOpacity },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aPhase;
          uniform float uTime;
          uniform float uGlow;
          uniform float uBaseOpacity;
          varying float vOpacity;

          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            float twinkle = 0.7 + 0.3 * sin(uTime * 1.5 + aPhase);
            float glowBoost = 1.0 + uGlow * 3.0;
            gl_PointSize = aSize * (200.0 / -mvPos.z) * twinkle * glowBoost;
            vOpacity = uBaseOpacity * twinkle * glowBoost;
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: `
          varying float vOpacity;

          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            if (d > 1.0) discard;
            float alpha = smoothstep(1.0, 0.2, d) * vOpacity;
            gl_FragColor = vec4(0.7, 0.72, 0.85, alpha);
          }
        `,
      }) as THREE.ShaderMaterial

      mat.defines = { USE_LOGDEPTH: '1' }

      const points = new THREE.Points(geo, mat)
      this.group.add(points)
      this.layers.push({ geo, points, depth: L.depth, baseOpacity: L.baseOpacity })
    }
  }

  /** Called every frame with delta time and current scroll value */
  update(deltaTime: number, scrollValue: number): void {
    // Feed scroll delta → glow
    const scrollDelta = Math.abs(scrollValue - this.lastScroll)
    this.lastScroll = scrollValue

    // React to movement
    this.glowIntensity = Math.min(1, this.glowIntensity + scrollDelta * 8)
    this.glowIntensity *= Math.exp(-this.decayRate * deltaTime)

    // Parallax: shift entire field based on scroll position
    const tScroll = Math.min(scrollValue, 1)

    for (const layer of this.layers) {
      // Parallax offset proportional to layer depth (deeper = less movement)
      const parallaxZ = tScroll * (layer.depth * 0.15)
      layer.points.position.z = -parallaxZ

      // Rotation drift
      layer.points.rotation.y += deltaTime * 0.003
      layer.points.rotation.x += deltaTime * 0.001

      // Update shader uniforms
      const mat = layer.points.material as THREE.ShaderMaterial
      mat.uniforms.uTime.value += deltaTime
      mat.uniforms.uGlow.value = this.glowIntensity
    }
  }

  /** Get the THREE.Group for scene disposal */
  get groupRef(): THREE.Group {
    return this.group
  }

  dispose(): void {
    for (const layer of this.layers) {
      layer.geo.dispose()
      const mat = layer.points.material as THREE.Material
      mat.dispose()
    }
  }
}
