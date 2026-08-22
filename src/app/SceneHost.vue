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
// single disposal owner). RenderMode is `manual`: Tres's internal loop is
// stopped and the `RenderScheduler` (ADR 0004) is the single loop driver.
//
// Rollback: switch AppShell back to the native-world host (no SceneHost);
// Experience then creates its own scene and `Renderer.init()` constructs its
// own renderer (the retained pre-Phase-7 path).

import { markRaw, ref, toValue } from 'vue'
import { TresCanvas } from '@tresjs/core'
import type { TresContext, TresRendererSetupContext } from '@tresjs/core'
import { PerspectiveCamera } from 'three'
import { planUnifiedBackend } from '../core/rendererBackend'
import {
  createUnifiedWebGPUInstance,
  initUnifiedWebGPUInstance,
  inspectUnifiedBackend,
  type UnifiedRenderSurface,
} from '../core/unifiedRenderer'
import { sceneHost } from './sceneHost'

const noScene = new URLSearchParams(window.location.search).has('no-scene')

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
  return createUnifiedWebGPUInstance(canvas, false)
}

const tresRef = ref<{ $el: Element } | null>(null)
let resolved = false

async function onReady(context: TresContext): Promise<void> {
  if (noScene || resolved) return
  const canvas =
    (tresRef.value?.$el as HTMLCanvasElement | undefined) ?? document.createElement('canvas')
  // The scene is the decorative visual layer over the semantic route content:
  // hidden from the accessibility tree (AGENTS.md: canvas hidden). The
  // wrapper carries the same attribute; the e2e contract asserts it on the
  // canvas element (TresCanvas does not forward fallthrough attributes).
  canvas.setAttribute('aria-hidden', 'true')
  let renderer = context.renderer.instance as UnifiedRenderSurface
  let backend = inspectUnifiedBackend(renderer)
  let plan = planUnifiedBackend(backend)
  if (plan.recreate) {
    // Software WebGPU adapter (SwiftShader ~2 FPS) → hardware WebGL2 through
    // the SAME class (Phase 6 policy). The canvas is already in the DOM:
    // dispose the dead instance and swap in the replacement.
    renderer.dispose()
    renderer = createUnifiedWebGPUInstance(canvas, true)
    await initUnifiedWebGPUInstance(renderer)
    context.renderer.instance = renderer
    backend = inspectUnifiedBackend(renderer)
    plan = planUnifiedBackend(backend)
  }
  resolved = true
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
  if (resolved) return
  resolved = true
  sceneHost.reject(error)
}
</script>

<template>
  <div v-if="!noScene" class="jlz-scene-host" aria-hidden="true">
    <TresCanvas
      ref="tresRef"
      class="canvas jlz-scene-canvas"
      render-mode="manual"
      :renderer="rendererFactory"
      :camera="camera"
      :style="{ pointerEvents: 'none' }"
      @ready="onReady"
      @error="onError"
    />
  </div>
</template>
