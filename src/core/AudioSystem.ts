// AudioSystem.ts — Web Audio API analyser for audio-reactive visuals.
//
// Provides bass/mid/treble frequency bands (0..1). Must be started
// after a user gesture (browser autoplay policy).

export class AudioSystem {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode | null = null
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0))
  private _bass = 0
  private _mid = 0
  private _treble = 0
  private _started = false

  get started(): boolean {
    return this._started
  }

  setMuted(muted: boolean): void {
    if (this.gain && this.ctx) {
      this.gain.gain.setValueAtTime(muted ? 0 : 0.3, this.ctx.currentTime)
    }
  }

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

  update(): void {
    if (!this.analyser || !this._started) return
    this.analyser.getByteFrequencyData(this.freqData)

    const bins = this.freqData.length
    const bassEnd = Math.floor(bins * 0.15)
    const midEnd = Math.floor(bins * 0.5)

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
  }

  getBass(): number { return this._bass }
  getMid(): number { return this._mid }
  getTreble(): number { return this._treble }

  dispose(): void {
    if (this.source) {
      try { this.source.stop() } catch { /* already stopped */ }
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
