<script setup lang="ts">
// src/app/SceneHost.vue — Phase 7: the persistent Tres root.
//
// Mounted ONCE by AppShell (outside RouterView, so route navigation never
// remounts the scene root). It owns, each with exactly one owner:
//
// - the canvas (the Vue-rendered `<canvas>` inside TresCanvas — the single
//   canvas, e2e `canvas.canvas`);
// - the renderer (the custom renderer factory — the single construction
//   owner; Tres awaits its async `init()` before the ready event);
// - the camera (created here, passed to Tres and to Experience through the
//   bridge — wrapped by the `Camera` class for cinematic behavior);
// - the scene (the Tres context scene — Experience stops creating its own);
//
// and resolves the `sceneHost` bridge after renderer init + actual-backend
// inspection (software-adapter re-creation through the pure
// `planUnifiedBackend` policy). The existing World enters Tres through the
// explicit `primitive` adapter (`:dispose="null"` — Experience stays the
// single disposal owner). RenderMode is `on-demand`: Tres's internal loop is
// stopped immediately after ready and the `RenderScheduler` (ADR 0004) is the
// single loop driver. On-demand also avoids manual mode's delayed advance().
//
// Rollback: switch AppShell back to the native-world host (no SceneHost);
// Experience then creates its own scene and `Renderer.init()` constructs its
// own renderer (the retained pre-Phase-7 path).

import { markRaw, onBeforeUnmount, ref, toValue } from 'vue'
import { TresCanvas } from '@tresjs/core'
import type { TresContext, TresRendererSetupContext } from '@tresjs/core'
import { PerspectiveCamera } from 'three'
import { planUnifiedBackend } from '../core/rendererBackend'
import { DeviceCapability } from '../core/DeviceCapability'
import {
  createUnifiedWebGPUInstance,
  initUnifiedWebGPUInstance,
  inspectUnifiedBackend,
  type UnifiedRenderSurface,
} from '../core/unifiedRenderer'
import { sceneHost } from './sceneHost'

const noScene = new URLSearchParams(window.location.search).has('no-scene')
// Dev-only physical recovery seam. It preserves the shipped single-renderer
// topology (`WebGPURenderer` with its WebGLBackend), but lets the browser gate
// exercise a real WebGL context loss on hardware even when Chrome exposes
// native WebGPU. Vite folds this branch out of production builds.
const forceWebGLBackendForTest =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('force-webgl-backend')

// Tres owns the canvas size manager and reapplies its `dpr` option after
// renderer readiness. Keep that manager on the same initial cap as the
// Renderer owner; otherwise Tres can overwrite the capped buffer with the
// raw devicePixelRatio (for example 3× on a mobile browser).
const initialDprCap = DeviceCapability.getInstance().maxDpr

// Single camera owner (Phase 7). Tres registers it as the active camera and
// keeps its aspect in sync; the Experience `Camera` wrapper adopts it.
const camera = markRaw(new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000))

// Single renderer-construction owner (Phase 7): the custom renderer factory.
// Construction is synchronous (Tres awaits the instance's `init()` itself);
// the backend is inspected AFTER init in `onReady`. The unified
// `WebGPURenderer` is the only class constructed (Phase 6 production default;
// the dev-forced classic `?renderer=webgl` QA owner was removed in Phase 10).
const rendererFactory = (ctx: TresRendererSetupContext): UnifiedRenderSurface => {
  const canvas = toValue(ctx.canvas) ?? document.createElement('canvas')
  const renderer = createUnifiedWebGPUInstance(canvas, forceWebGLBackendForTest)
  // Tres may report an initialization error before `onReady`; retain the
  // created owner so that the error path can release it as well.
  createdRenderer = renderer
  return renderer
}

const tresRef = ref<{ $el: Element } | null>(null)
let resolved = false
let disposed = false
let lifecycleGeneration = 0
let liveRenderer: UnifiedRenderSurface | null = null
let createdRenderer: UnifiedRenderSurface | null = null
let unbindRendererOwner: (() => void) | null = null
let stopTresLoop: (() => void) | null = null
const disposedRenderers = new WeakSet<object>()

