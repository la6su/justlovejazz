// src/Experience/Cursor.ts — Custom cursor with codrops-style noisy circle.
//
// Two elements (both small, follow mouse via transform):
//   1. Inner dot (6px) — follows mouse instantly, centered via translate -50%
//   2. Outer circle (canvas 100×100px) — follows with smooth lerp(0.12),
//      noisy distortion on hover, fill on hover, bump on click
//
// Features (ported from codrops demo1+demo3+demo4):
//   - Magnetic snap to element center on hover (demo4/tutorial)
//   - Noise distortion when expanded (demo4/tutorial)
//   - Fill with accent color on hover (demo4)
//   - Hide inner dot on hover (demo4)
//   - Bump on click — radius scale 0.7 → 1.0 bounce (demo1)
//
// No GSAP, no paper.js — pure Canvas 2D + custom noise2D.

import { DeviceCapability } from '../core/DeviceCapability'

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b
}

const CANVAS_SIZE = 100
const CANVAS_HALF = CANVAS_SIZE / 2

export class Cursor {
  private innerEl: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private posX = 0
  private posY = 0
  private targetX = 0
  private targetY = 0
  private innerX = 0
  private innerY = 0
  private readonly lerpFactor = 0.12

  // Noisy circle state
  private isStuck = false
  private stuckX = 0
  private stuckY = 0
  private currentRadius = 15
  private readonly baseRadius = 15
  private readonly targetRadius = 28
  private readonly segments = 8
  private readonly noiseScale = 150
  private readonly noiseRange = 3
  private frameCount = 0

  // Click bump state (demo1)
  private bumpScale = 1
  private bumpTarget = 1

  // Inner dot visibility (demo4 — hide on hover)
  private innerOpacity = 1
  private innerOpacityTarget = 1

  // Fill state (demo4 — fill circle on nav hover)
  private fillProgress = 0
  private fillTarget = 0

  private readonly mousemoveHandler: (e: MouseEvent) => void
  private readonly mouseoverHandler: (e: MouseEvent) => void
  private readonly mouseoutHandler: (e: MouseEvent) => void
  private readonly clickHandler: (e: MouseEvent) => void

