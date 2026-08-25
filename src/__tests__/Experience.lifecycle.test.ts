import { describe, expect, it } from 'vitest'
import { Experience } from '../Experience/Experience'

type LifecycleProbe = {
  lifecycleToken: () => number
  isLifecycleCurrent: (token: number) => boolean
  invalidate: () => void
}

describe('Experience async lifecycle guard', () => {
  it('invalidates a pending continuation after destroy', async () => {
    const experience = Object.assign(Object.create(Experience.prototype), {
      _destroyed: false,
      _lifecycleGeneration: 0,
    }) as Experience
    const probe = experience as unknown as LifecycleProbe
    probe.invalidate = () => {
      ;(experience as unknown as { _destroyed: boolean })._destroyed = true
      ;(experience as unknown as { _lifecycleGeneration: number })._lifecycleGeneration++
    }

    const token = probe.lifecycleToken()
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const continuation = pending.then(() => probe.isLifecycleCurrent(token))

    probe.invalidate()
    release()

    await expect(continuation).resolves.toBe(false)
  })

  it('keeps a live generation valid until invalidated', () => {
    const experience = Object.assign(Object.create(Experience.prototype), {
      _destroyed: false,
      _lifecycleGeneration: 4,
    }) as Experience
    const probe = experience as unknown as LifecycleProbe
    const token = probe.lifecycleToken()

    expect(probe.isLifecycleCurrent(token)).toBe(true)
  })
})
