// ShowreelModal.ts — Fullscreen video modal for showreel playback.
//
// Opens on play button click (intro section). Fullscreen overlay with
// HTML5 <video>, custom controls (play/pause, mute, close, seek bar).
// Custom cursor 'play' state on video element. Esc closes.
//
// Video source: /assets/video/coming-soon.mp4 (placeholder in public/).

export class ShowreelModal {
  private container: HTMLDivElement
  private video: HTMLVideoElement
  private playBtn: HTMLButtonElement
  private muteBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement
  private seekBar: HTMLInputElement
  private _isOpen = false
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor() {
    // Container — fullscreen overlay
    this.container = document.createElement('div')
    this.container.id = 'jlz-showreel-modal'
    this.container.className = 'jlz-showreel-modal'
    this.container.setAttribute('role', 'dialog')
    this.container.setAttribute('aria-modal', 'true')
    this.container.setAttribute('aria-label', 'Showreel video')
    this.container.style.display = 'none'

    this.container.innerHTML = `
      <div class="jlz-showreel-backdrop" aria-hidden="true"></div>
      <div class="jlz-showreel-content">
        <button class="jlz-showreel-close" type="button" aria-label="Close showreel">
          <span uk-icon="icon: close; ratio: 1.4" aria-hidden="true"></span>
        </button>
        <div class="jlz-showreel-video-wrap" data-cursor="play">
          <video class="jlz-showreel-video" preload="metadata" playsinline>
            <source src="/assets/video/coming-soon.mp4" type="video/mp4" />
          </video>
          <div class="jlz-showreel-big-play" aria-hidden="true">
            <span class="jlz-showreel-big-play__icon"></span>
          </div>
        </div>
        <div class="jlz-showreel-controls">
          <button class="jlz-showreel-play" type="button" aria-label="Play/Pause">
            <span class="jlz-showreel-play__icon" uk-icon="icon: play; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <button class="jlz-showreel-mute" type="button" aria-label="Mute/Unmute" aria-pressed="true">
            <span uk-icon="icon: muted; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <input class="jlz-showreel-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek" />
          <span class="jlz-showreel-time">0:00 / 0:00</span>
        </div>
      </div>
    `

    document.body.appendChild(this.container)

    // Wire elements
    this.video = this.container.querySelector('.jlz-showreel-video')!
    this.playBtn = this.container.querySelector('.jlz-showreel-play')!
    this.muteBtn = this.container.querySelector('.jlz-showreel-mute')!
    this.closeBtn = this.container.querySelector('.jlz-showreel-close')!
    this.seekBar = this.container.querySelector('.jlz-showreel-seek')!
    const bigPlay = this.container.querySelector('.jlz-showreel-big-play') as HTMLElement
    const backdrop = this.container.querySelector('.jlz-showreel-backdrop') as HTMLElement

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

    // Close
    const close = () => this.close()
    this.closeBtn.addEventListener('click', close)
    backdrop.addEventListener('click', close)

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
      this.seekBar.value = String(isNaN(pct) ? 0 : pct)
      this.updateTimeDisplay()
    })
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay())

    // Seek
    this.seekBar.addEventListener('input', () => {
      const pct = Number(this.seekBar.value)
      this.video.currentTime = (pct / 100) * this.video.duration
    })

    // Esc to close
    this._keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this._isOpen) {
        e.preventDefault()
        this.close()
      }
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
    this._isOpen = true
    this.container.style.display = 'flex'
    requestAnimationFrame(() => this.container.classList.add('is-open'))
    // Try autoplay (muted — browser policy compliant)
    this.video.currentTime = 0
    this.video.play().catch(() => { /* user must click play */ })
  }

  close(): void {
    if (!this._isOpen) return
    this._isOpen = false
    this.container.classList.remove('is-open')
    this.video.pause()
    setTimeout(() => {
      if (!this._isOpen) this.container.style.display = 'none'
    }, 300)
  }

  get isOpen(): boolean {
    return this._isOpen
  }

  dispose(): void {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
    this.container.remove()
  }
}
