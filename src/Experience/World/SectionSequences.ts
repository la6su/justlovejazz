// src/Experience/World/SectionSequences.ts
// 2015 portfolio port — 14 sections → 8 cinematic steps
// Low-light mood: dark backgrounds, muted materials, atmospheric

import * as THREE from 'three'

const ASSETS = '/assets/references'
const textureCache = new Map<string, THREE.Texture>()

function loadTx(path: string): THREE.Texture {
  const full = `${ASSETS}${path}`
  if (!textureCache.has(full)) {
    const tex = new THREE.TextureLoader().load(full)
    tex.needsUpdate = true
    textureCache.set(full, tex)
  }
  return textureCache.get(full)!
}

const R = (min: number, max: number) => min + Math.random() * (max - min)

function smokePlanes(data: Array<{x:number;y:number;z:number;rz:number;s:number;front:boolean}>): THREE.Group {
  const g = new THREE.Group()
  const tex = loadTx('/sprite-smoke.png')
  for (const d of data) {
    const m = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.15, depthWrite: false,
      depthTest: true, blending: d.front ? THREE.NormalBlending : THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), m)
    p.position.set(d.x, d.y, d.z)
    p.rotation.z = d.rz
    p.scale.setScalar(d.s)
    p.userData.type = 'smoke-plane'
    p.userData.smokeBase = p.position.clone()
    p.userData.smokeSpeed = R(0.2, 0.8)
    g.add(p)
  }
  g.userData.type = 'smoke-system'
  return g
}

function ball(pos: [number,number,number], sc = 1, col = 0xffffff): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({
    map: loadTx('/texture-ball.png'), color: col, roughness: 0.4, metalness: 0.1,
    emissive: 0x020202, transparent: true,
  })
  const sp = new THREE.Mesh(new THREE.SphereGeometry(sc, 32, 32), m)
  sp.position.set(...pos)
  g.add(sp)
  g.userData.type = 'ball'
  return g
}

function stars(cx: number, cy: number, cz: number, count: number): THREE.Group {
  const g = new THREE.Group()
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i*3] = R(cx - 30, cx + 30)
    positions[i*3+1] = R(cy - 40, cy + 40)
    positions[i*3+2] = R(cz - 30, cz + 30)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    size: R(0.03, 0.08), color: 0x555566,
    transparent: true, opacity: 0.25, depthWrite: false, sizeAttenuation: true,
  })
  g.add(new THREE.Points(geo, mat))
  g.userData.type = 'stars'
  return g
}

function bgLines(count: number): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < count; i++) {
    const pts = [new THREE.Vector3(0, -20, 0), new THREE.Vector3(0, 20, 0)]
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x555566, transparent: true, opacity: R(0.02, 0.04),
    }))
    l.position.set(R(-25, 25), 0, R(-20, 20))
    g.add(l)
  }
  g.userData.type = 'bg-lines'
  return g
}

function beams(): THREE.Group {
  const g = new THREE.Group()
  const tex = loadTx('/part-beam.png')
  const data = [
    {p:[0.2,10.8,-7.8],r:[0.38,-0.5,0.5],s:[1,1,8]},
    {p:[-9.4,6.1,1.2],r:[0.37,0.5,0.49],s:[1,1,6]},
    {p:[10.9,5.1,1.1],r:[0.41,0.5,-0.5],s:[1,1,3]},
    {p:[0.1,9.6,0.9],r:[0.1,-0.5,0.05],s:[0.8,0.8,8]},
    {p:[1.6,4.6,6],r:[0.39,-0.5,0.5],s:[0.4,0.4,5]},
  ] as {p:[number,number,number];r:[number,number,number];s:[number,number,number]}[]
  for (const d of data) {
    const m = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.2,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), m)
    b.position.set(...d.p)
    b.rotation.set(...d.r)
    b.scale.set(...d.s)
    b.userData.type = 'beam'
    g.add(b)
  }
  g.userData.type = 'beam-group'
  return g
}

function gridLines(): THREE.Group {
  const g = new THREE.Group()
  const tex = loadTx('/part-grid.png')
  const data = [
    {p:[-4.5,10.9,2.8],r:[0.9,-0.5,0.1],s:[12,10,1]},
    {p:[0.4,6.8,5.5],r:[-0.9,0,0.5],s:[9,7,1]},
  ] as {p:[number,number,number];r:[number,number,number];s:[number,number,number]}[]
  for (const d of data) {
    const m = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1,1), m)
    pl.position.set(...d.p)
    pl.rotation.set(...d.r)
    pl.scale.set(...d.s)
    g.add(pl)
  }
  g.userData.type = 'grid'
  return g
}

