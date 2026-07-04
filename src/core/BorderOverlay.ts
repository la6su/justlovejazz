// BorderOverlay.ts — CSS-based screen border for the WebGL2 fallback path.
//
// When WebGPURenderer falls back to WebGLBackend, ShaderMaterial post-processing
// is incompatible (THREE.NodeBuilder error). This CSS overlay provides the
// screen border effect without any shader — just a fixed div with box-shadow.

export class BorderOverlay {
  private el: HTMLDivElement
  private _intensity = 0

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'border-overlay'
    this.el.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:9998;' +
      'box-shadow:inset 0 0 0 0 rgba(0,0,0,0);transition:box-shadow 0.4s ease;'
    document.body.appendChild(this.el)
  }

  /** Set border intensity (0=off, 1=full black). */
  setIntensity(intensity: number): void {
    this._intensity = intensity
    if (intensity <= 0) {
      this.el.style.boxShadow = 'inset 0 0 0 0 rgba(0,0,0,0)'
      return
    }
    // Border width = 3% of viewport, alpha = intensity
    const width = '3vw'
    this.el.style.boxShadow = 'inset 0 0 0 ' + width + ' rgba(0,0,0,' + intensity + ')'
  }

  get intensity(): number {
    return this._intensity
  }

  dispose(): void {
    this.el.remove()
  }
}
