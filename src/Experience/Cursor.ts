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

// Phase 2: canvas 100→120 for larger cursor (baseRadius 28 + targetRadius 44)
const CANVAS_SIZE = 120
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
  private readonly sfx?: { play: (name: 'hover' | 'click' | 'open' | 'close') => void }

  // Phase 2: spring physics for wobble (skaltenegger-style, smoothed)
  // Outer circle lags behind mouse with spring-damper, giving organic wobble
  // Stiffness lowered (0.25→0.18) + damping raised (0.55→0.7) for smoother motion
  private velX = 0
  private velY = 0
  private readonly springStiffness = 0.18
  private readonly springDamping = 0.7

  // Phase 2: custom cursor states (data-cursor attribute)
  // 'play' → triangle, 'drag' → hand, 'view' → eye, 'muted'/'unmuted' → speaker
  private cursorState: string | null = null

  // Noisy circle state
  private isStuck = false
  private stuckX = 0
  private stuckY = 0
  // Phase 6: spring physics replaces instant magnetic snap — cursor eases
  // toward element center with spring-damper (organic wobble, not instant jump)
  // Phase 2: larger cursor (baseRadius 20→28, targetRadius 36→44)
  private currentRadius = 28
  private readonly baseRadius = 28
  private readonly targetRadius = 44
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
  private _lastDrawState: string | null = null

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
      // Phase 2: check for custom cursor state (data-cursor attribute)
      const stateEl = target.closest('[data-cursor]') as HTMLElement | null
      this.cursorState = stateEl?.dataset.cursor ?? null
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

    // Phase 6: spring physics for outer circle (skaltenegger wobble pattern)
    // Goal: magnetic element center (if stuck) or mouse position (if free)
    const goalX = this.isStuck ? this.stuckX : this.targetX
    const goalY = this.isStuck ? this.stuckY : this.targetY
    // Spring-damper: F = -k*(pos - goal) - d*vel
    // Integration: vel += (goal - pos) * stiffness - vel * damping
    const dx = goalX - this.posX
    const dy = goalY - this.posY
    this.velX = (this.velX + dx * this.springStiffness) * this.springDamping
    this.velY = (this.velY + dy * this.springStiffness) * this.springDamping
    this.posX += this.velX
    this.posY += this.velY
    this.canvas.style.transform = `translate(${this.posX}px, ${this.posY}px) translate(-50%, -50%)`

    // Radius — smooth expand/shrink + click bump
    const targetR = this.isStuck ? this.targetRadius : this.baseRadius
    this.currentRadius = lerp(this.currentRadius, targetR, 0.12)
    // Bump: lerp bumpScale back to 1 after click
    this.bumpScale = lerp(this.bumpScale, this.bumpTarget, 0.2)

    // Fill progress — 0 = stroke only, 1 = filled
    this.fillProgress = lerp(this.fillProgress, this.fillTarget, 0.12)

    // Draw cursor — ONLY when something changed (avoids redraw when idle)
    const moved = Math.abs(this.posX - this._lastDrawX) > 0.3
      || Math.abs(this.posY - this._lastDrawY) > 0.3
      || Math.abs(this.currentRadius - this._lastDrawR) > 0.3
      || Math.abs(this.fillProgress - this._lastDrawFill) > 0.01
      || Math.abs(this.bumpScale - this._lastDrawBump) > 0.01
      || this.isStuck !== this._lastDrawStuck
      || this.cursorState !== this._lastDrawState
    if (moved) {
      this.drawCircle()
      this._lastDrawX = this.posX
      this._lastDrawY = this.posY
      this._lastDrawR = this.currentRadius
      this._lastDrawFill = this.fillProgress
      this._lastDrawBump = this.bumpScale
      this._lastDrawStuck = this.isStuck
      this._lastDrawState = this.cursorState
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

    // Phase 2: custom cursor states (data-cursor attribute)
    // Draw different shapes based on cursorState
    if (this.cursorState === 'play') {
      this.drawPlayIcon(ctx, cx, cy, radius)
      return
    }
    if (this.cursorState === 'drag') {
      this.drawDragIcon(ctx, cx, cy, radius)
      return
    }
    if (this.cursorState === 'view') {
      this.drawViewIcon(ctx, cx, cy, radius)
      return
    }

    // Default: noisy circle with SMOOTHED edges (quadraticCurveTo)
    ctx.beginPath()
    // Outer circle stroke/fill: always accent-hover color (NOT red).
    const strokeR = 107, strokeG = 120, strokeB = 163   // #6b78a3 accent-hover
    const alpha = 0.6 + this.fillProgress * 0.3
    ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${alpha})`
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Noisy distortion only when expanded enough
    const isNoisy = this.isStuck && this.currentRadius > this.baseRadius + 5
    // Phase 6: more segments (8→16) + quadraticCurveTo for smoothed edges
    const smoothSegments = 16
    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i < smoothSegments; i++) {
      const angle = (i / smoothSegments) * Math.PI * 2
      let segRadius = radius

      if (isNoisy) {
        const noiseX = noise2D(this.frameCount / this.noiseScale, i)
        const noiseY = noise2D(this.frameCount / this.noiseScale, i + 10)
        segRadius += (noiseX + noiseY) * this.noiseRange
      }

      points.push({
        x: cx + Math.cos(angle) * segRadius,
        y: cy + Math.sin(angle) * segRadius,
      })
    }

    // Draw smoothed curve through points using quadraticCurveTo (midpoint method)
    if (points.length > 0) {
      ctx.moveTo((points[0]!.x + points[points.length - 1]!.x) / 2, (points[0]!.y + points[points.length - 1]!.y) / 2)
      for (let i = 0; i < points.length; i++) {
        const curr = points[i]!
        const next = points[(i + 1) % points.length]!
        const midX = (curr.x + next.x) / 2
        const midY = (curr.y + next.y) / 2
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY)
      }
      ctx.closePath()
    }

    // Fill: accent color (same as stroke, NOT red)
    if (this.fillProgress > 0.01) {
      ctx.fillStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${this.fillProgress * 0.4})`
      ctx.fill()
    }
    ctx.stroke()
  }

  /** Phase 2: Play triangle icon — for showreel/video elements. */
  private drawPlayIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    // Filled circle + triangle
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(196, 255, 0, 0.15)'  // accent-lime
    ctx.fill()
    ctx.strokeStyle = 'rgba(196, 255, 0, 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Triangle (play icon)
    const size = r * 0.5
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.5, cy - size)
    ctx.lineTo(cx - size * 0.5, cy + size)
    ctx.lineTo(cx + size * 0.8, cy)
    ctx.closePath()
    ctx.fillStyle = 'rgba(196, 255, 0, 0.95)'
    ctx.fill()
  }

  /** Phase 2: Drag arrows icon — for carousel/slider elements. */
  private drawDragIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(107, 120, 163, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Left-right arrows (smoothed with round caps)
    const arrowSize = r * 0.4
    ctx.strokeStyle = 'rgba(107, 120, 163, 0.9)'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // Left arrow
    ctx.beginPath()
    ctx.moveTo(cx - arrowSize, cy)
    ctx.lineTo(cx - arrowSize * 2, cy)
    ctx.moveTo(cx - arrowSize * 2, cy)
    ctx.lineTo(cx - arrowSize * 1.5, cy - arrowSize * 0.4)
    ctx.moveTo(cx - arrowSize * 2, cy)
    ctx.lineTo(cx - arrowSize * 1.5, cy + arrowSize * 0.4)
    ctx.stroke()
    // Right arrow
    ctx.beginPath()
    ctx.moveTo(cx + arrowSize, cy)
    ctx.lineTo(cx + arrowSize * 2, cy)
    ctx.moveTo(cx + arrowSize * 2, cy)
    ctx.lineTo(cx + arrowSize * 1.5, cy - arrowSize * 0.4)
    ctx.moveTo(cx + arrowSize * 2, cy)
    ctx.lineTo(cx + arrowSize * 1.5, cy + arrowSize * 0.4)
    ctx.stroke()
  }

  /** Phase 2: View/eye icon — for project cards. */
  private drawViewIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(107, 120, 163, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Eye shape
    const eyeW = r * 0.9
    const eyeH = r * 0.5
    ctx.strokeStyle = 'rgba(107, 120, 163, 0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, eyeW, eyeH, 0, 0, Math.PI * 2)
    ctx.stroke()
    // Pupil
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(107, 120, 163, 0.9)'
    ctx.fill()
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
