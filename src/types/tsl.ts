// Centralized TSL adapter types.
// three/tsl node typings are still unstable across minor releases.
// Keep untyped interop isolated here instead of spreading `any` through runtime code.
export type TSLNode = any

export interface TSLTextureNode extends TSLNode {
  sample: (uv: TSLNode) => TSLNode
  sampleLevel?: (uv: TSLNode, level: number) => TSLNode
}
