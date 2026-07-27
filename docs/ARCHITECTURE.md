# Architecture

This document records boundaries that are easy to miss when reading one
module. Source and tests describe the implementation details.

## Product boundary

The Vite SPA owns a shared Three.js scene with semantic DOM content layered
above it. Standalone blog pages share the brand but omit the 3D runtime.

```text
index.html
  → entry-shell.ts
  → entry-app.ts
    → Experience
      → Renderer + World + UI

blog.html + blog/*.html → standalone pages
```

The inline splash paints before the lazy application graph. `entry-app.ts`
coordinates bootstrap progress and emits the ready or failed lifecycle event.

## Routes and world slots

`router.ts` owns SPA rendering, translations, metadata and hash restoration.
Route content changes, but the 3D world keeps six stable slots:

| Index | Canonical ID | Product role     | Primary owner                   |
| ----: | ------------ | ---------------- | ------------------------------- |
|     0 | `lab`        | Contact finale   | `sections/lab*`                 |
|     1 | `intro`      | Story frame 1    | `sections/intro`                |
|     2 | `about`      | Story frame 2    | `sections/about`                |
|     3 | `works`      | Story frame 3    | `sections/works`                |
|     4 | `contact`    | Story frame 4    | `sections/contact`              |
|     5 | `menu`       | Navigation sheet | `sections/menu`, `sections/nav` |

The public Contact finale intentionally occupies the stable runtime `lab`
slot. `/lab` remains a separate catalogue route whose experiments enter
through lazy, isolated scene boundaries. `WorldConfig.ts` owns slot data and
`SplashCube.FACE_ROTATIONS` owns displayed cube orientation.

`CinematicNav` combines a native four-frame scroll story with the Contact and
Menu sheets. It owns story progress and sheet transitions; UIkit owns the
component behavior inside the DOM layer. Cross-route `#section-*` links render
their route before moving to the target frame.

## Runtime ownership

| Concern              | Owner                                               |
| -------------------- | --------------------------------------------------- |
| Bootstrap            | `entry-shell.ts`, `entry-app.ts`                    |
| Routes and content   | `router.ts`, `pages/`, `sections/*/template.ts`     |
| Renderer and loop    | `Renderer.ts`, `RenderPipeline.ts`, `Experience.ts` |
| World composition    | `World.ts`, `WorldConfig.ts`, `SectionSceneFactory` |
| Navigation and UI    | `CinematicNav.ts`, `UIMenu.ts`, `UIManager.ts`      |
| Project presentation | `WorksPlaneStage.ts`, `FullscreenOverlay.ts`        |
| Preferences/events   | `ThemeManager.ts`, `i18n.ts`, `EventBus.ts`         |

Renderer configuration is finalized from the backend actually created after
fallback. `Experience._needsRender` carries demand-driven rendering alongside
bounded animation reasons. `EnvSphere` owns the visible background.

Scene resources follow their owning route or runtime object. Route replacement
releases page-specific DOM behavior; `Experience.destroy()` closes the shared
runtime. Reduced-motion branches reach the same settled state without an
animation interval.

## Events and preferences

`EventBus.ts` owns the typed lifecycle contracts:

- `jlz:webgl-ready` / `jlz:webgl-failed`
- `jlz:section-change`
- `jlz:route-change`

Other feature-local `jlz:*` DOM events are intentionally local contracts;
their producer and consumer own the payload together. The bridge in
`EventBus.ts` exposes the four typed events to legacy DOM listeners.

`ThemeManager` persists `auto` or `inverse`. In auto, each route's section
configuration chooses its light or dark polarity; inverse flips that result.
`i18n.ts` owns localized strings and persistence, while `router.ts` applies
copy and metadata.

## Editorial model

The site itself demonstrates the studio's capability. Routes use the rhythm
capability → problem → response → proof without turning it into a repeated
card template. Works contains authored cases, Blog explains process, and Lab
contains separately loaded experiments.
