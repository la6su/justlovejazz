/// <reference types="vite/client" />

// Phase 6 candidate flag (Vite `VITE_` env, default off): `1` selects the
// unified production renderer — `WebGPURenderer` is the only renderer class
// (real WebGPUBackend, automatic WebGLBackend fallback, or forced
// forceWebGL on software adapters). The classic `WebGLRenderer` path
// (production SwiftShader/fallback switch) remains until the Phase 6
// cleanup commit.
interface ImportMetaEnv {
  readonly VITE_JLZ_UNIFIED_RENDERER?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
