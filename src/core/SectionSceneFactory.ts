// SectionSceneFactory — Built-in materials only (no ShaderMaterial, no TSL).
import * as THREE from 'three'

function makeGradientBG(top: number, bottom: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(50, 32, 32)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c1 = new THREE.Color(top), c2 = new THREE.Color(bottom), tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    tmp.lerpColors(c2, c1, pos.getY(i) / 50 * 0.5 + 0.5)
    colors[i*3] = tmp.r; colors[i*3+1] = tmp.g; colors[i*3+2] = tmp.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false }))
}

function makeGrid(c: number, op: number, y: number): THREE.GridHelper {
  const g = new THREE.GridHelper(40, 40, c, c)
  ;(g.material as THREE.Material).transparent = true; (g.material as THREE.Material).opacity = op
  ;(g as THREE.Object3D).position.y = y; return g
}

function makeParticles(n: number, r: THREE.Vector3, c: number, s: number, o: number): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const p = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { p[i*3] = (Math.random()-0.5)*r.x; p[i*3+1] = (Math.random()-0.5)*r.y; p[i*3+2] = (Math.random()-0.5)*r.z }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: c, size: s, transparent: true, opacity: o, sizeAttenuation: true, depthWrite: false }))
  pts.frustumCulled = false; return pts
}

export class SectionSceneFactory {
  static createStep01(): THREE.Group {
    const g = new THREE.Group(); g.name = 'step01-scene'
    g.add(makeGradientBG(0x0a0a14, 0x050507))
    g.add(makeGrid(0x2a3a5a, 0.15, -2))
    const shapes = [
      { geo: new THREE.BoxGeometry(0.4,0.4,0.4), pos: [2,1,-1] as [number,number,number] },
      { geo: new THREE.TorusGeometry(0.3,0.08,12,32), pos: [-2,-0.5,-1.5] as [number,number,number] },
      { geo: new THREE.CylinderGeometry(0.15,0.15,0.6,16), pos: [-1.5,1.2,-2] as [number,number,number] },
    ]
    for (const s of shapes) {
      const m = new THREE.Mesh(s.geo, new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.2, metalness: 0.7, transparent: true, opacity: 0.3 }))
      m.position.set(...s.pos); g.add(m)
    }
    g.add(makeParticles(80, new THREE.Vector3(12,6,6), 0x4a6fa5, 0.04, 0.4))
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3,4), new THREE.MeshBasicMaterial({ color: 0x3a5a8a, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }))
      m.position.set((i-2.5)*1.5, 0.5, -3); m.rotation.z = 0.3; g.add(m)
    }
    return g
  }
  static createStep02(): THREE.Group {
    const g = new THREE.Group(); g.name = 'step02-scene'
    const dGeo = new THREE.SphereGeometry(0.03, 8, 8), dMat = new THREE.MeshBasicMaterial({ color: 0x4a7ab5, transparent: true, opacity: 0.5 })
    for (let i = 0; i < 32; i++) { const a = (i/32)*Math.PI*2; const d = new THREE.Mesh(dGeo, dMat); d.position.set(Math.cos(a)*3, Math.sin(a)*0.9, 0); g.add(d) }
    g.add(makeGrid(0x2a3a5a, 0.1, -2))
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.5,24,24), new THREE.MeshBasicMaterial({ color: 0x5a8ac5, transparent: true, opacity: 0.4 })))
    g.add(makeParticles(40, new THREE.Vector3(8,4,4), 0x3a5a8a, 0.03, 0.3))
    return g
  }
  static createStep03(): THREE.Group { const g = new THREE.Group(); g.name = 'step03-scene'; return g }
  static createStep04(): THREE.Group { const g = new THREE.Group(); g.name = 'step04-scene'; return g }
  static createStep05(): THREE.Group {
    const g = new THREE.Group(); g.name = 'step05-scene'
    g.add(makeGradientBG(0x0a0a14, 0x05050a))
    const sGeo = new THREE.PlaneGeometry(0.06, 6)
    for (let i = 0; i < 7; i++) { const x = (i-3)*1.5; const c = new THREE.Color().setHSL(0.58+(i-3.5)*0.015, 0.4, 0.5); const s = new THREE.Mesh(sGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); s.position.set(x, 0.5, -1.5); s.name = `step05-strip-${i}`; g.add(s) }
    g.add(makeGrid(0x2a3a5a, 0.1, -2.5))
    g.add(makeParticles(60, new THREE.Vector3(14,6,5), 0x3a5a7a, 0.035, 0.3))
    return g
  }
  static createStep06(): THREE.Group {
    const g = new THREE.Group(); g.name = 'step06-scene'
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.2,64,64), new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.02, metalness: 1 })))
    for (let i = 0; i < 10; i++) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3,0,-i*2), new THREE.Vector3(3,0,-i*2)]); g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x1a2a4a, transparent: true, opacity: 0.2*(1-i/10) }))) }
    g.add(makeGrid(0x2a3a5a, 0.08, -1.8))
    g.add(makeGradientBG(0x080810, 0x030305))
    g.add(makeParticles(30, new THREE.Vector3(10,5,4), 0x2a3a5a, 0.025, 0.25))
    return g
  }
  static byIndex(i: number): THREE.Group {
    return [this.createStep01, this.createStep02, this.createStep03, this.createStep04, this.createStep05, this.createStep06][i]?.() ?? this.createStep06()
  }
}
