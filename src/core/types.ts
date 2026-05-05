
export interface Project {
  id: string;
  title: string;
  description: string;
  textureUrl: string;
  color: string;
  viewPosition: { x: number, y: number, z: number };
  viewLookAt: { x: number, y: number, z: number };
}

export enum ViewState {
  LIST = 'list',
  TRANSITIONING = 'transitioning',
  FULLSCREEN = 'fullscreen'
}
