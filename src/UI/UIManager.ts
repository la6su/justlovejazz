import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'

export class UIManager {
  constructor() {
    UIkit.use(Icons)
    if (!window.UIkit) {
      window.UIkit = UIkit
    }
  }
}
