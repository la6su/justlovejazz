<script setup lang="ts">
// src/app/views/WorksView.vue — Phase 5: /works route SFC. 1:1 port of the
// legacy string template `worksPage()` (src/pages/content/works.ts). Works
// is intentionally composed outside the shared content-page shell: the page
// keeps the six-section navigation contract, while each project pair gets
// an editorial composition sized by UIkit's responsive grid. The DOM
// carries the index header and semantic card buttons; the route's visible
// media is owned by WorksPlaneStage (scene side, untouched by navigation).
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { PROJECTS } from '../../Data/Projects'
import { CASE_STUDY_BY_PROJECT } from '../../Data/CaseStudies'
import { useJlzPage } from '../useJlzPage'
import ContactFooter from './ContactFooter.vue'
import NavMenu from './NavMenu.vue'
import WorksHero from './works/WorksHero.vue'
import CaseStudyCard from './works/CaseStudyCard.vue'

const rootEl = ref<HTMLElement | null>(null)
useJlzPage('works', () => rootEl.value)
const activeFilter = ref('all')
const visibleSections = computed(() =>
  SECTIONS.filter(
    (sec) =>
      activeFilter.value === 'all' ||
      (activeFilter.value === 'Digital products' && sec.index <= 2) ||
      (activeFilter.value === 'Creative technology' && sec.index >= 3),
  ),
)

type WorksLayout = 'feature' | 'equal' | 'reverse' | 'cinematic'

interface WorksSectionDef {
  index: number
  projectA: number
  projectB: number
  layout: WorksLayout
}

// Section order + project pairs are the authored composition (legacy
// template order), not the PROJECTS array order.
const SECTIONS: readonly WorksSectionDef[] = [
  { index: 1, projectA: 0, projectB: 1, layout: 'feature' },
  { index: 2, projectA: 2, projectB: 3, layout: 'equal' },
  { index: 3, projectA: 4, projectB: 5, layout: 'reverse' },
  { index: 4, projectA: 6, projectB: 7, layout: 'cinematic' },
]

const CARD_WIDTHS: Record<WorksLayout, [string, string]> = {
  feature: ['uk-width-2-3@m', 'uk-width-1-3@m'],
  equal: ['uk-width-1-2@m', 'uk-width-1-2@m'],
  reverse: ['uk-width-1-3@m', 'uk-width-2-3@m'],
  cinematic: ['uk-width-3-5@m', 'uk-width-2-5@m'],
}

const number = (value: number): string => String(value).padStart(2, '0')

const disciplines = (idx: number): string =>
  PROJECTS[idx]!.tags?.slice(0, 2).join(' · ') ?? PROJECTS[idx]!.category ?? ''

const meta = (idx: number): string =>
  [PROJECTS[idx]!.year, PROJECTS[idx]!.category].filter(Boolean).join(' · ')
</script>

