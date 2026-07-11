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
  private readonly sfx?: { play: (name: 'hover' | 'click' | 'open' | 'close') => void }

  // Noisy circle state
  private isStuck = false
  private stuckX = 0
  private stuckY = 0
  private currentRadius = 20
  private readonly baseRadius = 20
  private readonly targetRadius = 36
  private readonly segments = 8
  private readonly noiseScale = 150
  private readonly noiseRange = 3
  private frameCount = 0
  // Last-draw state — skip canvas redraw when nothing changed
  private _lastDrawX = 0
  private _lastDrawY = 0
  private _lastDrawR = 0
  private _lastDrawFill = 0
  private _lastDrawBump = 1
  private _lastDrawStuck = false

  // Click bump state (demo1)
  private bumpScale = 1
  private bumpTarget = 1

  // Fill state (demo4 — fill circle on hover)
  private fillProgress = 0
  private fillTarget = 0

  private readonly mousemoveHandler: (e: MouseEvent) => void
  private readonly mouseoverHandler: (e: MouseEvent) => void
  private readonly mouseoutHandler: (e: MouseEvent) => void
  private readonly clickHandler: (e: MouseEvent) => void

  constructor(sfx?: { play: (name: 'hover' | 'click' | 'open' | 'close') => void }) {
    this.sfx = sfx
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
        // Magnetic hover SFX (subtle tick). Only on first entry — the mouseout
        // handler resets isStuck=false, so re-entry re-fires this.
        this.sfx?.play('hover')
      } else {
        this.isStuck = false
        this.fillTarget = 0
      }
    }
    this.mouseoutHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target || typeof target.closest !== 'function') return
      if (target.closest('[data-magnetic], a, button, .interactive, [uk-toggle], [uk-slider]')) {
        this.isStuck = false
        this.fillTarget = 0
      }
    }
    this.clickHandler = () => {
      // Bump: radius scales down to 0.7, then bounces back to 1.0
      this.bumpScale = 0.6
      this.bumpTarget = 1
      this.sfx?.play('click')
    }

    window.addEventListener('mousemove', this.mousemoveHandler, { passive: true })
    document.addEventListener('mouseover', this.mouseoverHandler, { passive: true })
    document.addEventListener('mouseout', this.mouseoutHandler, { passive: true })
    document.addEventListener('click', this.clickHandler, { passive: true })
  }

  update() {
    // Inner dot — instant follow, centered.
    // Color: accent-hover (idle) → RED (hover) via CSS .is-hover class.
    // Inner dot stays visible (no opacity fade) — just changes color.
    this.innerX = this.targetX
    this.innerY = this.targetY
    this.innerEl.classList.toggle('is-hover', this.isStuck)
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

    // Draw noisy circle — ONLY when something changed (avoids redraw when idle)
    const moved = Math.abs(this.posX - this._lastDrawX) > 0.3
      || Math.abs(this.posY - this._lastDrawY) > 0.3
      || Math.abs(this.currentRadius - this._lastDrawR) > 0.3
      || Math.abs(this.fillProgress - this._lastDrawFill) > 0.01
      || Math.abs(this.bumpScale - this._lastDrawBump) > 0.01
      || this.isStuck !== this._lastDrawStuck
    if (moved) {
      this.drawCircle()
      this._lastDrawX = this.posX
      this._lastDrawY = this.posY
      this._lastDrawR = this.currentRadius
      this._lastDrawFill = this.fillProgress
      this._lastDrawBump = this.bumpScale
      this._lastDrawStuck = this.isStuck
    }
    this.frameCount++
  }

  private drawCircle(): void {
    if (!this.ctx) return
    const ctx = this.ctx
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const cx = CANVAS_HALF
    const cy = CANVAS_HALF
    const radius = this.currentRadius * this.bumpScale

    ctx.beginPath()
    // Outer circle stroke/fill: always accent-hover color (NOT red).
    const strokeR = 107, strokeG = 120, strokeB = 163   // #6b78a3 accent-hover
    const alpha = 0.6 + this.fillProgress * 0.3
    ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${alpha})`
    ctx.lineWidth = 2

    // Noisy distortion only when expanded enough
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 5
    for (let i = 0; i <= this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2
      let segRadius = radius

      if (isNoisy) {
        const noiseX = noise2D(this.frameCount / this.noiseScale, i)
        const noiseY = noise2D(this.frameCount / this.noiseScale, i + 10)
        segRadius += (noiseX + noiseY) * this.noiseRange
      }

      const x = cx + Math.cos(angle) * segRadius
      const y = cy + Math.sin(angle) * segRadius
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    // Fill: accent color (same as stroke, NOT red)
    if (this.fillProgress > 0.01) {
      ctx.fillStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${this.fillProgress * 0.4})`
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
