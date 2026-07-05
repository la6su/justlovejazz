// BorderOverlay.ts — CSS-based CRT-style curved screen border.
//
// Simulates the reference shader's CRT curvature border using CSS:
// - Large border-radius for rounded corners (barrel distortion approximation)
// - Thick inset box-shadow for the black frame
// - Additional radial-gradient overlay for curved edge darkening
// Used on WebGL2 fallback (ShaderMaterial post-processing path).

export class BorderOverlay {
  private el: HTMLDivElement
  private _intensity = 0

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'border-overlay'
    this.el.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:9998;' +
      'border-radius:24px;' +
      'box-shadow:inset 0 0 0 0 rgba(0,0,0,0);' +
      'transition:box-shadow 0.4s ease,border-radius 0.4s ease;'
    document.body.appendChild(this.el)
  }

  /** Set border intensity (0=off, 1=full black curved border). */
  setIntensity(intensity: number): void {
    this._intensity = intensity
    if (intensity <= 0) {
      this.el.style.boxShadow = 'inset 0 0 0 0 rgba(0,0,0,0)'
      this.el.style.borderRadius = '0'
      return
    }
    // CRT curved border: thick black frame + large border-radius for barrel effect
    // + inset spread for curved edge darkening (simulates shader CURVE)
    const borderWidth = '2.5vw'
    const spread = '1vw'
    this.el.style.borderRadius = '28px'
    this.el.style.boxShadow =
      'inset 0 0 0 ' + borderWidth + ' rgba(0,0,0,1),' +
      'inset 0 0 ' + spread + ' rgba(0,0,0,0.8)'
  }

  get intensity(): number {
    return this._intensity
  }

  dispose(): void {
    this.el.remove()
  }
}