function gravityGrid(): THREE.Group {
  const g = new THREE.Group()
  const levels = 3
  const rows = 15, cols = 25
  const cellW = 1.0, cellH = 0.7
  for (let l = 0; l < levels; l++) {
    const sub = new THREE.Group()
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const sq = new THREE.Mesh(
          new THREE.PlaneGeometry(cellW, cellH),
          new THREE.MeshBasicMaterial({
            transparent: true, opacity: 0.1, depthWrite: false,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          })
        )
        sq.position.set(x * cellW - (cols * cellW)/2, -y * cellH, R(-0.3, 0.3))
        sub.add(sq)
      }
    }
    sub.position.z = -l * 2
    g.add(sub)
  }
  g.userData.type = 'gravity-grid'
  return g
}

function neons(): THREE.Group {
  const g = new THREE.Group()
  const neonTex = loadTx('/texture-neonGlow.png')
  const columns = [
    {p:[0,0,0],h:7},{p:[6,0,2],h:5},
    {p:[-5,0,3],h:6},{p:[2.5,0,4],h:8},
    {p:[-3,0,5],h:4},
  ] as {p:[number,number,number];h:number}[]
  for (const c of columns) {
    const m = new THREE.MeshStandardMaterial({
      map: neonTex, emissive: new THREE.Color(0.1,0.05,0.08),
      emissiveIntensity: 0.4, transparent: true, opacity: 0.7,
      color: 0x221122, roughness: 0.3, metalness: 0.9,
    })
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,c.h,8), m)
    n.position.set(c.p[0], c.h/2, c.p[2])
    n.userData.type = 'neon-column'
    g.add(n)
  }
  const prj = new THREE.Mesh(
    new THREE.CircleGeometry(4, 32),
    new THREE.MeshBasicMaterial({
      map: loadTx('/texture-neonProjection.png'), transparent: true, opacity: 0.25,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  )
  prj.rotation.x = -Math.PI/2
  prj.position.y = 0.05
  g.add(prj)
  g.userData.type = 'neons'
  return g
}

function galaxy(): THREE.Group {
  const g = new THREE.Group()
  const coreTex = loadTx('/part-galaxy.jpg')
  const cores: Array<{p:[number,number,number];sz:number}> = [
    {p:[0,0,0],sz:5}, {p:[-3,0,-1],sz:2.5}, {p:[2,0,-2],sz:3}
  ]
  for (const c of cores) {
    const sm = new THREE.SpriteMaterial({
      map: coreTex, color: 0x224466, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending,
    })
    const sp = new THREE.Sprite(sm)
    sp.position.set(...c.p)
    sp.scale.setScalar(c.sz)
    g.add(sp)
  }
  const arms = 4
  for (let a = 0; a < arms; a++) {
    const pts: THREE.Vector3[] = []
    const armStart = (a / arms) * Math.PI * 2
    for (let i = 0; i < 100; i++) {
      const t = i / 100
      const angle = armStart + t * Math.PI * 2.5
      const r = t * 30
      pts.push(new THREE.Vector3(
        Math.cos(angle) * r + R(-1,1),
        Math.sin(angle) * r + R(-1,1),
        R(-0.5, 0.5)
      ))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.PointsMaterial({
      size: 0.1, color: 0x336699, transparent: true, opacity: 0.35,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })
    g.add(new THREE.Points(geo, mat))
  }
  g.userData.type = 'galaxy'
  return g
}

function flowField(): THREE.Group {
  const g = new THREE.Group()
  const gs = 10, cell = 100 / gs
  for (let x = 0; x < gs; x++) {
    for (let y = 0; y < gs; y++) {
      const h = R(0.01, 0.15)
      if (h <= 0.03) continue
      const m = new THREE.MeshBasicMaterial({
        transparent: true, opacity: Math.min(h * 3, 0.4),
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      })
      const ring = new THREE.Mesh(new THREE.RingGeometry(R(0.3,1), R(20,50), 3), m)
      ring.position.set(x * cell - (gs*cell)/2, -y * cell + (gs*cell)/2, R(-15, 5))
      // Dont scale — let ring geometry size matter
      g.add(ring)
    }
  }
  g.userData.type = 'flow-field'
  return g
}

function heightmap(): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.MeshStandardMaterial({
    map: loadTx('/part-height.png'),
    metalness: 0.3, roughness: 0.6,
    transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    emissive: 0x050505,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 20, 128, 128), m)
  g.add(mesh)
  g.userData.type = 'heightmap'
  return g
}

function wave(): THREE.Group {
  const g = new THREE.Group()
  const seg = 80
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < seg; i++) {
    pts.push(new THREE.Vector3(i * 0.4 - (seg*0.4)/2, 0, 0))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 180, 0.01, 8, false),
    new THREE.MeshBasicMaterial({
      map: loadTx('/texture-wave.png'), transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending,
    })
  )
  g.add(tube)
  g.userData.type = 'wave'
  return g
}

