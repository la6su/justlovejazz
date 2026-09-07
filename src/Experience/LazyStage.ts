// src/Experience/LazyStage.ts — generic lazy-stage lifecycle core.
//
// Every route-owned stage (works plane, contact typography/halo/cyprus,
// manifesto ink) used to repeat the same ~30-line ensure/dispose flow inside
// Experience: request counter, promise memoization, stale-guard, attach,
// post-init wiring, failure containment with an exact per-stage release
// order. This module owns that flow once, over the flat owner fields each
// stage already keeps on Experience (the layout is pinned by the stage
// lifecycle tests that seed it directly, so the state stays where it is).
//
// The per-stage variation is expressed as a contract:
//   create   — construct directly or after a dynamic import
//   load     — optional awaitable init after the instance joins the scene
//   configure— route wiring applied once the stale guard passes
//   attach   — scene insertion
//   release  — teardown in the exact per-stage order (dispose ↔ detach)
//   onDispose— extra invalidation (e.g. the Cyprus active flag)

import type { Object3D } from 'three'

/** Function-backed owner state over the flat fields each lazy stage keeps on
 *  Experience. Arrow functions keep the Experience `this` lexical, so the
 *  wiring needs no `this` aliasing. */
export interface LazyStageOwner<T> {
  getStage: () => T | null
  setStage: (stage: T | null) => void
  getPromise: () => Promise<void> | null
  setPromise: (promise: Promise<void> | null) => void
  /** Live request id, for stale guards. */
  getRequest: () => number
  /** Invalidate any in-flight creation; returns the new request id. */
  advanceRequest: () => number
}

export interface LazyStageContract<T extends Object3D> {
  /** DEV diagnostic label, e.g. `'WorksPlaneStage'`. */
  label: string
  /** Mutable owner state (backed by the Experience flat fields). */
  owner: LazyStageOwner<T>
  /** Produce the instance — synchronously, or after a dynamic import. */
  create: () => T | Promise<T>
  /** Attach the instance to the scene. */
  attach: (stage: T) => void
  /** Optional awaitable init/load after the instance is attached. */
  load?: (stage: T) => Promise<unknown>
  /** Route wiring after the stale guard passes. */
  configure: (stage: T) => void
  /** Release resources in the exact per-stage order (dispose ↔ detach). */
  release: (stage: T) => void
  /** Extra invalidation when the owner is disposed. */
  onDispose?: () => void
}

/**
 * Lazily create, attach, load and wire one stage. The returned promise
 * resolves after configure() (never rejects — failure is contained) and is
 * memoized until the stage settles, fails or is disposed.
 */
export function ensureLazyStage<T extends Object3D>(contract: LazyStageContract<T>): Promise<void> {
  const { owner } = contract
  const memoized = owner.getPromise()
  if (memoized) return memoized
  const request = owner.advanceRequest()

  const fail = (error: unknown, stage: T | null): void => {
    if (stage) contract.release(stage)
    if (request === owner.getRequest()) {
      owner.setStage(null)
      owner.setPromise(null)
    }
    if (import.meta.env.DEV) {
      console.error(`[Experience] ${contract.label} init failed:`, error)
    }
  }

  const settle = (stage: T): void => {
    if (request !== owner.getRequest() || owner.getStage() !== stage) {
      // The route disposed this stage while its init was still in flight.
      // Release the late result too, so resources created after the first
      // dispose are freed as well.
      contract.release(stage)
      return
    }
    contract.configure(stage)
  }

  const created = contract.create()

  if (created instanceof Promise) {
    // The assigned instance must survive into the rejection handler so a
    // failing load still releases exactly the stage that was attached.
    let createdStage: T | null = null
    const settled = created
      .then(async (stage) => {
        if (request !== owner.getRequest()) {
          // Disposed while the module/asset was loading: discard the late
          // construction instead of joining the scene.
          contract.release(stage)
          return null
        }
        createdStage = stage
        owner.setStage(stage)
        contract.attach(stage)
        if (contract.load) await contract.load(stage)
        return stage
      })
      .then(
        (stage) => {
          if (!stage) return
          try {
            settle(stage)
          } catch (error) {
            fail(error, stage)
          }
        },
        (error: unknown) => fail(error, createdStage),
      )
    owner.setPromise(settled)
    return settled
  }

  // Synchronous creation: the instance joins the scene before the first
  // await, matching the eager-attach contract of the works stage.
  const stage = created
  owner.setStage(stage)
  contract.attach(stage)
  const settled = (contract.load ? Promise.resolve(contract.load(stage)) : Promise.resolve()).then(
    () => {
      try {
        settle(stage)
      } catch (error) {
        fail(error, stage)
      }
    },
    (error: unknown) => fail(error, stage),
  )
  owner.setPromise(settled)
  return settled
}

/**
 * Dispose the stage, invalidate any in-flight creation and reset the owner
 * state so a later ensure re-creates it from scratch.
 */
export function disposeLazyStage<T extends Object3D>(contract: LazyStageContract<T>): void {
  const { owner } = contract
  owner.advanceRequest()
  const stage = owner.getStage()
  if (stage) {
    contract.release(stage)
    owner.setStage(null)
  }
  owner.setPromise(null)
  contract.onDispose?.()
}
