// src/app/sceneHost.ts — Phase 7: the persistent SceneHost bridge.
//
// `SceneHost.vue` (the persistent Tres root mounted by AppShell) creates the
// one canvas, the one renderer (through the custom renderer factory) and the
// one camera, mounts the Tres context, and resolves this bridge ONCE — after
// renderer initialization and actual-backend inspection. `entry-app.ts`
// awaits the bridge before constructing `Experience`, and `Experience`
// adopts the scene, camera and renderer instances (the readiness handshake:
// `jlz:webgl-ready` can only fire after this resolves AND the initial
// scene's first successful render — the factory return alone never satisfies
// readiness).
//
// Phase 8 slice 10 removed the legacy `worldObject` primitive slot: the
// SceneCoordinator adds its sections + scene owners to the Tres-owned scene
// directly, so no explicit `<primitive>` adapter remains.

import type * as THREE from 'three'
import type { TresContext } from '@tresjs/core'
import type { BackendFacts, FinalMode } from '../core/rendererBackend'
import type { UnifiedRenderSurface } from '../core/unifiedRenderer'

/** The readiness state published once the persistent Tres root is live. */
export interface SceneHostReady {
  /** The Tres-owned scene (`context.scene.value`) — the one THREE.Scene. */
  scene: THREE.Scene
  /** The mounted Tres context (loop/size/camera managers). */
  context: TresContext
  /** The actual renderer instance after init + backend inspection. */
  renderer: UnifiedRenderSurface
  /** The persistent canvas element (Vue-owned DOM, e2e `canvas.canvas`). */
  canvas: HTMLCanvasElement
  /** The one camera instance (owned by SceneHost, wrapped by Experience). */
  camera: THREE.PerspectiveCamera
  /** Final backend mode after the software-adapter policy decision. */
  mode: FinalMode
  /** Actual backend facts after init (backend parity evidence). */
  backend: BackendFacts
}

interface SceneHostState {
  settled: boolean
  resolve?: (value: SceneHostReady) => void
  reject?: (error: unknown) => void
  context: TresContext | null
  rendererOwner?: (renderer: UnifiedRenderSurface) => void
}

const state: SceneHostState = { settled: false, context: null }

/**
 * The one-shot scene-host signal. Production code must never create a second
 * Tres root (AGENTS.md: exactly one canvas, renderer and loop owner during
 * migration); the bridge is module-scoped to enforce that.
 */
export const sceneHost = {
  ready: new Promise<SceneHostReady>((resolve, reject) => {
    state.resolve = resolve
    state.reject = reject
  }),
  get isSettled(): boolean {
    return state.settled
  },
  resolve(value: SceneHostReady): void {
    if (state.settled) return
    state.settled = true
    state.context = value.context
    state.resolve?.(value)
  },
  reject(error: unknown): void {
    if (state.settled) return
    state.settled = true
    state.reject?.(error)
  },
  /**
   * Swap the live renderer after a device-loss recovery (or a software
   * adapter re-creation outside SceneHost). Tres 5.8.3 keeps the renderer as
   * a plain value on the manager, so the swap is a plain assignment; the
   * RenderScheduler keeps driving the replacement through the Renderer
   * owner boundary.
   */
  replaceRenderer(renderer: UnifiedRenderSurface): void {
    if (state.context) state.context.renderer.instance = renderer
    state.rendererOwner?.(renderer)
  },
  /**
   * Register the Vue host's live-renderer slot. Renderer recovery happens
   * behind the Experience owner boundary, so the host must follow the
   * replacement before a later Vue unmount disposes its resources.
   */
  bindRendererOwner(owner: (renderer: UnifiedRenderSurface) => void): () => void {
    state.rendererOwner = owner
    return () => {
      if (state.rendererOwner === owner) state.rendererOwner = undefined
    }
  },
}

/**
 * Test-only: restore the pristine one-shot state so a fresh module-scoped
 * bridge can be exercised again (the production bridge settles exactly once
 * per page).
 */
export function __resetSceneHostForTests(): void {
  state.settled = false
  state.context = null
  state.resolve = undefined
  state.reject = undefined
  state.rendererOwner = undefined
  // A new one-shot promise with fresh settle hooks.
  ;(
    sceneHost as {
      ready: Promise<SceneHostReady>
    }
  ).ready = new Promise<SceneHostReady>((resolve, reject) => {
    state.resolve = resolve
    state.reject = reject
  })
}
