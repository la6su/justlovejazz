// FullscreenOverlay.ts — Unified fullscreen overlay for video content + project info.
//
// Replaces both ShowreelModal (video-only) and ProjectOverlay (project-info-only).
// Single overlay with:
//   - Video element + custom controls (play/pause, mute, seek, time)
//   - Poster image (first frame / textureUrl) shown before play
//   - Project info (title, category, description, tags, counter)
//   - Prev/next navigation arrows (optional)
//   - UIKit3 uk-modal base (Esc to close, bg-close, focus trap)
//
// Two usage modes:
//   1. Showreel mode: open({ videoSrc, poster?, title? }) — video-focused
//   2. Project mode: open({ poster, title, desc, tags, counter, hasPrev, hasNext })
//      — project-info-focused, video optional
//
// The overlay auto-adapts: if videoSrc provided → shows video + controls;
// if not → shows poster image only. Project info shows if title/desc provided.

import UIkit from 'uikit'
import { BlurFade } from '../Experience/BlurFade'

export interface OverlayOptions {
  // Video source (optional — if omitted, poster image only)
  videoSrc?: string
  // Poster image URL (first frame / textureUrl) — shown before play
  poster?: string
  // Project info (optional)
  title?: string
  category?: string
  description?: string
  tags?: string[]
  counter?: string // e.g. "1 / 8"
  // Navigation (optional)
  hasPrev?: boolean
  hasNext?: boolean
}

export class FullscreenOverlay {
  private container: HTMLDivElement
  private video: HTMLVideoElement
  private posterEl: HTMLDivElement
  private playBtn: HTMLButtonElement
  private muteBtn: HTMLButtonElement
  private seekBar: HTMLInputElement
  private timeEl: HTMLElement
  private bigPlay: HTMLElement
  private prevBtn: HTMLButtonElement
  private nextBtn: HTMLButtonElement
  private titleEl: HTMLElement
  private catEl: HTMLElement
  private descEl: HTMLElement
  private tagsEl: HTMLElement
  private counterEl: HTMLElement
  private controlsEl: HTMLElement
  private _isOpen = false
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null

  public onPrev: (() => void) | null = null
  public onNext: (() => void) | null = null
  public onClose: (() => void) | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'jlz-fs-overlay'
    this.container.setAttribute('uk-modal', 'bg-close: true; esc-close: true; stack: false')
    this.container.className = 'jlz-fs-overlay uk-modal uk-flex uk-flex-top'

    this.container.innerHTML = `
      <div class="uk-modal-dialog jlz-fs-dialog uk-margin-auto-vertical">
        <button class="uk-modal-close-default jlz-fs-close" type="button" uk-close aria-label="Close"></button>
        <button class="jlz-fs-prev" type="button" aria-label="Previous" uk-slidenav-previous></button>
        <button class="jlz-fs-next" type="button" aria-label="Next" uk-slidenav-next></button>
        <div class="jlz-fs-video-wrap">
          <div class="jlz-fs-poster" aria-hidden="true"></div>
          <video class="jlz-fs-video" preload="none" playsinline>
          </video>
          <div class="jlz-fs-big-play" aria-hidden="true">
            <span class="jlz-fs-big-play__icon"></span>
          </div>
        </div>
        <div class="jlz-fs-info">
          <div class="jlz-fs-info-top uk-flex uk-flex-between uk-flex-middle">
            <div class="jlz-fs-info-left">
              <div class="jlz-fs-cat uk-text-uppercase"></div>
              <h2 class="jlz-fs-title uk-margin-remove"></h2>
            </div>
            <div class="jlz-fs-counter"></div>
          </div>
          <p class="jlz-fs-desc uk-margin-remove"></p>
          <div class="jlz-fs-tags uk-flex uk-flex-wrap uk-margin-small-top"></div>
        </div>
        <div class="jlz-fs-controls">
          <button class="jlz-fs-play uk-icon-button" type="button" aria-label="Play/Pause">
            <span uk-icon="icon: play; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <button class="jlz-fs-mute uk-icon-button" type="button" aria-label="Mute/Unmute" aria-pressed="true">
            <span uk-icon="icon: muted; ratio: 1.2" aria-hidden="true"></span>
          </button>
          <input class="jlz-fs-seek uk-range" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek" />
          <span class="jlz-fs-time">0:00 / 0:00</span>
        </div>
      </div>
    `

