/// <reference types="vite/client" />

// Phase 6 rollback flag (Vite `VITE_` env, default ON): the unified
// production renderer — `WebGPURenderer` is the only renderer class
// production constructs (real WebGPUBackend, automatic WebGLBackend
// fallback, or forced forceWebGL on software adapters). Setting
// `VITE_JLZ_UNIFIED_RENDERER=0` rolls back to the classic auto-switch path
// until the Phase 6 phase-exit cleanup removes both the flag and that path.
interface ImportMetaEnv {
  readonly VITE_JLZ_UNIFIED_RENDERER?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
