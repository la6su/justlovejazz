
import { GalleryManager } from '../core/GalleryManager';


export class ProjectUISync {
  constructor(private manager: GalleryManager) {
    this.init();
  }

  private init() {
    this.manager.onStateChange = (_state, progress) => {
      this.syncFullscreenUI(progress);
    };
  }



  private syncFullscreenUI(progress: number) {
    const overlay = document.querySelector('.fullscreen-overlay');
    if (overlay) {
      const opacity = Math.max(0, (progress - 0.7) * 3.33); 
      const translateY = (1 - progress) * 30;
      (overlay as HTMLElement).style.opacity = `${opacity}`;
      (overlay as HTMLElement).style.transform = `translateY(${translateY}px)`;
      (overlay as HTMLElement).style.pointerEvents = progress > 0.9 ? 'all' : 'none';
    }
  }
}