  constructor() {
    this.innerEl = document.createElement('div')
    this.innerEl.classList.add('custom-cursor-inner')

    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('custom-cursor-canvas')
    this.canvas.width = CANVAS_SIZE
    this.canvas.height = CANVAS_SIZE
    this.ctx = this.canvas.getContext('2d')

    const forceCursor = (() => {
      try { return localStorage.getItem('jlz:force-cursor') === '1' } catch { return false }
    })()
    if (DeviceCapability.isMobile && !forceCursor) {
      this.innerEl.style.display = 'none'
      this.canvas.style.display = 'none'
    }
    if (forceCursor) {
      document.documentElement.classList.add('jlz-force-cursor')
    }

    document.body.appendChild(this.innerEl)
    document.body.appendChild(this.canvas)

    this.mousemoveHandler = (e: MouseEvent) => {
      this.targetX = e.clientX
      this.targetY = e.clientY
    }
    this.mouseoverHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target || typeof target.closest !== 'function') return
      const interactive = target.closest('[data-magnetic], a, button, .interactive, [uk-toggle], [uk-slider]') as HTMLElement | null
      if (interactive) {
        // For large menu items (main menu nav links), DON'T snap to center —
        // the links are huge (clamp 2-5rem), snapping to center looks weird.
        // Instead, follow mouse + expand + fill (no stuckX/Y override).
        const isLargeMenu = interactive.closest('.jlz-main-menu-nav, .jlz-secret-nav, #jlz-menu-modal')
        if (isLargeMenu) {
          this.stuckX = this.targetX
          this.stuckY = this.targetY
        } else {
          // Normal interactive: snap to element CENTER (codrops behavior)
          const rect = interactive.getBoundingClientRect()
          this.stuckX = rect.left + rect.width / 2
          this.stuckY = rect.top + rect.height / 2
        }
        this.isStuck = true
        this.fillTarget = 1
        this.innerOpacityTarget = 0
      } else {
        this.isStuck = false
        this.fillTarget = 0
        this.innerOpacityTarget = 1
      }
    }
    this.mouseoutHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target || typeof target.closest !== 'function') return
      if (target.closest('[data-magnetic], a, button, .interactive, [uk-toggle], [uk-slider]')) {
        this.isStuck = false
        this.fillTarget = 0
        this.innerOpacityTarget = 1
      }
    }
    this.clickHandler = () => {
      // Bump: radius scales down to 0.7, then bounces back to 1.0
      this.bumpScale = 0.6
      this.bumpTarget = 1
    }

    window.addEventListener('mousemove', this.mousemoveHandler, { passive: true })
    document.addEventListener('mouseover', this.mouseoverHandler, { passive: true })
    document.addEventListener('mouseout', this.mouseoutHandler, { passive: true })
    document.addEventListener('click', this.clickHandler, { passive: true })
  }

  update() {
    // Inner dot — instant follow, centered, opacity fades on hover
    this.innerX = this.targetX
    this.innerY = this.targetY
    this.innerOpacity = lerp(this.innerOpacity, this.innerOpacityTarget, 0.15)
    this.innerEl.style.opacity = String(this.innerOpacity)
    this.innerEl.style.transform = `translate(${this.innerX}px, ${this.innerY}px) translate(-50%, -50%)`

    // Outer circle — smooth lerp follow
    const goalX = this.isStuck ? this.stuckX : this.targetX
    const goalY = this.isStuck ? this.stuckY : this.targetY
    this.posX = lerp(this.posX, goalX, this.lerpFactor)
    this.posY = lerp(this.posY, goalY, this.lerpFactor)
    this.canvas.style.transform = `translate(${this.posX}px, ${this.posY}px) translate(-50%, -50%)`

    // Radius — smooth expand/shrink + click bump
    const targetR = this.isStuck ? this.targetRadius : this.baseRadius
    this.currentRadius = lerp(this.currentRadius, targetR, 0.12)
    // Bump: lerp bumpScale back to 1 after click
    this.bumpScale = lerp(this.bumpScale, this.bumpTarget, 0.2)

    // Fill progress — 0 = stroke only, 1 = filled
    this.fillProgress = lerp(this.fillProgress, this.fillTarget, 0.12)

    // Draw noisy circle
    this.drawCircle()
    this.frameCount++
  }

  private drawCircle(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const cx = CANVAS_HALF
    const cy = CANVAS_HALF
    const r = this.currentRadius * this.bumpScale

    ctx.beginPath()
    // Color: lerp from stroke (white/accent) to fill (accent)
    const strokeR = 81, strokeG = 93, strokeB = 132 // #515d84 accent
    const alpha = 0.4 + this.fillProgress * 0.4 // 0.4 → 0.8
    ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${alpha})`
    ctx.lineWidth = 1.5

    // Noisy distortion only when expanded enough
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 5
    for (let i = 0; i <= this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2
      let radius = r

      if (isNoisy) {
        const noiseX = noise2D(this.frameCount / this.noiseScale, i)
        const noiseY = noise2D(this.frameCount / this.noiseScale, i + 10)
        radius += (noiseX + noiseY) * this.noiseRange
      }

      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    // Fill: if fillProgress > 0, fill with accent color (semi-transparent)
    if (this.fillProgress > 0.01) {
      ctx.fillStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${this.fillProgress * 0.3})`
      ctx.fill()
    }
    ctx.stroke()
  }

  destroy() {
    window.removeEventListener('mousemove', this.mousemoveHandler)
    document.removeEventListener('mouseover', this.mouseoverHandler)
    document.removeEventListener('mouseout', this.mouseoutHandler)
    document.removeEventListener('click', this.clickHandler)
    this.innerEl.remove()
    this.canvas.remove()
  }
}