<template>
  <main
    id="spa-content"
    ref="rootEl"
    role="main"
    class="uk-position-relative"
    data-page-view="content"
    uk-height-viewport
  >
    <article class="jlz-page jlz-works-page" data-page-view="works">
      <ContactFooter mode="content" />
      <!-- Dedicated Works surface: editorial hero + case index, separate from generic pages. -->
      <WorksHero
        :project-count="PROJECTS.length"
        :ready-count="CASE_STUDY_BY_PROJECT.size"
        :active-filter="activeFilter"
        @filter="activeFilter = $event"
      />
      <section
        class="jlz-case-index uk-container uk-container-expand uk-padding uk-padding-large@m"
        aria-labelledby="case-index-title"
      >
        <div class="uk-flex uk-flex-between uk-flex-middle">
          <h2 id="case-index-title" class="uk-h3 uk-margin-remove">Case notes</h2>
          <span class="uk-text-meta">Outcome first</span>
        </div>
        <div class="uk-grid-medium uk-child-width-1-3@m uk-margin-medium-top" uk-grid>
          <template
            v-for="study in [
              CASE_STUDY_BY_PROJECT.get('ebb-vibes'),
              CASE_STUDY_BY_PROJECT.get('mono-sunday'),
              CASE_STUDY_BY_PROJECT.get('nocturne-blue'),
            ]"
            :key="study?.projectId"
          >
            <CaseStudyCard v-if="study" :study="study" />
          </template>
        </div>
      </section>

      <section
        v-for="sec in visibleSections"
        :key="sec.index"
        :class="[
          'jlz-page-section',
          'jlz-works-section',
          `jlz-works-section--${sec.layout}`,
          sec.index === 1 ? 'section-active' : '',
        ]"
        :id="`section-works-${number(sec.index)}`"
        :data-page-section="`works-${number(sec.index)}`"
      >
        <div class="jlz-works-stage uk-container uk-container-expand uk-position-relative">
          <header class="jlz-works-index uk-flex uk-flex-middle uk-flex-between uk-text-uppercase">
            <div class="uk-flex uk-flex-middle">
              <span class="jlz-works-index__number">{{ number(sec.index) }}</span>
              <h2
                class="jlz-works-index__title uk-margin-remove"
                :data-i18n="`works.section${sec.index}.title`"
              >
                Section {{ number(sec.index) }}
              </h2>
            </div>
            <span class="jlz-works-index__progress">{{ number(sec.index) }} / 04</span>
          </header>
          <p class="jlz-works-index__lead" :data-i18n="`works.section${sec.index}.lead`">
            A focused visual system with a clear technical intention.
          </p>

          <div
            class="jlz-works-grid jlz-works-composition uk-grid uk-grid-small uk-height-1-1 uk-flex uk-flex-middle uk-child-width-1-1 uk-child-width-auto@m"
            :data-works-layout="sec.layout"
            uk-grid
          >
            <div v-for="pos in [0, 1] as const" :key="pos" :class="CARD_WIDTHS[sec.layout][pos]">
              <div>
                <button
                  class="jlz-work-card jlz-case-plane uk-position-relative uk-flex uk-flex-bottom"
                  type="button"
                  :data-project-idx="pos === 0 ? sec.projectA : sec.projectB"
                  :data-project-id="PROJECTS[pos === 0 ? sec.projectA : sec.projectB]!.id"
                  data-cursor="view"
                  data-magnetic
                  :aria-label="`Open project: ${PROJECTS[pos === 0 ? sec.projectA : sec.projectB]!.title}`"
                >
                  <span
                    class="jlz-work-card__caption uk-position-bottom uk-width-1-1 uk-flex uk-flex-bottom uk-flex-between"
                  >
                    <span class="jlz-work-card__eyebrow uk-text-uppercase">
                      {{ number((pos === 0 ? sec.projectA : sec.projectB) + 1) }} ·
                      {{ disciplines(pos === 0 ? sec.projectA : sec.projectB) }}
                    </span>
                    <span class="jlz-work-card__copy uk-flex uk-flex-column">
                      <strong class="jlz-work-card__title uk-text-truncate">
                        {{ PROJECTS[pos === 0 ? sec.projectA : sec.projectB]!.title }}
                      </strong>
                      <span class="jlz-work-card__meta uk-text-uppercase">
                        {{ meta(pos === 0 ? sec.projectA : sec.projectB) }}
                      </span>
                    </span>
                  </span>
                </button>
                <RouterLink
                  class="jlz-work-card__case-link uk-position-cover"
                  :to="`/works/${PROJECTS[pos === 0 ? sec.projectA : sec.projectB]!.id}`"
                  :aria-label="`Read case study: ${PROJECTS[pos === 0 ? sec.projectA : sec.projectB]!.title}`"
                />
              </div>
            </div>
          </div>
          <RouterLink class="jlz-works-section__cta uk-button uk-button-default" to="/contact">
            <span data-i18n="common.startProject">Start a project</span>
          </RouterLink>
        </div>
      </section>

      <NavMenu mode="content" />
    </article>
  </main>
</template>
