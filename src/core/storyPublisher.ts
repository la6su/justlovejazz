import type { StoryState } from './storyState'

export type StoryStateListener = (state: StoryState) => void

function sameState(a: StoryState, b: StoryState): boolean {
  return a.side === b.side && a.progress === b.progress && a.sectionIndex === b.sectionIndex
}

/** Framework-neutral, deduplicating publisher for the canonical story state. */
export class StoryPublisher {
  private readonly listeners = new Set<StoryStateListener>()
  private current: StoryState
  private disposed = false

  constructor(initial: StoryState) {
    this.current = initial
  }

  get snapshot(): StoryState {
    return this.current
  }

  subscribe(listener: StoryStateListener, emitCurrent = true): () => void {
    if (this.disposed) return () => undefined
    this.listeners.add(listener)
    if (emitCurrent) listener(this.current)
    return () => this.listeners.delete(listener)
  }

  publish(next: StoryState): boolean {
    if (this.disposed || sameState(this.current, next)) return false
    this.current = next
    for (const listener of [...this.listeners]) listener(next)
    return true
  }

  dispose(): void {
    this.disposed = true
    this.listeners.clear()
  }
}
