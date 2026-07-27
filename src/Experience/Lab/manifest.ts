import type * as THREE from 'three'

/**
 * A Lab experiment owns only the object it adds to the shared world. It must
 * not create a renderer, environment map or an independent render loop.
 */
export interface LabExperimentObject extends THREE.Object3D {
  dispose(): void
}

export interface LabExperiment {
  id: string
  page: 'lab'
  load: () => Promise<LabExperimentObject>
}

/**
 * Accepted experiments are listed here before they can enter the shared scene.
 * The catalogue content may describe future research, but only this manifest
 * is allowed to allocate route-specific GPU resources.
 */
export const labExperiments: readonly LabExperiment[] = [
  {
    id: 'gamepad',
    page: 'lab',
    async load() {
      const { LabGamepad } = await import('../World/LabGamepad')
      return new LabGamepad()
    },
  },
]

export function getLabExperiment(page: string): LabExperiment | undefined {
  return labExperiments.find((experiment) => experiment.page === page)
}