function disposeRendererOnce(renderer: UnifiedRenderSurface | null): void {
  if (!renderer || disposedRenderers.has(renderer)) return
  disposedRenderers.add(renderer)
  renderer.dispose()
}

async function onReady(context: TresContext): Promise<void> {
  if (noScene || resolved) return
  // Tres starts its internal RAF when the renderer becomes ready. The
  // RenderScheduler owns the actual renderer loop, so stop Tres immediately
  // (before any async backend fallback work can yield) and keep the cleanup
  // handle for an unmount during that async window.
  stopTresLoop = () => context.renderer.loop.stop()
  stopTresLoop()
  const generation = ++lifecycleGeneration
  const isCurrent = (): boolean => !disposed && generation === lifecycleGeneration
  const canvas =
    (tresRef.value?.$el as HTMLCanvasElement | undefined) ?? document.createElement('canvas')
  // The scene is the decorative visual layer over the semantic route content:
  // hidden from the accessibility tree (AGENTS.md: canvas hidden). The
<<<<<<< HEAD
// wrapper carries the same attribute; the e2e contract asserts it on the
=======
  // wrapper carries the same attribute; the e2e contract asserts it on the
>>>>>>> main
  // canvas element (TresCanvas does not forward fallthrough attributes).
  canvas.setAttribute('aria-hidden', 'true')
  let renderer = context.renderer.instance as UnifiedRenderSurface
  createdRenderer = renderer
  let backend = inspectUnifiedBackend(renderer)
  let plan = planUnifiedBackend(backend)
  if (plan.recreate) {
    // Software WebGPU adapter (SwiftShader ~2 FPS) → hardware WebGL2 through
    // the SAME class (Phase 6 policy). The canvas is already in the DOM:
    // dispose the dead instance and swap in the replacement.
    disposeRendererOnce(renderer)
    const candidate = createUnifiedWebGPUInstance(canvas, true)
    createdRenderer = candidate
    try {
      await initUnifiedWebGPUInstance(candidate)
    } catch (error) {
      disposeRendererOnce(candidate)
      if (createdRenderer === candidate) createdRenderer = null
      onError(error instanceof Error ? error : new Error(String(error)))
      return
    }
    if (!isCurrent()) {
      disposeRendererOnce(candidate)
      return
    }
    renderer = candidate
    context.renderer.instance = renderer
    backend = inspectUnifiedBackend(renderer)
    plan = planUnifiedBackend(backend)
  }
  if (!isCurrent()) {
    disposeRendererOnce(renderer)
    return
  }
  resolved = true
  liveRenderer = renderer
  unbindRendererOwner = sceneHost.bindRendererOwner((replacement) => {
    liveRenderer = replacement
  })
  sceneHost.resolve({
    scene: context.scene.value,
    context,
    renderer,
    canvas,
    camera,
    mode: plan.mode,
    backend,
  })
}

function onError(error: Error): void {
  if (resolved || disposed) return
  resolved = true
  disposeRendererOnce(createdRenderer)
  createdRenderer = null
  sceneHost.reject(error)
}

onBeforeUnmount(() => {
  disposed = true
  lifecycleGeneration += 1
  stopTresLoop?.()
  stopTresLoop = null
  unbindRendererOwner?.()
  unbindRendererOwner = null
  disposeRendererOnce(liveRenderer)
  if (createdRenderer !== liveRenderer) disposeRendererOnce(createdRenderer)
  liveRenderer = null
  createdRenderer = null
})
</script>

<template>
  <div v-if="!noScene" class="jlz-scene-host" aria-hidden="true">
    <TresCanvas
      ref="tresRef"
      class="canvas jlz-scene-canvas"
      render-mode="on-demand"
      :dpr="[1, initialDprCap]"
      :renderer="rendererFactory"
      :camera="camera"
      :style="{ pointerEvents: 'none' }"
      @ready="onReady"
      @error="onError"
    />
  </div>
</template>
