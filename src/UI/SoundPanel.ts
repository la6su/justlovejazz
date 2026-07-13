// SoundPanel.ts — Sound toggle button with animated equalizer bars.
//
// Off by default (muted). Click toggles between muted (flat bars) and
// unmuted (animated EQ bars). Dispatches jlz:sound-toggle event which
// Experience.ts listens to call AudioSystem.setMuted().
//
// Visual:
//   - 4 vertical bars (spans) inside a button
//   - Muted: bars flat (height: 30% each, static)
//   - Unmuted: bars animate (CSS keyframes, staggered delays)
//   - Accent color (neon-lime) on unmuted, muted gray on muted
//
// Placement: fixed bottom-right, above joystick (z-index high).
// Accessible: aria-pressed, aria-label, keyboard focusable.

const EQ_BAR_COUNT = 4

export class SoundPanel {
  private btn: HTMLButtonElement
  private bars: HTMLSpanElement[] = []
  private muted = true // default OFF (user must opt in)

  constructor() {
    this.btn = document.createElement('button')
    this.btn.type = 'button'
    this.btn.id = 'jlz-sound-toggle'
    this.btn.className = 'jlz-sound-toggle'
    this.btn.setAttribute('aria-label', 'Toggle sound')
    this.btn.setAttribute('aria-pressed', 'false')
    this.btn.title = 'Sound: off'

    // Create 4 equalizer bars
    for (let i = 0; i < EQ_BAR_COUNT; i++) {
      const bar = document.createElement('span')
      bar.className = 'jlz-sound-bar'
      bar.style.animationDelay = `${i * 150}ms`
      this.bars.push(bar)
      this.btn.appendChild(bar)
    }

    // Start muted (flat bars)
    this.btn.classList.add('is-muted')

    this.btn.addEventListener('click', this.toggle)

    // Insert into DOM (deferred if body not ready)
    if (document.body) {
      document.body.appendChild(this.btn)
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.btn)
      }, { once: true })
    }
  }

  /** Toggle mute state. Dispatches jlz:sound-toggle event. */
  private toggle = (): void => {
    this.muted = !this.muted

    this.btn.setAttribute('aria-pressed', String(!this.muted))
    this.btn.title = `Sound: ${this.muted ? 'off' : 'on'}`

    if (this.muted) {
      this.btn.classList.add('is-muted')
      this.btn.classList.remove('is-playing')
      // Pause animations
      this.bars.forEach(b => { b.style.animationPlayState = 'paused' })
    } else {
      this.btn.classList.remove('is-muted')
      this.btn.classList.add('is-playing')
      // Resume animations
      this.bars.forEach(b => { b.style.animationPlayState = 'running' })
    }

    // Dispatch event for Experience.ts to call AudioSystem.setMuted()
    window.dispatchEvent(new CustomEvent('jlz:sound-toggle', {
      detail: { muted: this.muted },
    }))
  }

  /** External mute control (e.g., from UIMenu). Syncs UI without re-dispatching. */
  setMuted(muted: boolean): void {
    if (this.muted === muted) return
    this.muted = muted
    this.btn.setAttribute('aria-pressed', String(!muted))
    this.btn.title = `Sound: ${muted ? 'off' : 'on'}`
    if (muted) {
      this.btn.classList.add('is-muted')
      this.btn.classList.remove('is-playing')
      this.bars.forEach(b => { b.style.animationPlayState = 'paused' })
    } else {
      this.btn.classList.remove('is-muted')
      this.btn.classList.add('is-playing')
      this.bars.forEach(b => { b.style.animationPlayState = 'running' })
    }
  }

  /** Clean up — remove from DOM, remove listeners. */
  dispose(): void {
    this.btn.removeEventListener('click', this.toggle)
    this.btn.remove()
  }
}
