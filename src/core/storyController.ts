import { StoryPublisher, type StoryStateListener } from './storyPublisher'
import type { StorySide, StoryState } from './storyState'

/** Minimal typed source consumed by the runtime story controller. */
export interface StorySource {
  getOverallProgress(): number
  getSectionIndex(): number
}

export type StorySideResolver = (sectionIndex: number) => StorySide

/** Resolve the canonical side slots without coupling callers to navigation. */
export function storySideForSlot(
  sectionIndex: number,
  footerSlotIndex: number,
  menuSlotIndex: number,
): StorySide {
  if (sectionIndex === footerSlotIndex) return 'footer'
  if (sectionIndex === menuSlotIndex) return 'menu'
  return 'center'
}

/**
 * Runtime owner for the canonical story snapshot.
 *
 * The native navigation remains the source and keeps its event-driven timing;
 * this controller only translates that source into the framework-neutral
 * publisher contract. It has no DOM, Vue, Three or render-loop dependency.
 */
export class StoryController {
  private readonly publisher: StoryPublisher

  constructor(
    private readonly source: StorySource,
    private readonly resolveSide: StorySideResolver,
  ) {
    this.publisher = new StoryPublisher(this.read())
  }

  get snapshot(): StoryState {
    return this.publisher.snapshot
  }

  subscribe(listener: StoryStateListener, emitCurrent = true): () => void {
    return this.publisher.subscribe(listener, emitCurrent)
  }

  /** Pull the current native navigation state and publish if it changed. */
  sync(): boolean {
    return this.publisher.publish(this.read())
  }

  dispose(): void {
    this.publisher.dispose()
  }

  private read(): StoryState {
    const sectionIndex = this.source.getSectionIndex()
    return {
      side: this.resolveSide(sectionIndex),
      progress: this.source.getOverallProgress(),
      sectionIndex,
    }
  }
}
