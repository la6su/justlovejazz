/** Stable viewport policy shared by the renderer and scene resize owners. */
export const MAX_DEVICE_PIXEL_RATIO = 2

/**
 * Normalize browser DPR input to the supported rendering range.
 * Browsers normally report a finite value >= 1, but test environments,
 * software adapters and transient viewport updates may expose 0/NaN.
 */
export function clampDevicePixelRatio(
  value: unknown,
  max: number = MAX_DEVICE_PIXEL_RATIO,
): number {
  const upper = Number.isFinite(max) && max > 0 ? max : MAX_DEVICE_PIXEL_RATIO
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 1
  return Math.min(Math.max(numeric, 1), upper)
}
