import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { ShowreelModal } from './ShowreelModal'
import { wireMenuToolbarGlobals } from '../sections/nav/template'

export class UIManager {
  public showreelModal: ShowreelModal | null = null
  private _showreelHandler: (() => void) | null = null

  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  /** Initialize UI components (call after DOM ready). */
  init(): void {
    this.showreelModal = new ShowreelModal()

    // Wire global listeners for the menu-overlay config toolbar
    // (theme toggle + sound toggle). Per-render init happens in router.ts.
    wireMenuToolbarGlobals()

    // Wire showreel play button (intro section)
    this._showreelHandler = () => {
      this.showreelModal?.open()
    }
    // Use event delegation — button may not exist yet (home page only)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.closest('#jlz-showreel-trigger')) {
        e.preventDefault()
        this._showreelHandler?.()
      }
    })
  }

  /** Clean up UI components. */
  dispose(): void {
    this.showreelModal?.dispose()
    this.showreelModal = null
  }
}