function textPanel(text: string, pos: [number,number,number]): THREE.Group {
  const g = new THREE.Group()
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#6a6560'
  ctx.font = 'bold 40px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 64)
  const cTex = new THREE.CanvasTexture(canvas)
  const m = new THREE.MeshBasicMaterial({
    map: cTex, transparent: true, opacity: 0.4,
    side: THREE.DoubleSide, blending: THREE.NormalBlending, depthWrite: false,
  })
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.8), m)
  pl.position.set(...pos)
  g.add(pl)
  g.userData.type = 'text-panel'
  return g
}

function rocks(): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 60; i++) {
    const m = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a, transparent: true, opacity: 0.3, emissive: 0x030303,
    })
    const r = new THREE.Mesh(new THREE.CircleGeometry(0.04, 3), m)
    r.position.set(R(-15,15), R(-10,10), R(-20,20))
    g.add(r)
  }
  g.userData.type = 'rocks'
  return g
}

function city(): THREE.Group {
  const g = new THREE.Group()
  // Tall buildings from beam geometry
  const tex = loadTx('/part-beam.png')
  const bldgData = [
    {p:[0,8,-5],s:[0.3,16,0.3]}, {p:[5,10,-3],s:[0.4,20,0.4]},
    {p:[-4,6,-7],s:[0.2,12,0.2]}, {p:[8,12,0],s:[0.5,24,0.5]},
    {p:[-7,9,-2],s:[0.3,18,0.3]}, {p:[2,7,-8],s:[0.2,14,0.2]},
    {p:[-1,11,2],s:[0.4,22,0.4]}, {p:[10,5,-6],s:[0.2,10,0.2]},
  ] as {p:[number,number,number];s:[number,number,number]}[]
  for (const d of bldgData) {
    const m = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
    const b = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), m)
    b.position.set(...d.p)
    b.scale.set(...d.s)
    b.userData.type = 'building'
    g.add(b)
  }
  g.userData.type = 'city'
  return g
}

function dropParticles(): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 30; i++) {
    const m = new THREE.MeshStandardMaterial({
      map: loadTx('/part-drop.png'), color: 0x445566,
      transparent: true, opacity: 0.2, emissive: 0x020202,
    })
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), m)
    d.position.set(R(-10,10), R(-5,15), R(-10,10))
    d.userData.type = 'drop'
    g.add(d)
  }
  g.userData.type = 'drop-group'
  return g
}

function faceSprite(pos: [number,number,number], scale: number): THREE.Group {
  const g = new THREE.Group()
  const tex = loadTx('/part-face.png')
  const sm = new THREE.SpriteMaterial({
    map: tex, color: 0x555555, transparent: true, opacity: 0.25,
    blending: THREE.NormalBlending,
  })
  const sp = new THREE.Sprite(sm)
  sp.position.set(...pos)
  sp.scale.setScalar(scale)
  g.add(sp)
  g.userData.type = 'face'
  return g
}

