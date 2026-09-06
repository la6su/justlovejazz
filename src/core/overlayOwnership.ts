export interface OwnedResource<T> {
  readonly value: T
  readonly owned: boolean
}

/** Adopt a shared resource when available, otherwise create an owned one. */
export function adoptResource<T>(shared: T | null | undefined, create: () => T): OwnedResource<T> {
  if (shared != null) return { value: shared, owned: false }
  return { value: create(), owned: true }
}
