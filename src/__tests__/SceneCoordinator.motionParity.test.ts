import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { SceneCoordinator, type SceneCoordinatorOwners } from '../Experience/SceneCoordinator'
import type { SectionGroups } from '../Experience/Scene/SectionGroups'
import type { ContactCyprusStage } from '../Experience/World/ContactCyprusStage'
import type { ContactTypographyStage } from '../Experience/World/ContactTypographyStage'
import type { WorksPlaneStage } from '../Experience/World/WorksPlaneStage'

function makeCoordinator(matches: boolean, update: ReturnType<typeof vi.fn>): SceneCoordinator {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches } as MediaQueryList),
  })
  const group = new THREE.Group()
  group.userData.particles = { update }
  const owners = {
    ground: () => null,
    sectionGroups: () => ({ groups: [group] }) as unknown as SectionGroups,
    envSphere: () => null,
    baku: () => null,
    particleBurst: () => null,
    drawTrail: () => null,
    carousel: () => null,
    worksPlaneStage: () => null,
    contactTypographyStage: () => null,
    contactCyprusStage: () => null,
    labGamepad: () => null,
  } satisfies SceneCoordinatorOwners
  return Object.assign(Object.create(SceneCoordinator.prototype), {
    owners,
    page: () => 'home',
  }) as SceneCoordinator
}

describe('SceneCoordinator reduced-motion particle parity', () => {
  it('does not advance particle drift when reduced motion is enabled', () => {
    const update = vi.fn()
    const coordinator = makeCoordinator(true, update)

    coordinator.update(0.25)

    expect(update).not.toHaveBeenCalled()
  })

  it('keeps particle drift active when reduced motion is disabled', () => {
    const update = vi.fn()
    const coordinator = makeCoordinator(false, update)

    coordinator.update(0.25)

    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith(0.25)
  })

  it('does not advance route-owned animation clocks on an idle frame', () => {
    const worksSetActive = vi.fn()
    const worksUpdate = vi.fn()
    const typographyUpdate = vi.fn()
    const cyprusUpdate = vi.fn()
    const owners = {
      ground: () => null,
      sectionGroups: () => ({ groups: [] }) as unknown as SectionGroups,
      envSphere: () => null,
      baku: () => null,
      particleBurst: () => null,
      drawTrail: () => null,
      carousel: () => null,
      worksPlaneStage: () =>
        ({ setActive: worksSetActive, update: worksUpdate }) as unknown as WorksPlaneStage,
      contactTypographyStage: () => ({ update: typographyUpdate }) as unknown as ContactTypographyStage,
      contactCyprusStage: () => ({ update: cyprusUpdate }) as unknown as ContactCyprusStage,
      labGamepad: () => null,
    } satisfies SceneCoordinatorOwners
    const coordinator = Object.assign(Object.create(SceneCoordinator.prototype), {
      owners,
      page: () => 'works',
      worksPlaneStageSection: 0,
    }) as SceneCoordinator

    coordinator.update(0.25, false)

    expect(worksSetActive).toHaveBeenCalledWith(true, 0)
    expect(worksUpdate).not.toHaveBeenCalled()
    expect(typographyUpdate).not.toHaveBeenCalled()
    expect(cyprusUpdate).not.toHaveBeenCalled()
  })
})
