<script setup lang="ts">
// src/app/PageView.vue — Phase 5 temporary primitive adapter.
//
// Consumer + removal phase (per AGENTS.md adapter rule): every Phase 5 route
// record points at this adapter until its semantic route is migrated to a
// route SFC; the Phase 5 cleanup commit replaces each record's component and
// deletes this file. The adapter hosts the string-template page contract
// (`src/pages`) and ports the legacy `renderView` side-effect sequence
// verbatim: WorkCards disposal before the DOM swap, home intro activation,
// i18n + per-page meta on every render, the route announcer on page change,
// the menu toolbar init, UIkit hydration and the `jlz:route-change`
// notification that keeps the 3D world in sync. The scene runtime is never
// touched — navigation re-renders the DOM only.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import UIkit from 'uikit'

import { eventBus } from '../core/EventBus'
import { applyTranslations } from '../core/i18n'
import { applyMetaTags } from '../core/pageMeta'
import { renderPage } from '../pages'
import type { PageId } from '../sections/_shared/constants'
import { initMenuToolbar } from '../sections/nav/template'
import { disposeWorkCards } from '../UI/WorkCards'
import { RouteTransition } from '../UI/RouteTransition'

const route = useRoute()
const page = computed<PageId>(() => {
  const meta = route.meta.page as PageId | undefined
  return meta ?? 'home'
})

// The `#spa-content` host keeps its legacy id, role and classes so the
// existing CSS, the skip link and the prerender contract stay valid.
const containerEl = ref<HTMLElement | null>(null)
const html = ref(renderPage(page.value))
const routeTransition = new RouteTransition()

const uiKitUpdate = (element: Element): void => {
  ;(UIkit as unknown as { update(element: Element): void }).update(element)
}

// The legacy `renderView` post-render sequence, ported verbatim.
function postRender(previous: PageId | null): void {
  const el = containerEl.value
  if (!el) return
  if (page.value === 'home') {
    // Home: activate the intro section (sectionShell does not add
    // section-active in home mode).
    el.querySelector<HTMLElement>('[data-section="intro"]')?.classList.add('section-active')
  }
  applyTranslations()
  applyMetaTags(page.value)
  if (previous !== null && previous !== page.value) {
    const announcer = document.getElementById('jlz-route-announcer')
    if (announcer) {
      announcer.textContent = ''
      requestAnimationFrame(() => {
        announcer.textContent = document.title
      })
    }
  }
  initMenuToolbar()
  uiKitUpdate(el)
  // Typed EventBus emission bridges to window automatically.
  eventBus.emit('jlz:route-change', { page: page.value })
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => uiKitUpdate(el), { timeout: 100 })
  }
}

// The legacy `renderView` contract: the active page is exposed on the
// document/body dataset for CSS hooks and the runtime owners.
function syncPageDataset(): void {
  document.body.dataset.page = page.value
  document.documentElement.dataset.page = page.value
}

onMounted(() => {
  syncPageDataset()
  postRender(null)
})

watch(page, (next, previous) => {
  const run = (): void => {
    // Dispose WorkCards listeners + clear the cards[] array BEFORE replacing
    // innerHTML (legacy leak contract: detached card listeners would keep
    // the nodes alive).
    disposeWorkCards()
    syncPageDataset()
    html.value = renderPage(next)
    postRender(previous)
  }
  void routeTransition.run(run)
})
</script>

<template>
  <main
    id="spa-content"
    ref="containerEl"
    role="main"
    class="uk-position-relative"
    uk-height-viewport
    v-html="html"
  ></main>
</template>
