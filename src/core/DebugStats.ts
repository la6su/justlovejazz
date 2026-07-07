import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'

type RenderWithInfo = THREE.WebGLRenderer | WebGPURenderer

interface BrowserPerformanceMemory {
  usedJSHeapSize: number
  jsHeapSizeLimit: number
}

interface BrowserPerformanceWithMemory extends Performance {
  memory?: BrowserPerformanceMemory
}

export class DebugStats {
  private container: HTMLDivElement
  private fpsDisplay: HTMLDivElement
  private frameTimeDisplay: HTMLDivElement
  private backendDisplay: HTMLDivElement
  private memDisplay: HTMLDivElement
  private geoDisplay: HTMLDivElement
  private drawDisplay: HTMLDivElement

  private lastTime: number = 0
  private frames: number = 0
  private fps: number = 0
  private lastFrameTime: number = 0
  private smoothedFrameTime: number = 0
  private backend: string = '?'

  constructor(renderer: RenderWithInfo) {
    this.container = document.createElement('div')
    this.container.className = 'debug-stats'

    this.fpsDisplay = this.createStatLine('FPS: ')
    this.frameTimeDisplay = this.createStatLine('FT: ')
    this.backendDisplay = this.createStatLine('API: ')
    this.memDisplay = this.createStatLine('MEM: ')
    this.geoDisplay = this.createStatLine('GEO: ')
    this.drawDisplay = this.createStatLine('DRAW: ')

    this.container.appendChild(this.fpsDisplay)
    this.container.appendChild(this.frameTimeDisplay)
    this.container.appendChild(this.backendDisplay)
    this.container.appendChild(this.memDisplay)
    this.container.appendChild(this.geoDisplay)
    this.container.appendChild(this.drawDisplay)

    document.body.appendChild(this.container)
    this.renderer = renderer
  }

  private renderer: RenderWithInfo

  private createStatLine(prefix: string): HTMLDivElement {
    const div = document.createElement('div')
    div.className = 'debug-stat-line'
    div.innerText = prefix
    return div
  }

  update(time: number) {
    // Frame time (smoothed)
    if (this.lastFrameTime > 0) {
      const dt = time - this.lastFrameTime
      this.smoothedFrameTime = this.smoothedFrameTime === 0 ? dt : this.smoothedFrameTime * 0.9 + dt * 0.1
    }
    this.lastFrameTime = time

    // FPS Calculation
    this.frames++
    // Update all stats ONCE per second — updating innerText every frame
    // causes layout reflow (perf hit, especially with long stat strings).
    if (time > this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (time - this.lastTime))
      this.frames = 0
      this.lastTime = time
      this.fpsDisplay.innerText = `FPS: ${this.fps}`
      this.frameTimeDisplay.innerText = `FT: ${this.smoothedFrameTime.toFixed(1)}ms`
      // Backend + draw calls
      const isWebGPU = (this.renderer as unknown as { isWebGPURenderer?: boolean }).isWebGPURenderer
      this.backend = isWebGPU ? 'WebGPU' : 'WebGL2'
      this.backendDisplay.innerText = `API: ${this.backend}`
      const info = (this.renderer as THREE.WebGLRenderer).info
      this.drawDisplay.innerText = `DRAW: ${info.render.calls} | TRI: ${info.render.triangles}`

      // Memory (Chrome only for JS heap) — once per second
      const perf = window.performance as BrowserPerformanceWithMemory
      if (perf.memory) {
        const mem = perf.memory
        const used = Math.round(mem.usedJSHeapSize / 1048576)
        const total = Math.round(mem.jsHeapSizeLimit / 1048576)
        this.memDisplay.innerText = `MEM: ${used} / ${total} MB`
      } else {
        this.memDisplay.innerText = `MEM: N/A`
      }

      // Geometry / Texture count — once per second
      this.geoDisplay.innerText = `GEO: ${info.memory.geometries} | TEX: ${info.memory.textures}`
    }
  }

  destroy() {
    this.container.remove()
  }
}
