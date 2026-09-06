import { describe, expect, it } from 'vitest'
import { clampDevicePixelRatio, MAX_DEVICE_PIXEL_RATIO } from '../core/viewportPolicy'

describe('viewport policy', () => {
  it('keeps normal DPR values within the renderer cap', () => {
    expect(clampDevicePixelRatio(1)).toBe(1)
    expect(clampDevicePixelRatio(1.75)).toBe(1.75)
    expect(clampDevicePixelRatio(4)).toBe(MAX_DEVICE_PIXEL_RATIO)
  })

  it('normalizes invalid or transient DPR values', () => {
    expect(clampDevicePixelRatio(0)).toBe(1)
    expect(clampDevicePixelRatio(Number.NaN)).toBe(1)
    expect(clampDevicePixelRatio(Number.POSITIVE_INFINITY)).toBe(1)
    expect(clampDevicePixelRatio('2')).toBe(1)
  })

  it('honors a positive backend-specific cap', () => {
    expect(clampDevicePixelRatio(2, 1.5)).toBe(1.5)
    expect(clampDevicePixelRatio(2, 0)).toBe(MAX_DEVICE_PIXEL_RATIO)
  })
})
