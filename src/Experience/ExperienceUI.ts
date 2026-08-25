// src/Experience/ExperienceUI.ts — Phase 7 slice 4: the former UI features.
//
// `Experience` split: bootstrap (init + readiness), scene coordination
// (per-frame world/camera/post) and the FORMER UI FEATURES — the cinematic
// navigation shell, the menu, the fullscreen overlay, the Works portfolio
// and the UI-facing window event handlers. This class owns those features
// (creation, wiring, disposal) and reaches the scene through the narrow
// `ExperienceUIHost` port: no DOM scene knowledge, no renderer access.
//
// Disposal contract: `destroy()` removes every window listener this class
// added and disposes the features it created — Experience.destroy() runs it
// so the root teardown returns every owned resource to baseline.

import { CinematicNav } from '../UI/CinematicNav'
import { StoryController, storySideForSlot } from '../core/storyController'
import { UIMenu } from '../UI/UIMenu'
import { FullscreenOverlay } from '../UI/FullscreenOverlay'
import type { UIManager } from '../UI/UIManager'
import type { SceneCoordinator } from './SceneCoordinator'
import type { PageId } from '../sections/_shared/constants'
import { getSoundMuted } from '../core/SfxSystem'
import type { SfxSystem } from '../core/SfxSystem'
import { createWorksPortfolio, type WorksPortfolio } from './WorksPortfolio'
import { WORLD_SLOT_COUNT, worldSlotIndex } from '../core/worldSlots'
import { eventBus } from '../core/EventBus'
import type { Camera } from './Camera'
import type { FrameReason } from '../core/RenderScheduler'

/** The single Works story frame — the six-slot contract, not a literal. */
const WORKS_SLOT_INDEX = worldSlotIndex('works')!
const CONTACT_SLOT_INDEX = worldSlotIndex('lab')!
const MENU_SLOT_INDEX = worldSlotIndex('menu')!

/**
 * The narrow port ExperienceUI reaches the scene through. Every accessor is
 * a getter (not a stored reference) so the scene + its owners can only be
 * read AFTER Experience.init() has built them.
 */
export interface ExperienceUIHost {
  page: () => PageId
  coordinator: () => SceneCoordinator
  camera: () => Camera
  ui: () => UIManager
  sfx: () => SfxSystem
  /** Raise render demand + wake the single loop driver (typed reason). */
  raise: (reason?: FrameReason) => void
  reducedMotion: () => boolean
  /** Phase 8 slice 6: the Experience-owned BakuCarousel init (idempotent). */
  ensureCarouselInitialized: () => Promise<void>
  /** Phase 8 slice 7: the Experience-owned lazy /works stage lifecycle. */
  ensureWorksPlaneStageInitialized: () => Promise<void>
  disposeWorksPlaneStage: () => void
  /** Phase 8 slice 8: the Experience-owned lazy Contact stage lifecycle. */
  ensureContactTextStageInitialized: () => Promise<void>
  ensureContactTypographyStageInitialized: () => Promise<void>
  ensureContactCyprusStageInitialized: () => Promise<void>
  disposeContactTextStage: () => void
  disposeContactTypographyStage: () => void
  disposeContactCyprusStage: () => void
  setContactTextStageSection: (index: number) => void
  setContactCyprusStageSection: (index: number) => void
  /** Phase 8 slice 9: the Experience-owned lazy Lab object lifecycle. */
  ensureLabGamepad: () => Promise<void>
}

export class ExperienceUI {
  /** Vertical native story track plus top/bottom sheets. */
  storyNav: CinematicNav | null = null
  /** Typed story owner; native CinematicNav remains the source/timing owner. */
  storyController: StoryController | null = null
  /** The compact console menu. */
  uiMenu: UIMenu | null = null
  /** Works portfolio (public for DevPanel access). */
  portfolio: WorksPortfolio | null = null
  /** The fullscreen overlay (UIManager may own one; adopt or create). */
  overlay: FullscreenOverlay | null = null
  portfolioInitialized = false
  private activeProjectIndex = 0

  private _openProjectUnsub: (() => void) | null = null
  private _projectNavigateUnsub: (() => void) | null = null
  private _routeChangeCloseOverlayUnsub: (() => void) | null = null
  private _wobblePulseUnsub: (() => void) | null = null
  private _worksPageSectionUnsub: (() => void) | null = null
  private _worksPlaneTapHandler: ((e: PointerEvent) => void) | null = null
  private _gotoSectionByHashUnsub: (() => void) | null = null
  private _soundToggleUnsub: (() => void) | null = null
  private _langChangeUnsub: (() => void) | null = null

