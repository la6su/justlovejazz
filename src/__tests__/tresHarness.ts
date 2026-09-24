import { vi } from 'vitest'

/**
 * Shared TresCanvas test harness for the declarative lifecycle tests.
 *
 * Every `mount(TresCanvas, …)` test drives a manual-loop renderer double
 * with the same surface; this factory is the single copy of that double.
 * The returned object is intentionally loose: Tres only touches the
 * members below before the test stops the loop.
 */
export function createRendererMock() {
  const canvas = document.createElement('canvas')
  return {
    isRenderer: true,
    domElement: canvas,
    init: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    setClearColor: vi.fn(),
    dispose: vi.fn(),
    shadowMap: { enabled: false, type: 0 },
  }
}

/** jsdom lacks the pointer-capture API the Tres canvas wires up on mount. */
export function installCanvasPointerShims(): void {
  HTMLCanvasElement.prototype.setPointerCapture ??= () => undefined
  HTMLCanvasElement.prototype.releasePointerCapture ??= () => undefined
  HTMLCanvasElement.prototype.hasPointerCapture ??= () => false
}
