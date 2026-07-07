// AudioSystem.ts — Web Audio API analyser for audio-reactive visuals.
//
// Provides bass/mid/treble frequency bands (0..1) that can drive worldDNA
// uniforms, material properties, or any visual parameter. Must be started
// after a user gesture (browser autoplay policy).
//
// Usage:
//   const audio = new AudioSystem()
//   audio.start()          // after user click/keypress
//   audio.load('/track.mp3') // optional: load a track
//   audio.getBass()        // 0..1 bass amplitude
//   audio.update()         // call each frame to refresh bands

export class AudioSystem {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0))
  private _bass = 0
  private _mid = 0
  private _treble = 0
  private _level = 0
  private _started = false
  private _muted = false

  /** Whether the audio system is initialized. */
  get started(): boolean {
    return this._started
  }

  /** Initialize the AudioContext + AnalyserNode. Call after user gesture. */
  start(): void {
    if (this._started) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
      this.gain = this.ctx.createGain()
      this.gain.gain.value = 0.3
      this.gain.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      this._started = true
    } catch {
      console.warn('[AudioSystem] Web Audio API not available — audio-reactive disabled')
    }
  }

  /** Load and play an audio track. Returns a promise that resolves when playing. */
  async load(url: string): Promise<void> {
    if (!this.ctx || !this.gain) return
    try {
      const res = await fetch(url)
      const buf = await res.arrayBuffer()
      const audioBuf = await this.ctx.decodeAudioData(buf)
      if (this.source) {
        this.source.stop()
        this.source.disconnect()
      }
      this.source = this.ctx.createBufferSource()
      this.source.buffer = audioBuf
      this.source.loop = true
      this.source.connect(this.gain)
      this.source.start()
    } catch (e) {
      console.warn('[AudioSystem] Failed to load audio:', url, e)
    }
  }

  /** Connect microphone input (for live audio-reactive). Requires permission. */
  async connectMicrophone(): Promise<void> {
    if (!this.ctx || !this.gain) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = this.ctx.createMediaStreamSource(stream)
      source.connect(this.gain)
      // Don't connect to destination (avoid feedback)
      this.gain.disconnect()
      this.gain.connect(this.analyser!)
    } catch (e) {
      console.warn('[AudioSystem] Microphone access denied:', e)
    }
  }

  /** Update frequency bands. Call each frame. */
  update(): void {
    if (!this.analyser || !this._started) return
    this.analyser.getByteFrequencyData(this.freqData)

    const bins = this.freqData.length
    // Bass: 0-15% of bins (low frequencies)
    const bassEnd = Math.floor(bins * 0.15)
    // Mid: 15-50%
    const midEnd = Math.floor(bins * 0.5)
    // Treble: 50-100%

    let bassSum = 0
    let midSum = 0
    let trebleSum = 0
    for (let i = 0; i < bins; i++) {
      const v = this.freqData[i]! / 255
      if (i < bassEnd) bassSum += v
      else if (i < midEnd) midSum += v
      else trebleSum += v
    }

    this._bass = bassSum / Math.max(1, bassEnd)
    this._mid = midSum / Math.max(1, midEnd - bassEnd)
    this._treble = trebleSum / Math.max(1, bins - midEnd)
    this._level = (this._bass + this._mid + this._treble) / 3
  }

  /** Bass amplitude (0..1). */
  getBass(): number {
    return this._bass
  }
  /** Mid amplitude (0..1). */
  getMid(): number {
    return this._mid
  }
  /** Treble amplitude (0..1). */
  getTreble(): number {
    return this._treble
  }
  /** Overall level (0..1). */
  getLevel(): number {
    return this._level
  }

  /** Mute/unmute audio output (analyser still runs). */
  setMuted(muted: boolean): void {
    this._muted = muted
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(muted ? 0 : 0.3, this.ctx.currentTime)
    }
  }
  get muted(): boolean {
    return this._muted
  }

  /** Dispose all audio resources. */
  dispose(): void {
    if (this.source) {
      try {
        this.source.stop()
      } catch {
        /* already stopped */
      }
      this.source.disconnect()
      this.source = null
    }
    this.analyser?.disconnect()
    this.gain?.disconnect()
    this.ctx?.close()
    this.ctx = null
    this.analyser = null
    this.gain = null
    this._started = false
  }
}
