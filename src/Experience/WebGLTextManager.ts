// WebGLTextManager — manages the WebGL overlay renderer for Troika text.
// Creates a secondary orthographic scene on top of DOM, independent of main WebGPU.

import * as THREE from 'three'
import { WebGLText } from './WebGLText'

export class WebGLTextManager {
  private texts: WebGLText[] = []
  private overlayScene: THREE.Scene
  private overlayCamera: THREE.OrthographicCamera
  private overlayRenderer: THREE.WebGLRenderer
  private observer!: IntersectionObserver
  private resizeObserver!: ResizeObserver

  constructor(elements: HTMLElement[]) {
    // Create overlay renderer — transparent, top of DOM
    const canvas = document.createElement('canvas')
    canvas.className = 'text-overlay'
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;'
    document.body.appendChild(canvas)

    this.overlayRenderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.overlayRenderer.setClearColor(0x000000, 0)
    this.overlayRenderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
    this.overlayRenderer.setSize(window.innerWidth, window.innerHeight)

    this.overlayScene = new THREE.Scene()

    // Orthographic camera for overlay (matches screen pixels)
    const w = window.innerWidth
    const h = window.innerHeight
    this.overlayCamera = new THREE.OrthographicCamera(
      -w / 2,
      w / 2,
      h / 2,
      -h / 2,
      -1000,
      1000
    )

    // Create WebGLText for each element
    for (const element of elements) {
      const text = new WebGLText({ element })
      this.texts.push(text)
    }

    this.addEventListeners()
    // Meshes must be in the scene before the first render: Troika runs sync() from onBeforeRender.
    this.registerAllMeshes()
  }

  private addEventListeners() {
    // IntersectionObserver for visibility (bottom-to-top reveal on entry)
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const text = this.texts.find((t) => t.elementRef === entry.target)
          if (text) {
            if (entry.isIntersecting) {
              text.enterViewport()
            } else {
              text.leaveViewport()
            }
          }
        }
      },
      { threshold: 0.1 }
    )

    for (const text of this.texts) {
      this.observer.observe(text.elementRef)
    }

    // ResizeObserver for window sizing
    this.resizeObserver = new ResizeObserver(() => this.onResize())
    this.resizeObserver.observe(document.documentElement)
  }

  /** Register all Troika meshes with the overlay scene (idempotent) */
  registerAllMeshes() {
    for (const text of this.texts) {
      const mesh = text.getTroikaMesh()
      if (mesh.parent !== this.overlayScene) {
        this.overlayScene.add(mesh)
      }
    }
  }

  /** Handle window resize — update camera + all text bounds */
  private onResize() {
    const w = window.innerWidth
    const h = window.innerHeight

    this.overlayCamera.left = -w / 2
    this.overlayCamera.right = w / 2
    this.overlayCamera.top = h / 2
    this.overlayCamera.bottom = -h / 2
    this.overlayCamera.updateProjectionMatrix()

    this.overlayRenderer.setSize(w, h)
    this.overlayRenderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))

    // Update all text bounds
    for (const text of this.texts) {
      text.onResize()
    }
  }

  /** Main update loop — call every frame */
  update() {
    for (const text of this.texts) {
      text.update()
    }

    this.overlayRenderer.clear()
    this.overlayRenderer.render(this.overlayScene, this.overlayCamera)
  }

  /** Wait for all Troika meshes to finish loading */
  async waitForAllLoaded() {
    await Promise.all(this.texts.map((t) => t.waitForLoaded()))
  }

  dispose() {
    this.observer.disconnect()
    this.resizeObserver.disconnect()
    this.overlayRenderer.dispose()
    for (const text of this.texts) text.dispose()
    const canvas = this.overlayRenderer.domElement
    canvas.parentNode?.removeChild(canvas)
  }
}
