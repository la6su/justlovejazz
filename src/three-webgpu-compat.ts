// Compatibility entry for the current TresJS runtime.
//
// The application always supplies its own WebGPURenderer factory. TresJS 5.8
// still imports WebGLRenderer for its default renderer path and an instanceof
// guard, so keep that symbol available without retaining Three's classic
// renderer module in the production graph.
export * from 'three/webgpu'

/** Unreachable when SceneHost supplies its renderer factory. */
export class WebGLRenderer {
  constructor() {
    throw new Error('The classic WebGLRenderer path is not supported')
  }
}
