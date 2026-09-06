<script setup lang="ts">
defineProps<{ projectCount: number; readyCount: number; activeFilter: string }>()
const emit = defineEmits<{ filter: [value: string] }>()
</script>

<template>
  <header class="jlz-works-hero uk-container uk-container-expand uk-padding uk-padding-large@m">
    <div class="uk-grid-large uk-flex-middle" uk-grid>
      <div class="uk-width-2-3@m">
        <p class="jlz-eyebrow">Selected systems · 2022—2026</p>
        <h1 class="studio-title uk-heading-large uk-margin-small-top">
          Work that makes complex technology feel clear.
        </h1>
        <p class="uk-text-lead uk-margin-medium-top">
          Digital products, realtime 3D and creative technology for teams that need a distinctive
          result and a reliable path to launch.
        </p>
      </div>
      <div class="uk-width-1-3@m">
        <div class="jlz-works-proof uk-flex uk-flex-column">
          <span>{{ String(projectCount).padStart(2, '0') }}</span
          ><small>selected projects</small><span>{{ String(readyCount).padStart(2, '0') }}</span
          ><small>case notes ready to share</small>
        </div>
      </div>
    </div>
    <nav
      class="jlz-works-filters uk-flex uk-flex-wrap uk-grid-small uk-margin-large-top"
      aria-label="Work filters"
      uk-grid
    >
      <button
        v-for="filter in ['all', 'Digital products', 'Creative technology']"
        :key="filter"
        type="button"
        class="uk-button uk-button-default uk-button-small"
        :class="{ 'uk-active': activeFilter === filter }"
        :aria-pressed="activeFilter === filter"
        @click="emit('filter', filter)"
      >
        {{ filter === 'all' ? 'All work' : filter }}
      </button>
    </nav>
  </header>
</template>
