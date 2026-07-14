import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { FullscreenOverlay } from './FullscreenOverlay'
import { wireMenuToolbarGlobals } from '../sections/nav/template'

export class UIManager {
  public overlay: FullscreenOverlay | null = null
  private _showreelHandler: (() => void) | null = null
  // A-4 fix: store document click listener as field so dispose() can remove it
  // (was anonymous → leaked on HMR, accumulated one listener per UIManager re-init).
  private _documentClickHandler: ((e: MouseEvent) => void) | null = null

  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  /** Initialize UI components (call after DOM ready). */
  init(): void {
    this.overlay = new FullscreenOverlay()

    // Wire global listeners for the menu-overlay config toolbar
    // (theme toggle + sound toggle). Per-render init happens in router.ts.
    wireMenuToolbarGlobals()

    // Wire showreel play button (intro section) — opens overlay in showreel mode
    this._showreelHandler = () => {
      this.overlay?.open({
        videoSrc: '/assets/video/coming-soon.mp4',
        title: 'Showreel',
        category: '2026 · COMING SOON',
      })
    }
    // A-4 fix: store as field, remove in dispose() (was anonymous → HMR leak).
    this._documentClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('#jlz-showreel-trigger')) {
        e.preventDefault()
        this._showreelHandler?.()
      }
    }
    document.addEventListener('click', this._documentClickHandler)
  }

  /** Clean up UI components. */
  dispose(): void {
    // A-4 fix: remove the document click listener stored as field
    if (this._documentClickHandler) {
      document.removeEventListener('click', this._documentClickHandler)
      this._documentClickHandler = null
    }
    this.overlay?.dispose()
    this.overlay = null
  }
}