function strips(): THREE.Group {
  const g = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const m = new THREE.MeshBasicMaterial({
      transparent: true, opacity: R(0.08, 0.15),
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const s = new THREE.Mesh(new THREE.PlaneGeometry(R(0.5,1.2), R(3,8)), m)
    s.position.set(R(-10,10), R(-5,5), R(-15,-5))
    s.rotation.z = R(-0.4, 0.4)
    s.userData.type = 'strip'
    g.add(s)
  }
  g.userData.type = 'strips'
  return g
}

function step01_hello(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step01-hello'
  s.add(stars(0, 0, 0, 40))
  const smoke = smokePlanes([
    {x:10.7,y:3.9,z:17.8,rz:2.7,s:3.9,front:true},
    {x:24.5,y:-10.3,z:7.5,rz:5.5,s:5.0,front:true},
    {x:-2.8,y:2.6,z:-8,rz:0.7,s:7.7,front:true},
    {x:-19,y:6,z:-11,rz:6,s:5,front:false},
    {x:13,y:19.5,z:-1.3,rz:2,s:2.7,front:false},
    {x:16.3,y:9,z:10.4,rz:2.1,s:2.4,front:true},
    {x:-26.7,y:8,z:6,rz:1.4,s:6,front:true},
    {x:6.8,y:-8,z:-11,rz:3.8,s:7.7,front:false},
    {x:13.3,y:-4,z:-17.4,rz:5.3,s:3.7,front:false},
  ])
  s.add(smoke)
  s.add(bgLines(5))
  return [s]
}

function step02_ball(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step02-ball'
  s.add(stars(0, 0, 0, 45))
  const b = ball([0.25, 2, 1.35], 1.2, 0x4a3529)
  s.add(b)
  s.add(beams())
  s.add(gridLines())
  s.add(bgLines(8))
  return [s]
}

function step03_beams(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step03-beams'
  s.add(stars(0, 0, 0, 35))
  // Multiple beam groups at different angles
  const bg1 = beams()
  s.add(bg1)
  const bg2 = beams()
  bg2.position.set(5, -3, -5)
  bg2.rotation.y = 0.5
  s.add(bg2)
  s.add(strips())
  s.add(bgLines(6))
  return [s]
}

function step04_city(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step04-city'
  s.add(stars(0, 0, 0, 50))
  s.add(city())
  s.add(strips())
  s.add(rocks())
  s.add(bgLines(10))
  return [s]
}

function step05_neons(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step05-neons'
  s.add(stars(0, 0, 0, 50))
  s.add(neons())
  const gg = gravityGrid()
  gg.position.y = -3
  s.add(gg)
  s.add(rocks())
  s.add(bgLines(10))
  return [s]
}

function step06_flow(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step06-flow'
  s.add(stars(0, 0, 0, 30))
  const ff = flowField()
  ff.position.set(-1.5, 12, -8)
  s.add(ff)
  s.add(beams())
  s.add(bgLines(7))
  return [s]
}

function step07_drop(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step07-drop'
  s.add(stars(0, 0, 0, 35))
  s.add(dropParticles())
  const h = heightmap()
  h.position.set(0, -10, -20)
  h.rotation.x = -0.3
  s.add(h)
  s.add(wave())
  s.add(bgLines(5))
  return [s]
}

function step08_galaxy(): THREE.Object3D[] {
  const s = new THREE.Group()
  s.name = 'step08-galaxy'
  s.add(stars(0, 0, 0, 35))
  const b = ball([7, 6.2, 0], 1.5, 0x444455)
  s.add(b)
  s.add(galaxy())
  s.add(faceSprite([0, 0, 5], 3))
  s.add(textPanel("What is the next idea", [0, 15, -10]))
  s.add(textPanel("that you think about", [0, -8, 10]))
  s.add(bgLines(4))
  return [s]
}

// ── PAGE WORLD RECORDS ──

export type WorldCreator = () => THREE.Object3D[]

export const homeWorlds: Record<string, WorldCreator> = {
  step01: step01_hello,
  step02: step02_ball,
  step03: step03_beams,
  step04: step04_city,
  step05: step05_neons,
  step06: step06_flow,
  step07: step07_drop,
  step08: step08_galaxy,
  // Aliases for backward compat
  awakening: step01_hello,
  discovery: step02_ball,
  deep_dive: step05_neons,
  connection: step08_galaxy,
}

export const trinityWorlds = homeWorlds
export const worksWorlds = homeWorlds
export const contactWorlds = homeWorlds

export function getWorldCreators(pageName: string): Record<string, WorldCreator> {
  switch (pageName) {
    case 'trinity': return trinityWorlds
    case 'works': return worksWorlds
    case 'contact': return contactWorlds
    default: return homeWorlds
  }
}