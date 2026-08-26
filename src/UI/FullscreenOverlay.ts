// FullscreenOverlay.ts — One UIkit fullscreen shell with two explicit media modes.
//
// Replaces both ShowreelModal (video-only) and ProjectOverlay (project-info-only).
// Single overlay with:
//   - Video element + custom controls (play/pause, mute, seek, time)
//   - Poster image (first frame / textureUrl) shown before play
//   - Project info (title, category, description, tags, counter)
//   - Prev/next navigation arrows (optional)
//   - UIKit3 uk-modal base (Esc to close, bg-close, focus trap)
//
// Showreel owns the only video source. Works uses one decoded still that
// visually replaces the already-expanded WebGL plane after its TSL handoff.

import UIkit from 'uikit'
import { BlurFade } from '../Experience/BlurFade'
import { eventBus } from '../core/EventBus'
import { prefersReducedMotion } from '../core/motionPolicy'

export interface OverlayOptions {
  mode?: 'video' | 'image'
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
  /** Called when the overlay closes (per-open, not a persistent handler). */
  onClose?: () => void
}

export class FullscreenOverlay {
  private container: HTMLDivElement
  private video: HTMLVideoElement
  private posterEl: HTMLDivElement
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
  private _keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private _focusTrapHandler: ((e: FocusEvent) => void) | null = null
  private _lastShiftTab = false
  private _autoplayTimer: ReturnType<typeof setTimeout> | null = null
  private _enterFallback: number | null = null
  private _shownRevealFrame: number | null = null
  private _videoRevealFrame: number | null = null
  private _videoFrameCallbackId: number | null = null
  private _posterRequestId = 0
  private _posterUrl: string | null = null
  private _mediaGeneration = 0
  private readonly _listeners = new AbortController()

  public onPrev: (() => void) | null = null
  public onNext: (() => void) | null = null
  private _perOpenOnClose: (() => void) | null = null
  private _restoreFocus: HTMLElement | null = null
  private _hideHandled = false

  private readonly _onModalHide = (): void => {
    this.handleHide()
  }

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'jlz-fs-overlay'
    this.container.setAttribute('uk-modal', 'bg-close: true; esc-close: true; stack: false')
    this.container.setAttribute('data-no-magnetic', '')
    this.container.className = 'jlz-fs-overlay uk-modal uk-modal-full uk-light'

    this.container.innerHTML = `
      <div class="uk-modal-dialog jlz-fs-dialog">
        <button class="uk-modal-close-full uk-close-large jlz-fs-close" type="button" aria-label="Close">
          <span uk-icon="icon: close; ratio: 1.25" aria-hidden="true"></span>
        </button>
        <header class="jlz-fs-meta uk-flex uk-flex-between uk-flex-bottom">
          <div>
            <div class="jlz-fs-cat uk-text-meta uk-text-uppercase"></div>
            <h2 class="jlz-fs-title uk-heading-small uk-margin-remove"></h2>
            <p class="jlz-fs-desc uk-visible@s uk-text-truncate uk-margin-small-top uk-margin-remove-bottom"></p>
          </div>
          <div class="jlz-fs-meta-end uk-visible@s uk-text-right">
            <div class="jlz-fs-counter uk-text-meta"></div>
            <div class="jlz-fs-tags uk-flex uk-flex-wrap uk-flex-right uk-margin-small-top"></div>
          </div>
        </header>
        <main class="jlz-fs-media-stage uk-position-relative">
          <div class="jlz-fs-poster uk-position-cover" aria-hidden="true"></div>
          <video class="jlz-fs-video uk-position-cover" preload="auto" playsinline muted loop>
            <source src="" type="video/mp4" />
          </video>
          <button class="jlz-fs-big-play uk-position-cover uk-flex uk-flex-middle uk-flex-center" type="button" aria-label="Play video">
            <span class="jlz-fs-big-play__icon uk-flex uk-flex-middle uk-flex-center" uk-icon="icon: play; ratio: 1.4" aria-hidden="true"></span>
          </button>
        </main>
        <footer class="jlz-fs-controls uk-flex uk-flex-middle">
          <button class="jlz-fs-mute uk-icon-button is-muted" type="button" aria-label="Mute/Unmute" aria-pressed="true">
            <span uk-icon="icon: muted" aria-hidden="true"></span>
          </button>
          <input class="jlz-fs-seek uk-flex-1 uk-range" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek" />
          <span class="jlz-fs-time uk-visible@s uk-text-meta">0:00 / 0:00</span>
        </footer>
        <button class="jlz-nav-arrow jlz-fs-prev uk-flex uk-flex-middle uk-flex-center" type="button" aria-label="Previous">
          <span uk-icon="icon: slidenav-previous-large" aria-hidden="true"></span>
        </button>
        <button class="jlz-nav-arrow jlz-fs-next uk-flex uk-flex-middle uk-flex-center" type="button" aria-label="Next">
          <span uk-icon="icon: slidenav-next-large" aria-hidden="true"></span>
        </button>
      </div>
    `