  constructor(private host: ExperienceUIHost) {}

  /** Create + wire the UI features. Called from Experience.init(). */
  init(): void {
    // CinematicNav — vertical native story track plus top/bottom sheets.
    // The section count is the worldSlots contract (single source of the
    // six-slot model), not a literal.
    this.storyNav = new CinematicNav(WORLD_SLOT_COUNT, this.host.page)
    this.storyController = new StoryController(this.storyNav, (sectionIndex) =>
      storySideForSlot(sectionIndex, CONTACT_SLOT_INDEX, MENU_SLOT_INDEX),
    )
    this.publishStoryState()
    // Phase 7: native scroll is a typed loop wake source.
    this.storyNav.onActivity = () => {
      this.publishStoryState()
      this.host.raise('nav')
    }
    this.storyNav.onSectionChange((idx) => {
      this.publishStoryState()
      this.uiMenu?.setActive(idx)
      // Initial hashes are replayed only after the ready splash event. Keep
      // the Works owner explicit at that boundary so a hash-driven arrival
      // cannot depend on an earlier render frame to wake its carousel.
      if (idx === WORKS_SLOT_INDEX && this.host.page() === 'home') {
        void this.host.ensureCarouselInitialized().then(() => {
          if (this.storyNav?.getSectionIndex() === WORKS_SLOT_INDEX) this.host.raise('nav')
        })
      }
      this.host.raise('nav')
    })
    this.storyNav.onActiveChange((active) => {
      if (active) this.host.raise('nav')
    })

    // UIMenu
    this.uiMenu = new UIMenu()
    this.uiMenu.onNavigate((idx) => {
      this.storyNav?.goToSection(idx)
    })

    // The compact storyline lives inside the console bar (bottom strip).
    // If the console bar exists, append there; otherwise fall back to body.
    const consoleBar = document.querySelector('.jlz-console-bar')
    if (consoleBar) {
      consoleBar.appendChild(this.storyNav.el)
    } else {
      document.body.appendChild(this.storyNav.el)
    }

    // Sound config from splash page (localStorage 'jlz:sound' = 'on'|'off').
    // D-7 fix: default to MUTED (matches UIMenu's readSoundMuted default:
    // `localStorage.getItem('jlz:sound') !== 'on'` → true/muted when no key).
    this.host.sfx().setMuted(getSoundMuted())

    // Runtime sound toggle (from UIMenu or other in-app controls)
    this._soundToggleUnsub = eventBus.on('jlz:sound-toggle', ({ muted }) => {
      this.host.sfx().setMuted(muted)
    })

    // Keep the route-owned pixel title in sync with the active language.
    this._langChangeUnsub = eventBus.on('jlz:lang-change', () => {
      this.host.coordinator().contactTextStage?.refreshLanguage()
    })

    // ── Works page card click → open fullscreen overlay ──
    // Dispatched by WorkCards.ts when a .jlz-work-card is clicked (works page).
    // All opens (showreel, slider, /works) use the same unified DOM cinematic
    // reveal — no 3D plane-to-fullscreen handoff, which caused a double effect.
    this._openProjectUnsub = eventBus.on('jlz:open-project', ({ idx }) => {
      if (typeof idx !== 'number') return
      void this.ensurePortfolio().then(() => {
        this.onProjectSelect(idx)
      })
    })

    this._projectNavigateUnsub = eventBus.on('jlz:project-navigate', ({ direction }) => {
      if (!this.overlay?.isOpen) return
      const carousel = this.getCarousel()
      if (direction < 0) {
        carousel?.prev()
        if (!carousel) this.portfolio?.prev()
      } else {
        carousel?.next()
        if (!carousel) this.portfolio?.next()
      }
      this.onProjectSelect(this.activeProjectIndex + direction)
    })

    // ── Close overlay on route change ──
    // When SPA navigates (Menu subnav click, browser back, etc.),
    // close any open FullscreenOverlay. isOpen checks UIKit's native uk-open
    // class — no custom flag to get out of sync.
    this._routeChangeCloseOverlayUnsub = eventBus.on('jlz:route-change', () => {
      if (this.overlay?.isOpen) {
        this.overlay.close()
      }
      const newPage = this.host.page()
      const coordinator = this.host.coordinator()
      coordinator.syncRouteVisuals()
      if (newPage === 'home') {
        void this.host.ensureCarouselInitialized()
      }
      if (newPage === 'works') {
        void this.host.ensureWorksPlaneStageInitialized().then(() => {
          this.host.coordinator().setWorksPlaneStageSection(0)
          this.host.raise('nav')
        })
      } else {
        // Works owns eight decoded 1440×810 textures. Keeping an inactive
        // stage alive makes that GPU allocation look like a navigation leak.
        this.host.disposeWorksPlaneStage()
      }
      if (newPage === 'contact') {
        this.host.setContactCyprusStageSection(0)
        coordinator.setContactSceneSection(0)
        void Promise.all([
          this.host.ensureContactTextStageInitialized(),
          this.host.ensureContactTypographyStageInitialized(),
          this.host.ensureContactCyprusStageInitialized(),
        ]).then(() => {
          this.host.setContactTextStageSection(0)
          this.host.raise('nav')
        })
      } else {
        this.host.disposeContactTextStage()
        this.host.disposeContactTypographyStage()
        this.host.disposeContactCyprusStage()
        coordinator.setContactSceneSection(0)
      }
      // Phase 8 slice 9: the Lab object's lazy creation moved to Experience
      // (created once on the first /lab visit; never disposed per route leave —
      // the World's `syncRouteVisuals` already hides it off-route).
      if (newPage === 'lab') void this.host.ensureLabGamepad()
      this.host.raise('nav')
    })

    // Phase 5: Wobble pulse on card click (work cards + carousel)
    this._wobblePulseUnsub = eventBus.on('jlz:wobble-pulse', () => {
      this.host.coordinator().baku?.triggerWobblePulse()
      // Keep rendering while the pulse animates (sin-envelope in SplashCube.update).
      this.host.raise('dirty')
    })

    // Route-owned 3D layers follow the shared content-page navigation contract.
    this._worksPageSectionUnsub = eventBus.on('jlz:page-section-change', ({ index }) => {
      const domIndex = index ?? 0
      const stageIndex = Math.max(0, domIndex - 1)
      const page = this.host.page()
      const coordinator = this.host.coordinator()
      if (page === 'works') {
        // DOM sections: 0=Lab overlay, 1-4=project pairs, 5=Nav overlay.
        coordinator.setWorksPlaneStageSection(stageIndex)
      } else if (page === 'contact') {
        this.host.setContactTextStageSection(stageIndex)
        this.host.setContactCyprusStageSection(stageIndex)
        coordinator.setContactSceneSection(stageIndex)
      } else {
        return
      }
      this.host.raise('nav')
    })

    this._worksPlaneTapHandler = (e: PointerEvent) => {
      if (this.host.page() !== 'works' || this.overlay?.isOpen) return
      // The Enter pointerup is dispatched while the splash curtains are still
      // present. It must not be reinterpreted as a click on the first 3D plane.
      if (document.getElementById('jlz-app-loader')) return
      const target = e.target as HTMLElement | null
      if (target?.closest('.jlz-work-card, #jlz-fs-overlay, .jlz-topbar, [data-cinematic-menu]'))
        return
      // Raycast against the 3D planes to find which project was tapped, then
      // open the overlay with the unified cinematic reveal (no 3D handoff).
      void this.ensurePortfolio().then(() => {
        const stage = this.host.coordinator().worksPlaneStage
        if (!stage) return
        const idx = stage.hitTest(e.clientX, e.clientY)
        if (idx >= 0) this.onProjectSelect(idx)
      })
    }
    window.addEventListener('pointerup', this._worksPlaneTapHandler)

    // ── Hash navigation from menu overlay (e.g. /manifesto#section-manifesto-02) ──
    // Dispatched by the router after renderView. CinematicNav finds
    // the target section by hash ID and activates it. Without this, menu
    // subsection clicks always land on section 1 (hash silently dropped).
    this._gotoSectionByHashUnsub = eventBus.on('jlz:goto-section-by-hash', ({ hash }) => {
      if (hash) {
        this.storyNav?.goToSectionByHash(hash)
      }
    })
  }

