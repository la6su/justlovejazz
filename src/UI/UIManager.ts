import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
import { SoundPanel } from './SoundPanel'

export class UIManager {
  public soundPanel: SoundPanel | null = null

  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }

  /** Initialize UI components (call after DOM ready). */
  init(): void {
    this.soundPanel = new SoundPanel()
  }

  /** Clean up UI components. */
  dispose(): void {
    this.soundPanel?.dispose()
    this.soundPanel = null
  }
}
