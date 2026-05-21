import * as THREE from 'three'
import { type Project } from '../core/types'
import { DissolveSliderMaterial } from '../shaders/DissolveSliderMaterial'
import { SliderTextOverlay } from './SliderTextOverlay'
import { Easings } from '../Utils/Easings'

export class HomeSlider {
  public readonly group: THREE.Group
  public readonly projects: Project[]

  private material: DissolveSliderMaterial
  private activeIndex = 0
  private transitioning = false
  private nextIdx = 0
  private tStart = 0
  private textA: SliderTextOverlay | null = null
  private textB: SliderTextOverlay | null = null
  private startX = 0
  private timer: any = null
  private visible = true
  private dots: HTMLElement[] = []
  private cfg: any

  constructor(projects: Project[], cfg: any = {}) {
    this.projects = projects
    this.cfg = { dur: cfg.dur || 1.55, auto: cfg.auto || 9800 }
    this.group = new THREE.Group()
    this.group.name = 'hslider'
    this.material = new DissolveSliderMaterial()
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material.material)
    m.renderOrder = 999
    this.group.add(m)
    this.createDOM()
    this.bindKeys()
    this.go(0)
    this.bindTouch()
    this.startTimer()
  }

  private createDOM() {
    const w = document.createElement('div')
    w.className = 'home-slider__dots'
    w.setAttribute('aria-label', 'Home slider navigation')
    for (let i = 0; i < this.projects.length; i++) {
      const d = document.createElement('button')
      d.className = 'home-slider__dot'
      d.setAttribute('aria-label', `Open slide ${i + 1}`)
      d.onclick = () => this.hit(i)
      this.dots.push(d)
      w.appendChild(d)
    }
    document.body.appendChild(w)
  }

  private bindKeys() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); this.next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev() }
    })
  }

  private bindTouch() {
    window.addEventListener('touchstart', (e: TouchEvent) => { this.startX = e.changedTouches[0].clientX }, { passive: false })
    window.addEventListener('touchend', (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - this.startX
      if (Math.abs(dx) > 60) dx < 0 ? this.next() : this.prev()
    })
    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden
      if (this.visible) this.startTimer(); else this.killTimer()
    })
  }

  go(i: number) {
    i = ((i % this.projects.length) + this.projects.length) % this.projects.length
    this.activeIndex = i
    this.material.setColorA(new THREE.Color(this.projects[i].color).multiplyScalar(0.3))
    this.material.setDissolve(0)
    this.textA?.dispose()
    this.textB?.dispose()
    this.textA = new SliderTextOverlay(this.projects[i])
    this.textA.setFade(0)
    this.group.add(this.textA.group)
    requestAnimationFrame(() => this.textA?.setFade(1))
    this.pulse()
  }

  hit(i: number) {
    if (i === this.activeIndex || this.transitioning) return
    const d = i - this.activeIndex
    if (d > 0) for (let _ = 0; _ < d; _++) this.next()
    else for (let _ = 0; _ < -d; _++) this.prev()
  }

  setActive(i: number) { this.hit(i) }

  next() {
    if (this.transitioning) return
    this.transitioning = true
    this.nextIdx = (this.activeIndex + 1) % this.projects.length
    this.tStart = performance.now()
    this.material.setColorB(new THREE.Color(this.projects[this.nextIdx].color).multiplyScalar(0.3))
    this.material.setDissolve(0)
    this.textB = new SliderTextOverlay(this.projects[this.nextIdx])
    this.textB.setFade(0)
    this.group.add(this.textB.group)
    this.killTimer()
  }

  prev() {
    if (this.transitioning) return
    this.transitioning = true
    this.nextIdx = (this.activeIndex - 1 + this.projects.length) % this.projects.length
    this.tStart = performance.now()
    this.material.setColorB(new THREE.Color(this.projects[this.nextIdx].color).multiplyScalar(0.3))
    this.material.setDissolve(0)
    this.textB = new SliderTextOverlay(this.projects[this.nextIdx])
    this.textB.setFade(0)
    this.group.add(this.textB.group)
    this.killTimer()
  }

  update(dt: number) {
    this.material.update(dt)
    if (!this.transitioning) return
    const e = (performance.now() - this.tStart) / 1000
    const r = Math.min(1, e / this.cfg.dur)
    const s = Easings.easeInOutCubic(r)
    const v = s < 0.5 ? s * 2 : (1 - s) * 2
    this.material.setDissolve(v)
    this.textA?.setFade(1 - s)
    this.textB?.setFade(s)
    if (s >= 1) this.commit()
  }

  private commit() {
    this.transitioning = false
    this.activeIndex = this.nextIdx
    this.material.setColorA(new THREE.Color(this.projects[this.activeIndex].color).multiplyScalar(0.3))
    this.material.setDissolve(0)
    this.textA?.dispose()
    this.group.remove(this.textB ? this.textB.group : null as any)
    this.textA = this.textB
    this.textB = null
    this.pulse()
    this.startTimer()
  }

  private pulse() {
    this.dots.forEach((d, i) => {
      d.classList.toggle('is-active', i === this.activeIndex)
    })
  }

  private startTimer() {
    this.killTimer()
    this.timer = setInterval(() => { if (this.visible) this.next() }, this.cfg.auto)
  }

  private killTimer() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  dispose() {
    this.killTimer()
    this.textA?.dispose()
    this.textB?.dispose()
    this.material.dispose()
    this.dots.forEach(d => d.remove())
  }
}
