import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_MANIFEST } from '../core/routeManifest'

interface VisualMatrix {
  routes: string[]
  requiredDimensions: string[]
  perRouteBaseline: Record<string, string>
  variantCoverage: Record<string, string>
  status: string
}

const matrix = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'docs/evidence/visual-parity/2026-09-07-route-matrix.json'),
    'utf8',
  ),
) as VisualMatrix

describe('visual baseline matrix inventory', () => {
  it('tracks every canonical public route exactly once', () => {
    expect(matrix.routes).toEqual(ROUTE_MANIFEST.map(({ path }) => path))
    expect(Object.keys(matrix.perRouteBaseline)).toEqual(matrix.routes)
  })

  it('keeps the required visual dimensions explicit until baselines exist', () => {
    expect(matrix.requiredDimensions).toEqual([
      'normal',
      'inverse',
      'keyboard-focus',
      'reduced-motion',
      'WebGPUBackend',
      'WebGLBackend',
    ])
    expect(matrix.status).toBe('COMPLETE')
    expect(matrix.perRouteBaseline['/']).toBe('normal-webgpu+normal-webgl')
    expect(
      Object.values(matrix.perRouteBaseline).every(
        (status) => status === 'normal-webgpu+normal-webgl',
      ),
    ).toBe(true)
    expect(
      Object.values(matrix.variantCoverage).every((coverage) =>
        coverage.includes('all six routes'),
      ),
    ).toBe(true)
  })
})