    document.body.appendChild(this.container)

    // Wire elements
    this.video = this.container.querySelector('.jlz-fs-video')!
    this.posterEl = this.container.querySelector('.jlz-fs-poster')!
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
        this.video.play().catch(() => {
          /* autoplay blocked */
        })
      } else {
        this.video.pause()
      }
    }
    this.bigPlay.addEventListener('click', togglePlay, { signal: this._listeners.signal })
    this.video.addEventListener('click', togglePlay, { signal: this._listeners.signal })

    // Mute toggle — swap uk-icon between muted/sound
    this.muteBtn.addEventListener(
      'click',
      () => {
        this.video.muted = !this.video.muted
        this.muteBtn.setAttribute('aria-pressed', String(this.video.muted))
        this.muteBtn.classList.toggle('is-muted', this.video.muted)
        const muteIcon = this.muteBtn.querySelector('[uk-icon]')
        if (muteIcon)
          muteIcon.setAttribute('uk-icon', `icon: ${this.video.muted ? 'muted' : 'sound'}`)
      },
      { signal: this._listeners.signal },
    )

    // Video events
    this.video.addEventListener(
      'playing',
      () => {
        this.container.classList.add('is-playing')
        this.bigPlay.style.opacity = '0'
        this.revealVideoAfterFirstFrame()
      },
      { signal: this._listeners.signal },
    )
    this.video.addEventListener(
      'pause',
      () => {
        this.container.classList.remove('is-playing')
        this.bigPlay.style.opacity = '1'
      },
      { signal: this._listeners.signal },
    )
    this.video.addEventListener(
      'timeupdate',
      () => {
        // Guard: duration is NaN until metadata loads (and stays NaN if no source)
        if (!isFinite(this.video.duration) || this.video.duration === 0) return
        const pct = (this.video.currentTime / this.video.duration) * 100
        const pctStr = String(isNaN(pct) ? 0 : pct)
        this.seekBar.value = pctStr
        this.seekBar.style.setProperty('--jlz-seek-progress', `${pctStr}%`)
        this.updateTimeDisplay()
      },
      { signal: this._listeners.signal },
    )
    this.video.addEventListener('loadedmetadata', () => this.updateTimeDisplay(), {
      signal: this._listeners.signal,
    })

    // Seek
    this.seekBar.addEventListener(
      'input',
      () => {
        // Guard: don't set currentTime if duration is NaN/Infinity/0
        // (happens when video has no source or metadata not loaded yet)
        const duration = this.video.duration
        if (!isFinite(duration) || duration === 0) return
        const pct = Number(this.seekBar.value)
        this.video.currentTime = (pct / 100) * duration
      },
      { signal: this._listeners.signal },
    )

    // Nav buttons
    this.prevBtn.addEventListener('click', () => this.navigate(-1), {
      signal: this._listeners.signal,
    })
    this.nextBtn.addEventListener('click', () => this.navigate(1), {
      signal: this._listeners.signal,
    })

    // UIKit3 modal events — uk-open is the authoritative state. UIkit adds it
    // on show and removes it on hide; isOpen reads it directly. No custom
    // enter/opening flags needed.
    UIkit.util.on(this.container, 'show', () => {
      // Store the element that had focus before the overlay opened so we can
      // restore it on close (B-2 a11y fix).
      if (document.activeElement instanceof HTMLElement) {
        this._restoreFocus = document.activeElement
      }
      document.addEventListener('keydown', this._keydownHandler!)
      document.addEventListener('focusin', this._focusTrapHandler!)
      // Double-rAF fallback: more reliable than fixed timeout.
      // Fires after 2 frames (~32ms at 60Hz), giving UIkit time to
      // process transitions without the arbitrariness of a 120ms guess.
      if (!this._enterFallback) {
        this._enterFallback = requestAnimationFrame(() => {
          this._enterFallback = requestAnimationFrame(() => {
            this._enterFallback = null
            if (!this.container.classList.contains('is-entered')) {
              this.container.classList.add('is-entered')
              this._tryAutoplay()
            }
          })
        })
      }
    })
    UIkit.util.on(this.container, 'shown', () => {
      // Clear the fallback — UIkit confirmed the modal is shown.
      if (this._enterFallback) {
        cancelAnimationFrame(this._enterFallback)
        this._enterFallback = null
      }
      // Trigger the CSS reveal transition (clip-path + scale + opacity).
      const generation = this._mediaGeneration
      this._shownRevealFrame = requestAnimationFrame(() => {
        this._shownRevealFrame = null
        if (generation !== this._mediaGeneration || !this.container.isConnected) return
        this.container.classList.add('is-entered')
      })
      // Move focus into the modal so keyboard users are not stranded on the
      // trigger button behind the overlay (B-2 a11y fix). Focus the close
      // button by default; in video mode the big-play is a better landing.
      const target = this.container.classList.contains('is-video-mode')
        ? this.bigPlay
        : this.container.querySelector<HTMLElement>('.jlz-fs-close')
      target?.focus({ preventScroll: true })
      this._tryAutoplay()
    })
    UIkit.util.on(this.container, 'hide', this._onModalHide)
    // Keyboard: Space (play/pause), ArrowLeft/Right (prev/next)
    // Attached to document on 'show', removed on 'hide' (see above).
    // stopImmediatePropagation prevents CinematicNav's window keydown from
    // also firing, so project arrows do not move the story behind the modal.
    this._keydownHandler = (e: KeyboardEvent) => {
      // Track Shift+Tab so the focus trap can wrap in the correct direction.
      if (e.key === 'Tab') this._lastShiftTab = e.shiftKey
      if (e.key === ' ') {
        if (!this.container.classList.contains('is-video-mode')) return
        e.preventDefault()
        e.stopImmediatePropagation()
        togglePlay()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopImmediatePropagation()
        this.navigate(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopImmediatePropagation()
        this.navigate(1)
      }
    }

    // Focus trap: keep Tab/Shift+Tab within the overlay dialog.
    // Without this, keyboard users can Tab out of the modal into
    // elements behind it. UIkit 3 modal does NOT enforce a focus trap.
    this._focusTrapHandler = (e: FocusEvent) => {
      const dialog = this.container.querySelector<HTMLElement>('.uk-modal-dialog')
      if (!dialog) return
      if (dialog.contains(e.target as Node)) return
      // Focus escaped the dialog — route it back.
      e.preventDefault()
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      // If Shift+Tab on the first element → wrap to the last; otherwise → first.
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      ;(this._lastShiftTab ? last : first).focus({ preventScroll: true })
    }
  }

  private handleHide(): void {
    if (this._hideHandled) return
    this._hideHandled = true
    if (this._enterFallback) {
      cancelAnimationFrame(this._enterFallback)
      this._enterFallback = null
    }
    if (this._shownRevealFrame) {
      cancelAnimationFrame(this._shownRevealFrame)
      this._shownRevealFrame = null
    }
    this._mediaGeneration += 1
    this._cancelVideoReveal()
    if (this._autoplayTimer) {
      clearTimeout(this._autoplayTimer)
      this._autoplayTimer = null
    }
    this.container.classList.remove('is-playing')
    this.container.classList.remove('is-entered')
    this.video.pause()
    // Close ownership is per-open, so a completed cycle cannot leak a
    // callback into the next media item.
    this._perOpenOnClose?.()
    this._perOpenOnClose = null
    // Restore focus to the trigger that opened the overlay (B-2 a11y fix).
    this._restoreFocus?.focus({ preventScroll: true })
    this._restoreFocus = null
    // Remove keyboard listener when modal closes — clean lifecycle, no
    // stale listeners intercepting events while the overlay is hidden.
    document.removeEventListener('keydown', this._keydownHandler!)
    if (this._focusTrapHandler) {
      document.removeEventListener('focusin', this._focusTrapHandler)
    }
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

  private navigate(direction: -1 | 1): void {
    if (direction < 0) this.onPrev?.()
    else this.onNext?.()
    eventBus.emit('jlz:project-navigate', { direction })
  }

  /**
   * `play`/`playing` can fire before the browser has composited a video
   * frame. Keep the decoded poster in place until that first frame arrives so
   * the handoff never exposes the video element's black backing surface.
   */
  private revealVideoAfterFirstFrame(): void {
    this._cancelVideoReveal()
    const generation = this._mediaGeneration
    const reveal = () => {
      this._videoFrameCallbackId = null
      if (generation !== this._mediaGeneration) return
      this.posterEl.style.opacity = '0'
    }
    const videoWithFrameCallback = this.video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: VideoFrameRequestCallback) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }

    if (videoWithFrameCallback.requestVideoFrameCallback) {
      this._videoFrameCallbackId = videoWithFrameCallback.requestVideoFrameCallback(reveal)
      return
    }

    this._videoRevealFrame = requestAnimationFrame(() => {
      this._videoRevealFrame = null
      if (generation !== this._mediaGeneration) return
      this._videoRevealFrame = requestAnimationFrame(() => {
        this._videoRevealFrame = null
        reveal()
      })
    })
  }

  private _cancelVideoReveal(): void {
    if (this._videoRevealFrame !== null) {
      cancelAnimationFrame(this._videoRevealFrame)
      this._videoRevealFrame = null
    }
    if (this._videoFrameCallbackId !== null) {
      const video = this.video as HTMLVideoElement & {
        cancelVideoFrameCallback?: (handle: number) => void
      }
      video.cancelVideoFrameCallback?.(this._videoFrameCallbackId)
      this._videoFrameCallbackId = null
    }
  }

  /** Open overlay with given options. */
  open(opts: OverlayOptions): void {
    this._applyOptions(opts)
    UIkit.modal(this.container).show()
  }
  /** Preload content into the overlay WITHOUT showing it.
   *  Used by Experience.ts to preload the first project so card click is
   *  instant. preload() only sets content; the uk-open class is NOT added,
   *  so the overlay stays hidden (CSS: .jlz-fs-overlay:not(.uk-open){display:none}). */
  preload(opts: OverlayOptions): void {
    // Decode the visual poster, but keep video user-triggered so initial page
    // work never fetches a case film before the visitor opens it.
    this._applyOptions({ ...opts, videoSrc: undefined })
    // Do NOT call UIkit.modal().show() — stay hidden.
  }

  /** Try to autoplay the video if the overlay is in video mode.
   *  Shared by the 'shown' handler and the double-rAF fallback. */
  private _tryAutoplay(): void {
    const source = this.video.querySelector('source')
    if (this.container.classList.contains('is-video-mode') && source && source.src) {
      if (isFinite(this.video.duration)) {
        this.video.currentTime = 0
      }
      if (this._autoplayTimer) clearTimeout(this._autoplayTimer)
      this._autoplayTimer = setTimeout(() => {
        this._autoplayTimer = null
        this.video.play().catch(() => {
          this.bigPlay.style.opacity = '1'
        })
      }, 0)
    }
  }

  /** Apply overlay options to the DOM (shared by open + preload). */
  private _applyOptions(opts: OverlayOptions): void {
    this._hideHandled = false
    this._cancelVideoReveal()
    this._mediaGeneration += 1
    // Store the per-open close callback (called in the 'hide' handler).
    this._perOpenOnClose = opts.onClose ?? null
    const mode = opts.mode ?? (opts.videoSrc ? 'video' : 'image')
    const videoMode = mode === 'video'
    this.container.classList.toggle('is-image-mode', !videoMode)
    this.container.classList.toggle('is-video-mode', videoMode)
    // Video source
    const source = this.video.querySelector('source')
    if (videoMode && opts.videoSrc && source) {
      source.src = opts.videoSrc
      source.setAttribute('type', 'video/mp4')
      this.video.load()
      this.controlsEl.style.display = ''
      this.video.style.display = ''
    } else {
      // Works image mode never inherits or autoplays the showreel source.
      if (source) {
        source.removeAttribute('src')
        this.video.load()
      }
      this.controlsEl.style.display = 'none'
      this.video.style.display = 'none'
      this.bigPlay.style.display = 'none'
    }

    this.setPoster(opts.poster)

    // Project info
    if (opts.title) {
      if (prefersReducedMotion()) {
        this.titleEl.textContent = opts.title
        this.titleEl.setAttribute('aria-label', opts.title)
      } else {
        BlurFade.for(this.titleEl).show(0.8, opts.title)
      }
    } else {
      this.titleEl.textContent = ''
    }
    this.catEl.textContent = opts.category ?? ''
    this.descEl.textContent = opts.description ?? ''
    this.counterEl.textContent = opts.counter ?? ''
    this.tagsEl.innerHTML = (opts.tags ?? [])
      .filter(Boolean)
      .map((t) => `<span class="jlz-fs-tag uk-text-meta uk-text-uppercase">${t}</span>`)
      .join('')

    // Nav buttons visibility
    this.prevBtn.style.display = opts.hasPrev ? '' : 'none'
    this.nextBtn.style.display = opts.hasNext ? '' : 'none'

    // Reset video state
    if (videoMode && opts.videoSrc) {
      this.bigPlay.style.display = ''
      // D-8 fix: reset opacity — a previous video's 'play' event set opacity
      // to '0', and it was never restored. On second open, display='' but
      // opacity stayed '0' → play button invisible. Reset to '1' so the user
      // can see it to start the video.
      this.bigPlay.style.opacity = '1'
    }
  }

  /**
   * Decode the DOM poster before exposing it. During a plane-origin handoff
   * the modal stays transparent until this succeeds, leaving the already
   * fullscreen Three.js plane visible instead of a transient black frame.
   */
  private setPoster(poster?: string): void {
    if (poster === this._posterUrl && this.container.classList.contains('is-poster-ready')) {
      this.posterEl.style.opacity = '1'
      return
    }

    const requestId = ++this._posterRequestId
    this._posterUrl = poster ?? null
    this.container.classList.remove('is-poster-ready')
    this.posterEl.style.backgroundImage = ''
    this.posterEl.style.opacity = '0'
    if (!poster) return

    const image = new Image()
    image.decoding = 'async'
    const reveal = () => {
      if (requestId !== this._posterRequestId) return
      this.posterEl.style.backgroundImage = `url('${poster}')`
      this.posterEl.style.opacity = '1'
      this.container.classList.add('is-poster-ready')
    }
    image.addEventListener(
      'load',
      () => {
        void image
          .decode()
          .catch(() => undefined)
          .then(reveal)
      },
      { once: true, signal: this._listeners.signal },
    )
    image.src = poster
  }

  close(): void {
    UIkit.modal(this.container).hide()
    this.video.pause()
  }

  /** Whether the UIKit modal is currently open (uk-open class present).
   *  This is UIKit's native state — always accurate, no custom flag to sync. */
  get isOpen(): boolean {
    return this.container.classList.contains('uk-open')
  }

  dispose(): void {
    if (this.isOpen) {
      const modal = UIkit.modal(this.container)
      modal.hide()
      // UIkit normally emits `hide`, but a teardown can race its transition.
      // Run the same idempotent cleanup synchronously before destroying the
      // component so body scroll, focus and the per-open callback are settled.
      this.handleHide()
    }
    this._listeners.abort()
    this._posterRequestId += 1
    this._mediaGeneration += 1
    this._cancelVideoReveal()
    if (this._autoplayTimer) {
      clearTimeout(this._autoplayTimer)
      this._autoplayTimer = null
    }
    if (this._enterFallback) {
      cancelAnimationFrame(this._enterFallback)
      this._enterFallback = null
    }
    if (this._shownRevealFrame) {
      cancelAnimationFrame(this._shownRevealFrame)
      this._shownRevealFrame = null
    }
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
    if (this._focusTrapHandler) {
      document.removeEventListener('focusin', this._focusTrapHandler)
      this._focusTrapHandler = null
    }
    UIkit.modal(this.container).$destroy()
    this.container.remove()
  }
}