    document.body.appendChild(this.container)

    // CRITICAL: ensure modal is hidden on init. UIKit3 modal can leave
    // display:flex after creation, making the overlay visible immediately.
    // This inline style is overridden by UIKit3 when show() is called.
    this.container.style.display = 'none'

    // Wire elements
    this.video = this.container.querySelector('.jlz-fs-video')!
    this.posterEl = this.container.querySelector('.jlz-fs-poster')!
    this.playBtn = this.container.querySelector('.jlz-fs-play')!
    this.muteBtn = this.container.querySelector('.jlz-fs-mute')!
    this.seekBar = this.container.querySelector('.jlz-fs-seek')!
    this.timeEl = this.container.querySelector('.jlz-fs-time')!
    this.bigPlay = this.container.querySelector('.jlz-fs-big-play')!
    this.prevBtn = this.container.querySelector('.jlz-fs-prev')!
    this.nextBtn = this.container.querySelector('.jlz-fs-next')!
    this.titleEl = this.container.querySelector('.jlz-fs-title')!
    this.catEl = this.container.querySelector('.jlz-fs-cat')!
    this.descEl = this.container.querySelector('.jlz-fs-desc')!
    this.tagsEl = this.container.querySelector('.jlz-fs-tags')!
    this.counterEl = this.container.querySelector('.jlz-fs-counter')!
    this.controlsEl = this.container.querySelector('.jlz-fs-controls')!

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
    this.bigPlay.addEventListener('click', togglePlay)
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
      this.bigPlay.style.opacity = '0'
      this.posterEl.style.opacity = '0'
      this.playBtn.querySelector('[uk-icon]')?.setAttribute('uk-icon', 'icon: pause; ratio: 1.2')
    })
    this.video.addEventListener('pause', () => {
      this.bigPlay.style.opacity = '1'
      this.playBtn.querySelector('[uk-icon]')?.setAttribute('uk-icon', 'icon: play; ratio: 1.2')
    })
    this.video.addEventListener('timeupdate', () => {
      // Guard: duration is NaN until metadata loads (and stays NaN if no source)
      if (!isFinite(this.video.duration) || this.video.duration === 0) return
      const pct = (this.video.currentTime / this.video.duration) * 100
      const pctStr = String(isNaN(pct) ? 0 : pct)
      this.seekBar.value = pctStr
      this.seekBar.style.setProperty('--jlz-seek-progress', `${pctStr}%`)
      this.updateTimeDisplay()
    })
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay())

    // Seek
    this.seekBar.addEventListener('input', () => {
      // Guard: don't set currentTime if duration is NaN/Infinity/0
      // (happens when video has no source or metadata not loaded yet)
      const duration = this.video.duration
      if (!isFinite(duration) || duration === 0) return
      const pct = Number(this.seekBar.value)
      this.video.currentTime = (pct / 100) * duration
    })

    // Nav buttons
    this.prevBtn.addEventListener('click', () => this.onPrev?.())
    this.nextBtn.addEventListener('click', () => this.onNext?.())

    // UIKit3 modal events
    UIkit.util.on(this.container, 'show', () => {
      this._isOpen = true
      ;(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen = true
      // Autoplay video when modal opens (muted autoplay is allowed by browsers).
      // Only if video has a source — project-mode (poster only) skips this.
      const source = this.video.querySelector('source')
      if (source && source.src) {
        // Guard: only reset currentTime if duration is finite (metadata loaded)
        if (isFinite(this.video.duration)) {
          this.video.currentTime = 0
        }
        // Small delay to let modal animation finish before play()
        setTimeout(() => {
          this.video.play().catch(() => {
            // Autoplay blocked — show big play button for user to click
            this.bigPlay.style.opacity = '1'
          })
        }, 300)
      }
    })
    UIkit.util.on(this.container, 'hide', () => {
      this._isOpen = false
      ;(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen = false
      this.video.pause()
      this.onClose?.()
    })

    // Keyboard: Space (play/pause), ArrowLeft/Right (prev/next)
    // stopImmediatePropagation prevents JoystickNav's window keydown from
    // also firing — without it, ArrowLeft in the overlay simultaneously
    // goes to prev-project AND navigates section to Lab behind the overlay.
    this._keydownHandler = (e: KeyboardEvent) => {
      if (!this._isOpen) return
      if (e.key === ' ') {
        e.preventDefault()
        e.stopImmediatePropagation()
        togglePlay()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopImmediatePropagation()
        this.onPrev?.()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopImmediatePropagation()
        this.onNext?.()
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
    this.timeEl.textContent = `${fmt(this.video.currentTime)} / ${fmt(this.video.duration)}`
  }

  /** Open overlay with given options. */
  open(opts: OverlayOptions): void {
    this._applyOptions(opts)
    UIkit.modal(this.container).show()
  }

  /** Preload content into the overlay WITHOUT showing it.
   *  Used by Experience.ts to preload the first project so card click is
   *  instant. Calling open() instead was a BUG — it called UIkit.modal().show()
   *  which added the uk-open class + fired the 'show' event (setting
   *  window.jlzOverlayOpen=true) even though display:none hid the overlay.
   *  The stale jlzOverlayOpen flag then blocked JoystickNav + BakuCarousel. */
  preload(opts: OverlayOptions): void {
    this._applyOptions(opts)
    // Do NOT call UIkit.modal().show() — stay hidden.
  }

  /** Apply overlay options to the DOM (shared by open + preload). */
  private _applyOptions(opts: OverlayOptions): void {
    // Video source
    const source = this.video.querySelector('source')
    if (opts.videoSrc && source) {
      source.src = opts.videoSrc
      source.setAttribute('type', 'video/mp4')
      this.video.load()
      this.controlsEl.style.display = ''
      this.video.style.display = ''
    } else {
      // No video — poster only mode
      this.controlsEl.style.display = 'none'
      this.video.style.display = 'none'
      this.bigPlay.style.display = 'none'
    }

    // Poster image (first frame / textureUrl)
    if (opts.poster) {
      this.posterEl.style.backgroundImage = `url('${opts.poster}')`
      this.posterEl.style.opacity = '1'
    } else {
      this.posterEl.style.backgroundImage = ''
      this.posterEl.style.opacity = '0'
    }

    // Project info
    if (opts.title) {
      BlurFade.for(this.titleEl).show(0.8, opts.title)
    } else {
      this.titleEl.textContent = ''
    }
    this.catEl.textContent = opts.category ?? ''
    this.descEl.textContent = opts.description ?? ''
    this.counterEl.textContent = opts.counter ?? ''
    this.tagsEl.innerHTML = (opts.tags ?? [])
      .filter(Boolean)
      .map((t) => `<span class="jlz-fs-tag">${t}</span>`)
      .join('')

    // Nav buttons visibility
    this.prevBtn.style.display = opts.hasPrev ? '' : 'none'
    this.nextBtn.style.display = opts.hasNext ? '' : 'none'

    // Reset video state
    if (opts.videoSrc) {
      this.bigPlay.style.display = ''
    }
  }

  close(): void {
    UIkit.modal(this.container).hide()
    // Safety net: clear state synchronously. The UIKit 'hide' event (which
    // also clears these) fires asynchronously after the close animation. If
    // 'hide' fails to fire (UIKit race when show/hide overlap), _isOpen and
    // jlzOverlayOpen stay stuck true — blocking JoystickNav keyboard nav
    // (arrow keys early-return on jlzOverlayOpen) while the FullscreenOverlay
    // keydown handler keeps intercepting ArrowLeft/Right/Space (via _isOpen).
    // The joystick drag still works because pointer handlers don't check
    // these flags. Clearing here guarantees flags are always in sync with
    // the explicit close() call.
    this._isOpen = false
    ;(window as unknown as { jlzOverlayOpen?: boolean }).jlzOverlayOpen = false
    this.video.pause()
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
