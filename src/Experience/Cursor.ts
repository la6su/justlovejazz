// src/Experience/Cursor.ts — Custom cursor with codrops-style noisy circle.
//
// Two elements:
//   1. Inner dot (5px) — follows mouse instantly via transform
//   2. Outer circle (canvas) — follows with lerp(0.2), noisy distortion on hover
//
// Inspired by skaltenegger/customcursor (codrops tutorial), reimplemented
// without paper.js — pure Canvas 2D + custom simplex noise. The noisy
// circle expands + distorts when hovering interactive elements (a, button,
// [data-magnetic]).
//
// Respects on-demand rendering: update() called from Experience loop (gated
// by _needsRender). Canvas redraw is cheap (single arc + 8 segments).
//
// Mobile: hidden (display:none) — touch devices don't need a custom cursor.

import { DeviceCapability } from '../core/DeviceCapability'

// Simplex noise (simplified 2D) — no external dependency.
// Returns value in [-1, 1]. Good enough for cursor distortion.
function noise2D(x: number, y: number): number {
  // Simple hash-based noise — fast, smooth enough for visual effect.
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b
}

export class Cursor {
  private innerEl: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private posX = 0
  private posY = 0
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
  private readonly targetRadius = 35 // expanded on hover
  private readonly segments = 8
  private readonly noiseScale = 150 // speed
  private readonly noiseRange = 4 // distortion range
  private frameCount = 0

  private readonly mousemoveHandler: (e: MouseEvent) => void
  private readonly mouseoverHandler: (e: MouseEvent) => void
  private readonly mouseoutHandler: (e: MouseEvent) => void

  constructor() {
    // Inner dot (follows mouse instantly)
    this.innerEl = document.createElement('div')
    this.innerEl.classList.add('custom-cursor-inner')

    // Outer canvas (noisy circle, follows with lerp)
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('custom-cursor-canvas')
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
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
      const magnetic = target.closest('[data-magnetic]')
      if (magnetic) {
        const rect = magnetic.getBoundingClientRect()
        this.stuckX = rect.left + rect.width / 2
        this.stuckY = rect.top + rect.height / 2
        this.isStuck = true
      } else if (target.closest('a, button, .interactive')) {
        this.isStuck = false
      } else {
        this.isStuck = false
      }
    }
    this.mouseoutHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-magnetic]')) {
        this.isStuck = false
      }
    }

    window.addEventListener('mousemove', this.mousemoveHandler)
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
    })
    document.addEventListener('mouseover', this.mouseoverHandler)
    document.addEventListener('mouseout', this.mouseoutHandler)
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

    // Radius — expand when stuck (hovering interactive), shrink otherwise
    const targetR = this.isStuck ? this.targetRadius : this.baseRadius
    this.currentRadius = lerp(this.currentRadius, targetR, 0.15)

    // Draw noisy circle on canvas
    this.drawCircle()

    this.frameCount++
  }

  private drawCircle(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    ctx.beginPath()
    ctx.strokeStyle = this.isStuck ? 'rgba(81, 93, 132, 0.8)' : 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1

    // Draw polygon with noise distortion (codrops-style)
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 5
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

      const x = this.posX + Math.cos(angle) * r
      const y = this.posY + Math.sin(angle) * r
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
