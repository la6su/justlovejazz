// Shared Experience test seed (constructor bypass).
//
// The Experience constructor is heavy (renderer capability detection, UI
// construction), so lifecycle-method tests build a bare instance via
// Object.create(Experience.prototype) and seed exactly the state the tested
// methods touch. The lazy route-owned stages no longer keep field triples on
// Experience — each stage's stage/promise/request state lives inside a
// createLazyStageSlot() slot — so this helper installs a fresh slot per stage
// and routes legacy bag keys (`worksPlaneStage`, `contactCyprusStage`, …)
// into it: a truthy bag value pre-sets the slot's stage reference (fake
// stage objects), a null/undefined value just leaves the fresh slot empty.

import { Experience } from '../Experience/Experience'
import { createLazyStageSlot, type LazyStageSlot } from '../Experience/LazyStage'

export const LAZY_STAGE_SLOT_NAMES = [
  'worksPlane',
  'contactTypography',
  'contactCyprus',
  'contactHalo',
  'manifestoInk',
  'labGamepad',
] as const

export type LazyStageSlotName = (typeof LAZY_STAGE_SLOT_NAMES)[number]

/** Bag keys that route into a lazy-stage slot instead of a plain field. */
const SLOT_KEY_TO_NAME: Record<string, LazyStageSlotName> = {
  worksPlaneStage: 'worksPlane',
  contactTypographyStage: 'contactTypography',
  contactCyprusStage: 'contactCyprus',
  contactHaloStage: 'contactHalo',
  manifestoInkStage: 'manifestoInk',
  labGamepad: 'labGamepad',
}

export interface SeededExperience {
  exp: Experience
  /** Per-stage slots, for live stage reads and request-id assertions.
   *  Stages are `unknown` — tests narrow with the assertions they need. */
  slots: Record<LazyStageSlotName, LazyStageSlot<unknown>>
}

/** Bare Experience for lifecycle-method tests: the heavy constructor is
 *  bypassed and `bag` seeds exactly the state the tested methods touch.
 *  Lazy-stage bag keys are routed into fresh slots (see module header). */
export function seedExperience(bag: Record<string, unknown> = {}): SeededExperience {
  const slots = {
    worksPlane: createLazyStageSlot(),
    contactTypography: createLazyStageSlot(),
    contactCyprus: createLazyStageSlot(),
    contactHalo: createLazyStageSlot(),
    manifestoInk: createLazyStageSlot(),
    labGamepad: createLazyStageSlot(),
  }
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bag)) {
    const slotName = SLOT_KEY_TO_NAME[key]
    if (slotName) {
      if (value != null) slots[slotName].setStage(value)
      continue
    }
    rest[key] = value
  }
  const exp = Object.assign(Object.create(Experience.prototype), rest, {
    _worksPlaneSlot: slots.worksPlane,
    _contactTypographySlot: slots.contactTypography,
    _contactCyprusSlot: slots.contactCyprus,
    _contactHaloSlot: slots.contactHalo,
    _manifestoInkSlot: slots.manifestoInk,
    _labGamepadSlot: slots.labGamepad,
  }) as Experience
  return { exp, slots }
}
