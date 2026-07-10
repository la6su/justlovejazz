// Subtitles.ts — Section hints with NoiseText scramble animation.
//
// Merges the old .jlz-eyebrow (static label) + .jlz-hint (bottom flash)
// into one system: the active section's [data-eyebrow] element gets
// populated with a useful hint via NoiseText glitch-reveal animation.
//
// Why merge: the old eyebrow duplicated the title ("> SELECTED WORK" +
// "Works" = redundant). The old bottom .jlz-hint flashed for 4s then
// disappeared. Now the eyebrow shows a USEFUL, actionable hint that
// stays visible — and animates in with the same NoiseText scramble
// effect used for section titles (restored from commit fd6eafa).
//
// Home sections only — content pages keep their static eyebrows
// (jlz:section-change fires on home only).
//
// Synced with 3D section changes via jlz:section-change event.

import { NoiseText } from '../Experience/NoiseText'
import { eventBus, type AppEvents } from '../core/EventBus'

// Useful, actionable hints per section — NOT duplicating the title.
// Keys match `data-section` attribute (see SectionId type in constants.ts).
// The '>' prefix preserves the TUI/terminal eyebrow convention.
const HINTS: Record<string, string> = {
  lab: '> Shader, audio & procedural R&D',
  intro: '> Drag the joystick to explore',
  about: '> Remote · EU · since 2019',
  challenge: '> Drag to spin · Click to open',
  contact: '> Open for new projects',
  process: '> Four phases · one milestone each',
}

export class Subtitles {
  private currentEyebrow: HTMLElement | null = null
  private readonly sectionChangeHandler: (payload: AppEvents['jlz:section-change']) => void

  constructor() {
    this.sectionChangeHandler = (payload) => {
      if (payload?.sectionId) {
        this.show(payload.sectionId)
      }
    }
    eventBus.on('jlz:section-change', this.sectionChangeHandler)
  }

  /** Populate the active section's [data-eyebrow] with the hint via NoiseText.
   *  Finds the eyebrow element inside the section matching sectionId,
   *  then runs NoiseText.for(el).show() — the same glitch-reveal animation
   *  used for section titles (char-by-char stagger with blur + translateY). */
  private show(sectionId: string): void {
    const hint = HINTS[sectionId]
    if (!hint) return

    // Find the eyebrow placeholder inside the active section.
    // Home sections have data-section="lab"|"intro"|... and a [data-eyebrow]
    // child span (empty — text is injected here, not static in the template).
    const section = document.querySelector(`[data-section="${sectionId}"]`)
    const eyebrow = section?.querySelector<HTMLElement>('[data-eyebrow]')
    if (!eyebrow) return

    this.currentEyebrow = eyebrow
    // NoiseText scramble — 0.8s staggered char reveal with blur + rotate.
    // Singleton per element (WeakMap cache in NoiseText.for()).
    NoiseText.for(eyebrow).show(0.8, hint)
  }

  dispose(): void {
    eventBus.off('jlz:section-change', this.sectionChangeHandler)
    if (this.currentEyebrow) {
      NoiseText.for(this.currentEyebrow).hide()
    }
    this.currentEyebrow = null
  }
}
