// WebGLText — Troika Text 3D mesh with GLSL reveal effect
// DOM element stays in layout but becomes text-color: transparent.

import * as THREE from 'three'
import { Text as TroikaTextClass } from 'troika-three-text'

// GLSL shaders (Codrops pattern — bottom-to-top reveal)

interface Props {
  element: HTMLElement
}

// Troika Text has no solid TS types for all properties — use any wrapper
interface TroikaMesh {
  text: string
  material: THREE.Material
  /** Horizontal anchor: number, percent string, or 'left' | 'center' | 'right' */
  anchorX: number | string
  /** Vertical anchor: number, percent string, or Troika keywords e.g. 'middle' */
  anchorY: number | string
  fontSize: number
  textAlign: string
  letterSpacing: number
  lineHeight: number | string
  maxWidth: number
  /** null = Troika default (Roboto/Noto pipeline), avoids broken /fonts/*.ttf URLs */
  font: string | null
  fontWeight: string | number
  fontStyle: string
  position: THREE.Vector3
  dispose(): void
  // For scene management — troika Text IS an Object3D, TS just doesn't type it
  isObject3D: true
  uuid: string
  id: number
}

export class WebGLText {
  private troika!: TroikaMesh
  private troikaThree!: THREE.Object3D // object that scene.add() accepts
  private element: HTMLElement
  private material!: THREE.MeshBasicMaterial
  private computedStyle: CSSStyleDeclaration
  private layoutX: 'left' | 'center' | 'right' = 'left'

  private isVisible = false
  private targetProgress = 0
  private currentProgress = 0

  readonly color: THREE.Color

  get elementRef(): HTMLElement {
    return this.element
  }

  constructor({ element }: Props) {
    this.element = element
    this.computedStyle = window.getComputedStyle(element)
    this.color = new THREE.Color(this.computedStyle.color)

    this.createMaterial()
    this.createMesh()
    this.setStaticValues()

    // Hide DOM text — WebGL renders the visible layer
    element.style.color = 'transparent'
  }

  private createMaterial() {
    this.material = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  }

  private createMesh() {
    const troika = new TroikaTextClass() as TroikaMesh
    this.troika = troika
    // Troika's Text is an Object3D under the hood
    this.troikaThree = troika as unknown as THREE.Object3D
  }

  /** Map CSS text-align / direction to Troika anchor + overlay X math */
  private resolveHorizontalLayout(): 'left' | 'center' | 'right' {
    const raw = (this.computedStyle.textAlign || 'start').toLowerCase()
    const rtl = this.computedStyle.direction === 'rtl'
    if (raw === 'center') return 'center'
    if (raw === 'right') return 'right'
    if (raw === 'left') return 'left'
    if (raw === 'start') return rtl ? 'right' : 'left'
    if (raw === 'end') return rtl ? 'left' : 'right'
    return 'left'
  }

  private setStaticValues() {
    const rawFs = parseFloat(this.computedStyle.fontSize)
    const fontSizeNum = Number.isFinite(rawFs) && rawFs > 0 ? rawFs : 16

    this.troika.text = this.element.innerText
    this.troika.material = this.material
    this.layoutX = this.resolveHorizontalLayout()
    this.troika.anchorX = this.layoutX
    this.troika.anchorY = 'middle'

    this.troika.fontSize = fontSizeNum

    // Troika uses em units — convert from px (computed "normal" → NaN)
    const lsPx = parseFloat(this.computedStyle.letterSpacing)
    this.troika.letterSpacing = Number.isFinite(lsPx) ? lsPx / fontSizeNum : 0

    const lhPx = parseFloat(this.computedStyle.lineHeight)
    this.troika.lineHeight =
      Number.isFinite(lhPx) && lhPx > 0 ? lhPx / fontSizeNum : 'normal'
    this.troika.textAlign = this.computedStyle.textAlign as unknown as string
    this.troika.maxWidth = this.element.getBoundingClientRect().width

    // Custom /fonts/Humane-*.ttf are not in the repo; 404 HTML was parsed as TTF → RangeError.
    // Use Troika's built-in default font. To match Humane, add files under public/fonts and set `font` URL.
    this.troika.font = null
    const fw = this.computedStyle.fontWeight
    this.troika.fontWeight =
      fw === 'normal' || fw === '400'
        ? 'normal'
        : fw === 'bold' || fw === 'bolder' || fw === '700'
          ? 'bold'
          : /^\d+$/.test(fw)
            ? fw
            : 'normal'
    this.troika.fontStyle = this.computedStyle.fontStyle === 'italic' ? 'italic' : 'normal'
  }

  /** Get the Three Object3D that can be added to overlay scene */
  getTroikaMesh(): THREE.Object3D {
    return this.troikaThree as THREE.Object3D
  }

  enterViewport() {
    this.isVisible = true
    this.targetProgress = 1
  }

  leaveViewport() {
    if (!this.isVisible) return
    this.targetProgress = 0
    setTimeout(() => {
      if (this.currentProgress < 0.02 && this.targetProgress === 0) {
        this.isVisible = false
        this.currentProgress = 0
      }
    }, 2000)
  }

  update() {
    const diff = this.targetProgress - this.currentProgress
    this.currentProgress += diff * 0.03

    if (Math.abs(diff) < 0.001) {
      this.currentProgress = this.targetProgress
    }

    this.material.opacity = this.currentProgress

    if (this.isVisible) {
      const rect = this.element.getBoundingClientRect()
      const w = window.innerWidth
      const h = window.innerHeight

      // Orthographic overlay: world (0,0) = viewport center; X/Y match pixel offsets from center.
      let worldX: number
      switch (this.layoutX) {
        case 'center':
          worldX = rect.left + rect.width * 0.5 - w * 0.5
          break
        case 'right':
          worldX = rect.right - w * 0.5
          break
        default:
          worldX = rect.left - w * 0.5
      }
      this.troika.position.x = worldX
      this.troika.position.y = -(rect.top + rect.height / 2 - h / 2)
      this.troika.position.z = 0
    }
  }

  onResize() {
    this.computedStyle = window.getComputedStyle(this.element)
    this.setStaticValues()
    // MeshBasicMaterial
  }

  waitForLoaded(): Promise<void> {
    const mesh = this.troikaThree as THREE.Object3D
    const target = mesh as unknown as EventTarget
    return new Promise((resolve) => {
      const troika = mesh as unknown as { textRenderInfo: unknown | null }
      if (troika.textRenderInfo != null) {
        resolve()
        return
      }
      const onSync = () => {
        target.removeEventListener('synccomplete', onSync)
        window.clearTimeout(timeoutId)
        resolve()
      }
      target.addEventListener('synccomplete', onSync)
      const timeoutId = window.setTimeout(() => {
        target.removeEventListener('synccomplete', onSync)
        resolve()
      }, 15000)
    })
  }

  dispose() {
    this.troika.dispose()
    this.material.dispose()
    this.element.style.color = ''
  }
}
