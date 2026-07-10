// src/Experience/Cursor.ts — Custom cursor with codrops-style noisy circle.
//
// Two elements (both small, follow mouse via transform):
//   1. Inner dot (6px) — follows mouse instantly, centered via translate -50%
//   2. Outer circle (canvas 100×100px) — follows with smooth lerp(0.15),
//      noisy distortion on hover
//
// Design decisions:
//   - Canvas is SMALL (100×100px), transform follows mouse. Cheap redraw.
//   - NO mix-blend-mode (breaks inside stacking contexts like modals).
//   - Both: pointer-events: none, z-index: 100000.
//   - Centered via translate(calc(X - 50%), calc(Y - 50%)) — no margin hack.
//   - Smooth lerp (0.15) for outer circle — no jitter on hover transitions.
//   - stuckX/stuckY lerps toward targetX/targetY when not stuck — prevents
//     jump when un-sticking (mouseleave → immediate jump to mouse pos).

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
  // Smooth lerp — lower = smoother but more lag. 0.15 = nice balance.
  private readonly lerpFactor = 0.15

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

  private readonly mousemoveHandler: (e: MouseEvent) => void
  private readonly mouseoverHandler: (e: MouseEvent) => void
  private readonly mouseoutHandler: (e: MouseEvent) => void

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
      const magnetic = target.closest('[data-magnetic]')
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect()
        this.stuckX = rect.left + rect.width / 2
        this.stuckY = rect.top + rect.height / 2
        this.isStuck = true
      } else if (target.closest('a, button, .interactive, [uk-toggle], [uk-slider]')) {
        // On hover, stick to mouse position (not element center) — smoother.
        this.stuckX = this.targetX
        this.stuckY = this.targetY
        this.isStuck = true
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

    window.addEventListener('mousemove', this.mousemoveHandler, { passive: true })
    document.addEventListener('mouseover', this.mouseoverHandler, { passive: true })
    document.addEventListener('mouseout', this.mouseoutHandler, { passive: true })
  }

  update() {
    // Inner dot — instant follow, centered via translate -50%
    this.innerX = this.targetX
    this.innerY = this.targetY
    this.innerEl.style.transform = `translate(${this.innerX}px, ${this.innerY}px) translate(-50%, -50%)`

    // Outer circle — smooth lerp follow
    // When stuck, follow stuckX/stuckY (element center or mouse pos).
    // When not stuck, follow mouse. Lerp prevents jumps.
    const goalX = this.isStuck ? this.stuckX : this.targetX
    const goalY = this.isStuck ? this.stuckY : this.targetY
    this.posX = lerp(this.posX, goalX, this.lerpFactor)
    this.posY = lerp(this.posY, goalY, this.lerpFactor)

    // Move canvas — centered on cursor via translate -50%
    this.canvas.style.transform = `translate(${this.posX}px, ${this.posY}px) translate(-50%, -50%)`

    // Radius — smooth expand/shrink
    const targetR = this.isStuck ? this.targetRadius : this.baseRadius
    this.currentRadius = lerp(this.currentRadius, targetR, 0.12)

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

    ctx.beginPath()
    ctx.strokeStyle = this.isStuck ? 'rgba(81, 93, 132, 0.8)' : 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.5

    // Noisy distortion only when expanded enough (prevents jitter at small radius)
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 5
    for (let i = 0; i <= this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2
      let r = this.currentRadius

      if (isNoisy) {
        const noiseX = noise2D(this.frameCount / this.noiseScale, i)
        const noiseY = noise2D(this.frameCount / this.noiseScale, i + 10)
        r += (noiseX + noiseY) * this.noiseRange
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
    document.removeEventListener('mouseover', this.mouseoverHandler)
    document.removeEventListener('mouseout', this.mouseoutHandler)
    this.innerEl.remove()
    this.canvas.remove()
  }
}
