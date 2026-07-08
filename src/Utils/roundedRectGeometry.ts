// roundedRectGeometry.ts — PlaneGeometry with rounded corners via ShapeGeometry.
//
// Creates a 2D rounded rectangle shape and extrudes it to a flat geometry.
// UVs are generated to match the bounding box (0..1) so textures map correctly.
//
// Used by BakuCarousel for cards with rounded corners (instead of PlaneGeometry).

import * as THREE from 'three'

export function createRoundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  segments: number = 8,
): THREE.ShapeGeometry {
  const w = width
  const h = height
  const r = Math.min(radius, w / 2, h / 2)
  const shape = new THREE.Shape()

  // Start at top-left after the corner radius
  shape.moveTo(-w / 2 + r, -h / 2)

  // Bottom edge (left to right)
  shape.lineTo(w / 2 - r, -h / 2)

  // Bottom-right corner
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)

  // Right edge (bottom to top)
  shape.lineTo(w / 2, h / 2 - r)

  // Top-right corner
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)

  // Top edge (right to left)
  shape.lineTo(-w / 2 + r, h / 2)

  // Top-left corner
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)

  // Left edge (top to bottom)
  shape.lineTo(-w / 2, -h / 2 + r)

  // Bottom-left corner
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)

  const geo = new THREE.ShapeGeometry(shape, segments)

  // Generate UVs: map vertex positions (-w/2..w/2, -h/2..h/2) to (0..1, 0..1)
  const pos = geo.attributes.position!
  const uvs = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    uvs[i * 2] = (x + w / 2) / w        // U: 0..1
    uvs[i * 2 + 1] = (y + h / 2) / h    // V: 0..1
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

  return geo
}
