/// <reference types="vite/client" />

// Phase 5 rollback flag (Vite `VITE_` env, default off): selecting `1`
// restores the legacy DOM router in `src/router.ts` over the Vue Router
// default. The flag and the legacy router are deleted by the Phase 5
// cleanup commit.
interface ImportMetaEnv {
  readonly VITE_JLZ_LEGACY_ROUTER?: string
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
