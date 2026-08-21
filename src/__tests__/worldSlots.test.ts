import { describe, it, expect } from 'vitest'
import {
  WORLD_SLOTS,
  WORLD_SLOT_IDS,
  WORLD_SLOT_COUNT,
  worldSlotAt,
  worldSlotById,
  type WorldSlotId,
} from '../core/worldSlots'
import { getWorldConfigForPage } from '../core/WorldConfig'
import { SplashCube } from '../Experience/World/SplashCube'

/** The former inline literals, kept as the regression baseline. */
const LEGACY_FACE_ROTATIONS = [0, -Math.PI / 2, Math.PI, Math.PI / 2, -Math.PI / 4, Math.PI / 4]

describe('world slot contract', () => {
  it('declares exactly the six canonical slots in stable index order', () => {
    expect(WORLD_SLOT_COUNT).toBe(6)
    expect(WORLD_SLOT_IDS).toEqual(['lab', 'intro', 'about', 'works', 'contact', 'menu'])
    WORLD_SLOTS.forEach((slot, index) => expect(slot.index).toBe(index))
  })

  it('slot 0 is the runtime lab slot with the public Contact finale role', () => {
    expect(worldSlotAt(0).id).toBe('lab')
    expect(worldSlotById('lab').role).toBe('Contact finale')
  })

  it('story ranges tile the track as contiguous fifths from 0 to 6/5', () => {
    for (const slot of WORLD_SLOTS) {
      const [start, end] = slot.range
      expect(end - start).toBeCloseTo(1 / 5)
      if (slot.index > 0) expect(start).toBeCloseTo(WORLD_SLOTS[slot.index - 1]!.range[1]!)
    }
    expect(WORLD_SLOTS[0]!.range[0]).toBe(0)
    expect(WORLD_SLOTS[5]!.range[1]).toBeCloseTo(6 / 5)
  })

  it('DOM anchors match the slot ids', () => {
    for (const slot of WORLD_SLOTS) {
      expect(slot.domSection).toBe(slot.id)
    }
  })

  it('face rotations match the former SplashCube literals', () => {
    const rotations = WORLD_SLOTS.map((slot) => slot.faceRotation)
    expect(rotations).toHaveLength(LEGACY_FACE_ROTATIONS.length)
    rotations.forEach((value, index) => expect(value).toBeCloseTo(LEGACY_FACE_ROTATIONS[index]!))
  })

  it('index lookup clamps out-of-range values', () => {
    expect(worldSlotAt(-3).index).toBe(0)
    expect(worldSlotAt(99).index).toBe(5)
    expect(worldSlotAt(2.9).index).toBe(2)
  })

  it('lookup by id round-trips every slot', () => {
    for (const id of WORLD_SLOT_IDS) {
      expect(worldSlotById(id as WorldSlotId).id).toBe(id)
      expect(worldSlotAt(worldSlotById(id as WorldSlotId).index).id).toBe(id)
    }
  })
})

describe('world slot consumers', () => {
  it('home world config takes DOM anchors and ranges from the tuple', () => {
    const home = getWorldConfigForPage('home')
    expect(home).toHaveLength(WORLD_SLOT_COUNT)
    home.forEach((phase, index) => {
      const slot = worldSlotAt(index)
      expect(phase.domSection).toBe(slot.domSection)
      expect(phase.range).toEqual([...slot.range])
    })
  })

  it('SplashCube face rotations come from the tuple', () => {
    // private static, read through the prototype for the regression check
    const faceRotations = (SplashCube as unknown as { FACE_ROTATIONS: readonly number[] })
      .FACE_ROTATIONS
    expect(faceRotations).toHaveLength(WORLD_SLOT_COUNT)
    faceRotations.forEach((value, index) =>
      expect(value).toBeCloseTo(worldSlotAt(index).faceRotation),
    )
  })

  it('content page scenes reuse the tuple track geometry with their own DOM anchors', () => {
    const works = getWorldConfigForPage('works')
    expect(works).toHaveLength(WORLD_SLOT_COUNT)
    works.forEach((phase, index) => {
      const slot = worldSlotAt(index)
      expect(phase.range).toEqual([...slot.range])
      expect(phase.domSection).toBe(`content-${index}`)
    })
  })
})
