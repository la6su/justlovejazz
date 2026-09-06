<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CaseStudy } from '../../../core/caseStudies'
import { PROJECTS } from '../../../Data/Projects'

defineProps<{ study: CaseStudy }>()
const titleFor = (id: string): string => PROJECTS.find((item) => item.id === id)?.title ?? id
</script>

<template>
  <article class="jlz-case-index__card">
    <p class="uk-text-meta uk-text-uppercase">{{ study.disclosure }}</p>
    <h3 class="uk-h4 uk-margin-small-top">{{ titleFor(study.projectId) }}</h3>
    <p>{{ study.outcome }}</p>
    <RouterLink class="uk-link-text" :to="`/works/${study.projectId}`">Read case note →</RouterLink>
  </article>
</template>
