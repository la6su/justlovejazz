<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

import { CASE_STUDY_BY_PROJECT } from '../../Data/CaseStudies'
import { PROJECTS } from '../../Data/Projects'
import { useJlzPage } from '../useJlzPage'
import ContactFooter from './ContactFooter.vue'
import NavMenu from './NavMenu.vue'

const rootEl = ref<HTMLElement | null>(null)
useJlzPage('works', () => rootEl.value)
const route = useRoute()
const projectId = computed(() => String(route.params.projectId ?? ''))
const study = computed(() => CASE_STUDY_BY_PROJECT.get(projectId.value))
const project = computed(() => PROJECTS.find((item) => item.id === projectId.value))

watchEffect(() => {
  const title = project.value
    ? `${project.value.title} — JUSTLOVEJAZZ`
    : 'Case study — JUSTLOVEJAZZ'
  const description = study.value?.outcome ?? 'A JUSTLOVEJAZZ creative technology case study.'
  document.title = title
  document.documentElement.lang = 'en'
  const ensureMeta = (attr: 'name' | 'property', key: string): HTMLMetaElement => {
    let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attr, key)
      document.head.appendChild(meta)
    }
    return meta
  }
  ensureMeta('name', 'description').content = description
  ensureMeta('property', 'og:title').content = title
  ensureMeta('property', 'og:description').content = description
  ensureMeta('property', 'og:type').content = 'article'
  if (study.value?.media[0]) {
    ensureMeta('property', 'og:image').content = new URL(
      study.value.media[0].src,
      window.location.origin,
    ).href
  }
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) canonical.href = `${window.location.origin}/works/${projectId.value}`
})
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
    <article class="jlz-page jlz-case-study-page" data-page-view="case-study">
      <ContactFooter mode="content" />
      <section class="jlz-page-section section-active uk-section uk-section-large">
        <div v-if="study && project" class="uk-container uk-container-small">
          <RouterLink class="uk-link-muted uk-text-uppercase jlz-case-study__back" to="/works"
            >← Back to works</RouterLink
          >
          <p class="jlz-eyebrow uk-margin-large-top">{{ study.disclosure }}</p>
          <h1 class="studio-title uk-heading-large uk-margin-small-top">{{ project.title }}</h1>
          <p class="uk-text-lead">{{ study.outcome }}</p>
          <div
            class="uk-grid-small uk-child-width-auto uk-margin-medium-top"
            uk-grid
            aria-label="Project attributes"
          >
            <div v-for="item in study.stack" :key="item">
              <span class="uk-label jlz-case-study__tag">{{ item }}</span>
            </div>
          </div>
          <div class="uk-grid-large uk-child-width-1-2@m uk-margin-large-top" uk-grid>
            <div>
              <h2 class="uk-h4">Context</h2>
              <p>{{ study.context }}</p>
              <h2 class="uk-h4 uk-margin-medium-top">Problem</h2>
              <p>{{ study.problem }}</p>
              <h2 class="uk-h4 uk-margin-medium-top">Role</h2>
              <p>{{ study.role }}</p>
            </div>
            <div>
              <h2 class="uk-h4">Response</h2>
              <p>{{ study.response }}</p>
              <h2 class="uk-h4 uk-margin-medium-top">Result</h2>
              <p>{{ study.result }}</p>
              <h2 class="uk-h4 uk-margin-medium-top">Constraints</h2>
              <ul class="uk-list uk-list-disc">
                <li v-for="constraint in study.constraints" :key="constraint">{{ constraint }}</li>
              </ul>
            </div>
          </div>
          <section class="jlz-case-study__proof uk-margin-large-top" aria-labelledby="proof-title">
            <h2 id="proof-title" class="uk-h4">Proof</h2>
            <div class="uk-grid-small uk-child-width-1-3@m" uk-grid>
              <article
                v-for="proof in study.proof"
                :key="proof.label"
                class="jlz-case-study__proof-card"
              >
                <span class="uk-text-meta">{{ proof.label }}</span
                ><strong>{{ proof.value }}</strong
                ><small>{{ proof.source }}</small>
              </article>
            </div>
          </section>
          <figure
            v-for="media in study.media"
            :key="media.src"
            class="jlz-case-study__media uk-margin-large-top"
          >
            <img
              :src="media.src"
              :alt="media.alt"
              :width="media.width"
              :height="media.height"
              loading="lazy"
              decoding="async"
            />
          </figure>
          <a class="uk-button uk-button-primary uk-margin-large-top" href="/contact">{{
            study.ctaLabel
          }}</a>
          <nav class="jlz-case-study__related uk-margin-large-top" aria-label="Related work">
            <h2 class="uk-h4">Explore related work</h2>
            <div class="uk-flex uk-flex-wrap uk-grid-small" uk-grid>
              <RouterLink
                v-for="related in PROJECTS.filter((item) => item.id !== projectId).slice(0, 3)"
                :key="related.id"
                class="uk-button uk-button-default uk-button-small"
                :to="`/works/${related.id}`"
                >{{ related.title }}</RouterLink
              >
            </div>
          </nav>
        </div>
        <div v-else class="uk-container uk-container-small">
          <h1 class="studio-title">Case study unavailable</h1>
          <RouterLink to="/works" class="uk-button uk-button-default">Back to works</RouterLink>
        </div>
      </section>
      <NavMenu mode="content" />
    </article>
  </main>
</template>
