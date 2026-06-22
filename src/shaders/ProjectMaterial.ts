// src/shaders/ProjectMaterial.ts — TSL shader: chromatic aberration, bulge displacement, grid detail
import * as THREE from 'three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { uniform, vec2, vec3, float, texture, uv, mix, positionLocal } from 'three/tsl'
import type { IGalleryCardSurface } from './GalleryCardSurface'

const half = vec2(0.5, 0.5)
const zero = float(0.0)
const one = float(1.0)

export class ProjectMaterial implements IGalleryCardSurface {
    public readonly material: MeshBasicNodeMaterial
    private progressUniform = uniform(0)
    private active = false

    constructor(mainTex: THREE.Texture, detailTex: THREE.Texture, baseColor: string) {
        const parsedColor = new THREE.Color(baseColor)
        const col = vec3(parsedColor.r, parsedColor.g, parsedColor.b)
        const tex = texture(mainTex)
        const detTex = texture(detailTex)
        const p = this.progressUniform
        const uvVal = uv()

        // ── Vertex: displacement from center ──
        const dist = positionLocal.length()
        const bulge = p.mul(p).mul(one.sub(p)).mul(one.sub(dist)).mul(float(0.2))
        this.material = new MeshBasicNodeMaterial()
        ;(this.material as THREE.Material & { fog?: boolean }).fog = false
        this.material.positionNode = positionLocal.add(positionLocal.mul(bulge))

        // ── Fragment ──
        // Zoom: UV range narrows during transition
        const zoomUV = uvVal.mul(float(2.0)).sub(half).mul(mix(one, float(0.1), p)).add(half)

        // Chromatic aberration — shift along x only
        const shift = p.mul(float(0.02))
        const shiftUV = vec2(shift, zero)
        const r = tex.sample(zoomUV.add(shiftUV)).r
        const g = tex.sample(zoomUV).g
        const b = tex.sample(zoomUV.sub(shiftUV)).b
        const baseCol = vec3(r, g, b)

        // Procedural grid noise
        const grid = uvVal.mul(float(100.0)).fract().sub(half).abs()
        const gridColor = vec3(grid.x, grid.y, grid.y).mul(float(0.01))

        // Detail blend
        const detailBlend = mix(detTex.sample(uvVal), col, p.mul(float(0.2)))

        // Radial mask — distance from UV center
        const centerDist = uvVal.sub(half).length()
        const mask = one.sub(centerDist).mul(p).max(zero)

        // Final color
        this.material.colorNode = mix(baseCol.add(gridColor), detailBlend, mask)
    }

    setActive(active: boolean) {
        this.active = active
    }

    setProgress(value: number) {
        this.progressUniform.value = this.active ? value : 0
    }

    dispose() {
        this.material.dispose()
    }
}
