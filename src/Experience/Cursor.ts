// src/Experience/Cursor.ts — Custom cursor with codrops-style noisy circle.
//
// Two elements (both small, follow mouse via transform):
//   1. Inner dot (6px) — follows mouse instantly
//   2. Outer circle (canvas 100×100px) — follows with lerp(0.2), noisy distortion
//
// Inspired by skaltenegger/customcursor (codrops tutorial), reimplemented
// without paper.js — pure Canvas 2D + custom simplex noise. The noisy
// circle expands + distorts when hovering interactive elements (a, button,
// [data-magnetic]).
//
// Design decisions:
//   - Canvas is SMALL (100×100px), not full-screen. Transform follows mouse.
//     This avoids the 100vw×100vh canvas redraw every frame (perf win) and
//     prevents z-index/stacking conflicts with modals/overlays.
//   - NO mix-blend-mode: difference. It breaks inside stacking contexts
//     (modals with backdrop-filter create new contexts, cursor becomes
//     invisible or wrong color). Use solid accent color instead.
//   - Both elements: pointer-events: none, z-index: 100000 (same — they
//     don't overlap each other, canvas is bigger but transparent).
//   - cursor: none on body/a/button only when (hover: hover) AND
//     (pointer: fine) — touch devices keep system cursor.
//
// Mobile: hidden (display:none) — touch devices don't need a custom cursor.

import { DeviceCapability } from '../core/DeviceCapability'

// Simplex noise (simplified 2D) — no external dependency.
// Returns value in [-1, 1]. Good enough for cursor distortion.
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b
}

const CANVAS_SIZE = 100 // px — small canvas, follows mouse via transform
const CANVAS_HALF = CANVAS_SIZE / 2

export class Cursor {
  private innerEl: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private posX = -100
  private posY = -100
  private targetX = -100
  private targetY = -100
  private innerX = -100
  private innerY = -100
  private readonly lerpFactor = 0.2

  // Noisy circle state
  private isStuck = false
  private stuckX = 0
  private stuckY = 0
  private currentRadius = 15
  private readonly baseRadius = 15
  private readonly targetRadius = 30 // expanded on hover
  private readonly segments = 8
  private readonly noiseScale = 150 // speed
  private readonly noiseRange = 4 // distortion range
  private frameCount = 0

  private readonly mousemoveHandler: (e: MouseEvent) => void
  private readonly mouseoverHandler: (e: MouseEvent) => void
  private readonly mouseoutHandler: (e: MouseEvent) => void
  private readonly resizeHandler: () => void

  constructor() {
    // Inner dot (follows mouse instantly)
    this.innerEl = document.createElement('div')
    this.innerEl.classList.add('custom-cursor-inner')

    // Outer canvas (noisy circle, small — follows with lerp)
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('custom-cursor-canvas')
    this.canvas.width = CANVAS_SIZE
    this.canvas.height = CANVAS_SIZE
    this.ctx = this.canvas.getContext('2d')

    // Hide on mobile/touch
    if (DeviceCapability.isMobile) {
      this.innerEl.style.display = 'none'
      this.canvas.style.display = 'none'
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
      const magnetic = target.closest('[data-magnetic]')
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect()
        this.stuckX = rect.left + rect.width / 2
        this.stuckY = rect.top + rect.height / 2
        this.isStuck = true
      } else if (target.closest('a, button, .interactive, [uk-toggle], [uk-slider]')) {
        this.isStuck = true
        this.stuckX = this.targetX
        this.stuckY = this.targetY
      } else {
        this.isStuck = false
      }
    }
    this.mouseoutHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target || typeof target.closest !== 'function') return
      if (target.closest('[data-magnetic], a, button, .interactive')) {
        this.isStuck = false
      }
    }
    this.resizeHandler = () => {
      // Canvas size is fixed (CANVAS_SIZE), no resize needed.
      // Kept for future extensibility.
    }

    window.addEventListener('mousemove', this.mousemoveHandler, { passive: true })
    window.addEventListener('resize', this.resizeHandler, { passive: true })
    document.addEventListener('mouseover', this.mouseoverHandler, { passive: true })
    document.addEventListener('mouseout', this.mouseoutHandler, { passive: true })
  }

  update() {
    // Inner dot — instant follow
    this.innerX = this.targetX
    this.innerY = this.targetY
    this.innerEl.style.transform = `translate(${this.innerX}px, ${this.innerY}px)`

    // Outer circle — lerp follow
    if (this.isStuck) {
      this.posX = lerp(this.posX, this.stuckX, this.lerpFactor)
      this.posY = lerp(this.posY, this.stuckY, this.lerpFactor)
    } else {
      this.posX = lerp(this.posX, this.targetX, this.lerpFactor)
      this.posY = lerp(this.posY, this.targetY, this.lerpFactor)
    }

    // Move canvas via transform (NOT redraw full screen — just translate)
    this.canvas.style.transform = `translate(${this.posX - CANVAS_HALF}px, ${this.posY - CANVAS_HALF}px)`

    // Radius — expand when stuck (hovering interactive), shrink otherwise
    const targetR = this.isStuck ? this.targetRadius : this.baseRadius
    this.currentRadius = lerp(this.currentRadius, targetR, 0.15)

    // Draw noisy circle on canvas (small 100×100 canvas, cheap)
    this.drawCircle()

    this.frameCount++
  }

  private drawCircle(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Circle center = canvas center
    const cx = CANVAS_HALF
    const cy = CANVAS_HALF

    ctx.beginPath()
    ctx.strokeStyle = this.isStuck ? 'rgba(81, 93, 132, 0.9)' : 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1.5

    // Draw polygon with noise distortion (codrops-style)
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 3
    for (let i = 0; i <= this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2
      let r = this.currentRadius

      if (isNoisy) {
        // Apply simplex noise distortion
        const noiseX = noise2D(this.frameCount / this.noiseScale, i)
        const noiseY = noise2D(this.frameCount / this.noiseScale, i + 10)
        const distortion = (noiseX + noiseY) * this.noiseRange
        r += distortion
      }

      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  destroy() {
    window.removeEventListener('mousemove', this.mousemoveHandler)
    window.removeEventListener('resize', this.resizeHandler)
    document.removeEventListener('mouseover', this.mouseoverHandler)
    document.removeEventListener('mouseout', this.mouseoutHandler)
    this.innerEl.remove()
    this.canvas.remove()
  }
}