  private publishStoryState(): void {
    const nav = this.storyNav
    const controller = this.storyController
    if (!nav || !controller) return
    controller.sync()
  }

  /** Start the authored cube reaction and its one-shot portal-frame echo. */
  triggerSplashOpener(): void {
    const coordinator = this.host.coordinator()
    coordinator.baku?.triggerOpener()
    if (this.host.reducedMotion()) return
    coordinator.particleBurst?.trigger(0, 0, 0)
    if (coordinator.particleBurst?.isActive) this.host.raise('dirty')
  }

  async ensurePortfolio(): Promise<void> {
    if (this.portfolio) return
    // Always build portfolio — single-page experience
    // The scene must be initialised (sections attached to the Tres scene)
    // before the portfolio raycast can run against the 3D planes.
    const coordinator = this.host.coordinator()
    const ready = () => coordinator.sections.length > 0
    if (!ready()) {
      // Wait one frame for the scene init to finish, then retry.
      await new Promise((r) => requestAnimationFrame(() => r(null)))
      if (!this.portfolio && !ready()) return
    }

    const { PROJECTS } = await import('../Data/Projects')
    // Re-check after async import — page may have changed during await.
    if (this.portfolio) return // another call won

    this.portfolio = createWorksPortfolio(PROJECTS, (idx) => {
      this.onProjectSelect(idx)
    })

    // FullscreenOverlay is normally created by UIManager. Project navigation
    // is routed through `jlz:project-navigate` so arrows and keyboard use the
    // same owner even if the overlay was created before this async portfolio.
    this.overlay ??= this.host.ui().overlay ?? new FullscreenOverlay()

    // Wire BakuCarousel card click → open fullscreen overlay.
    // All opens use the unified DOM cinematic reveal (no 3D plane handoff).
    const carousel = this.getCarousel()
    if (carousel && !carousel.userData.clickWired) {
      carousel.userData.clickWired = true
      carousel.setCamera(this.host.camera().instance)
      carousel.onCardClick((idx) => {
        this.onProjectSelect(idx)
      })
    }
  }

