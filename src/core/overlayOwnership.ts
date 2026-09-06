export interface OwnedResource<T> {
  readonly value: T
  readonly owned: boolean
}

/** Adopt a shared resource when available, otherwise create an owned one. */
<<<<<<< HEAD
export function adoptResource<T>(
  shared: T | null | undefined,
  create: () => T,
): OwnedResource<T> {
=======
export function adoptResource<T>(shared: T | null | undefined, create: () => T): OwnedResource<T> {
>>>>>>> main
  if (shared != null) return { value: shared, owned: false }
  return { value: create(), owned: true }
}
