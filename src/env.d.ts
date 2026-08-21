/// <reference types="vite/client" />

// Phase 5 candidate flag (Vite `VITE_` env, default off): selects the Vue
// Router mount over the legacy DOM router.
interface ImportMetaEnv {
  readonly VITE_JLZ_VUE_ROUTER?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