  /** Get the BakuCarousel from the Experience-owned reference (index 3 in the
   *  6-section layout; the carousel is a child of the Works group).
   *  Returns null on non-home pages — the carousel is home-only. */
  private getCarousel(): import('./World/BakuCarousel').BakuCarousel | null {
    // BakuCarousel only exists on home page — content pages don't init it
    if (this.host.page() !== 'home') return null
    // Phase 8 slice 6: the reference lives on Experience (injected through
    // World.attachBakuCarousel); read it through the documented getter.
    return this.host.coordinator()?.carousel ?? null
  }

  /** Frame access: the carousel may have started morphing this frame. */
  getFrameCarousel(): import('./World/BakuCarousel').BakuCarousel | null {
    return this.getCarousel()
  }

  onProjectSelect(idx: number, preload: boolean = false): void {
    if (!this.portfolio || !this.overlay) return
    const projs = this.portfolio.projects
    if (!Array.isArray(projs) || projs.length === 0) return
    const safeIdx = ((idx % projs.length) + projs.length) % projs.length
    this.activeProjectIndex = safeIdx
    const project = projs[safeIdx]
    if (!project) return

    // Open/preload fullscreen overlay with project info + poster.
    // All opens (showreel, slider, /works) use the unified DOM cinematic
    // reveal — no origin='plane' 3D handoff.
    const p = project as {
      title?: string
      category?: string
      description?: string
      tags?: string[]
      textureUrl?: string
      detailTextureUrl?: string
      videoSrc?: string
      year?: string
    }
    const opts = {
      // Case studies are still-image overlays. The only video source belongs
      // to UIManager's explicit showreel action; keeping this image-only
      // avoids every project silently loading the placeholder showreel.
      mode: 'image' as const,
      poster: p.textureUrl,
      title: p.title,
      category: `${p.year ?? ''} · ${p.category ?? ''}`,
      description: p.description,
      tags: p.tags,
      counter: `${safeIdx + 1} / ${projs.length}`,
      hasPrev: true,
      hasNext: true,
    }
    if (preload) {
      this.overlay.preload(opts)
    } else {
      this.overlay.open(opts)
    }
  }

  /** Remove every UI-feature listener + dispose the created features. */
  destroy(): void {
    this._soundToggleUnsub?.()
    this._langChangeUnsub?.()
    this._openProjectUnsub?.()
    this._projectNavigateUnsub?.()
    this._routeChangeCloseOverlayUnsub?.()
    this._wobblePulseUnsub?.()
    this._worksPageSectionUnsub?.()
    this._gotoSectionByHashUnsub?.()
    this._soundToggleUnsub = this._langChangeUnsub = this._openProjectUnsub = null
    this._projectNavigateUnsub = this._routeChangeCloseOverlayUnsub = null
    this._wobblePulseUnsub = this._worksPageSectionUnsub = this._gotoSectionByHashUnsub = null
    if (this._worksPlaneTapHandler) {
      window.removeEventListener('pointerup', this._worksPlaneTapHandler)
      this._worksPlaneTapHandler = null
    }
    this.portfolio = null
    this.overlay?.dispose()
    this.overlay = null
    this.uiMenu?.dispose()
    this.uiMenu = null
    this.storyNav?.dispose()
    this.storyNav = null
    this.storyController?.dispose()
    this.storyController = null
  }
}
