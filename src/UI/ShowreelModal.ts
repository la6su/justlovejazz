// ShowreelModal.ts — Fullscreen video modal using UIKit3 uk-modal.
//
// Uses UIKit3 native modal (uk-modal) for overlay, backdrop, animation,
// Esc-to-close, focus trap. Custom controls (play/pause, mute, seek, close)
// on top of the modal structure.
//
// Video source: /assets/video/coming-soon.mp4 (placeholder in public/).

import UIkit from 'uikit'

export class ShowreelModal {
  private container: HTMLDivElement
  private video: HTMLVideoElement
  private playBtn: HTMLButtonElement
  private muteBtn: HTMLButtonElement
  private seekBar: HTMLInputElement
  private _isOpen = false
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor() {
    // UIKit3 modal structure: <div uk-modal><div class="uk-modal-dialog">...</div></div>
    this.container = document.createElement('div')
    this.container.id = 'jlz-showreel-modal'
    this.container.setAttribute('uk-modal', 'bg-close: true; esc-close: true; stack: false')
    this.container.className = 'jlz-showreel-modal uk-modal uk-flex uk-flex-top'

    this.container.innerHTML = `
      <div class="uk-modal-dialog jlz-showreel-dialog uk-margin-auto-vertical">
        <button class="uk-modal-close-default jlz-showreel-close" type="button" uk-close aria-label="Close showreel"></button>
        <div class="jlz-showreel-video-wrap" data-cursor="play">
          <video class="jlz-showreel-video" preload="metadata" playsinline>
            <source src="/assets/video/coming-soon.mp4" type="video/mp4" />
          </video>
          <div class="jlz-showreel-big-play" aria-hidden="true">
            <span class="jlz-showreel-big-play__icon"></span>
          </div>
        </div>
        <div class="jlz-showreel-controls">
          <button class="jlz-showreel-play uk-icon-button" type="button" aria-label="Play/Pause">
            <span uk-icon="icon: play; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <button class="jlz-showreel-mute uk-icon-button" type="button" aria-label="Mute/Unmute" aria-pressed="true">
            <span uk-icon="icon: muted; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <input class="jlz-showreel-seek uk-range" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek" />
          <span class="jlz-showreel-time">0:00 / 0:00</span>
        </div>
      </div>
    `

    document.body.appendChild(this.container)

    // Wire elements
    this.video = this.container.querySelector('.jlz-showreel-video')!
    this.playBtn = this.container.querySelector('.jlz-showreel-play')!
    this.muteBtn = this.container.querySelector('.jlz-showreel-mute')!
    this.seekBar = this.container.querySelector('.jlz-showreel-seek')!
    const bigPlay = this.container.querySelector('.jlz-showreel-big-play') as HTMLElement

    // Start muted (browser autoplay policy)
    this.video.muted = true

    // Play/Pause
    const togglePlay = () => {
      if (this.video.paused) {
        this.video.play().catch(() => { /* autoplay blocked */ })
      } else {
        this.video.pause()
      }
    }
    this.playBtn.addEventListener('click', togglePlay)
    bigPlay.addEventListener('click', togglePlay)
    this.video.addEventListener('click', togglePlay)

    // Mute toggle
    this.muteBtn.addEventListener('click', () => {
      this.video.muted = !this.video.muted
      this.muteBtn.setAttribute('aria-pressed', String(this.video.muted))
      const icon = this.muteBtn.querySelector('[uk-icon]')
      icon?.setAttribute('uk-icon', `icon: ${this.video.muted ? 'muted' : 'sound'}; ratio: 1.2`)
    })

    // Video events
    this.video.addEventListener('play', () => {
      bigPlay.style.opacity = '0'
      this.playBtn.querySelector('[uk-icon]')?.setAttribute('uk-icon', 'icon: pause; ratio: 1.2')
    })
    this.video.addEventListener('pause', () => {
      bigPlay.style.opacity = '1'
      this.playBtn.querySelector('[uk-icon]')?.setAttribute('uk-icon', 'icon: play; ratio: 1.2')
    })
    this.video.addEventListener('timeupdate', () => {
      const pct = (this.video.currentTime / this.video.duration) * 100
      const pctStr = String(isNaN(pct) ? 0 : pct)
      this.seekBar.value = pctStr
      this.seekBar.style.setProperty('--jlz-seek-progress', `${pctStr}%`)
      this.updateTimeDisplay()
    })
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay())

    // Seek
    this.seekBar.addEventListener('input', () => {
      const pct = Number(this.seekBar.value)
      this.video.currentTime = (pct / 100) * this.video.duration
    })

    // UIKit3 modal events — sync our state
    UIkit.util.on(this.container, 'show', () => {
      this._isOpen = true
      this.video.currentTime = 0
      this.video.play().catch(() => { /* user must click play */ })
    })
    UIkit.util.on(this.container, 'hide', () => {
      this._isOpen = false
      this.video.pause()
    })

    // Space to toggle play (when modal is open)
    this._keydownHandler = (e: KeyboardEvent) => {
      if (e.key === ' ' && this._isOpen) {
        e.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', this._keydownHandler)
  }

  private updateTimeDisplay(): void {
    const fmt = (s: number) => {
      if (isNaN(s)) return '0:00'
      const m = Math.floor(s / 60)
      const sec = Math.floor(s % 60)
      return `${m}:${sec.toString().padStart(2, '0')}`
    }
    const timeEl = this.container.querySelector('.jlz-showreel-time')
    if (timeEl) timeEl.textContent = `${fmt(this.video.currentTime)} / ${fmt(this.video.duration)}`
  }

  open(): void {
    if (this._isOpen) return
    UIkit.modal(this.container).show()
  }

  close(): void {
    if (!this._isOpen) return
    UIkit.modal(this.container).hide()
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  dispose(): void {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
    UIkit.modal(this.container).$destroy()
    this.container.remove()
  }
}
