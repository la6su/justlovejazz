<script setup lang="ts">
// src/app/views/ManifestoView.vue — Phase 5: /manifesto route SFC. 1:1
// port of the legacy string template `manifestoPage()`
// (src/pages/content/manifesto.ts): four principles + the two shared
// overlays (section 0 contact finale, section 5 menu).
import { ref } from 'vue'

import { useJlzPage } from '../useJlzPage'
import ContactFooter from './ContactFooter.vue'
import NavMenu from './NavMenu.vue'

const rootEl = ref<HTMLElement | null>(null)
useJlzPage('manifesto', () => rootEl.value)

interface Principle {
  num: string
  title: string
  lead: string
  desc: string[]
  href: string
  key: string
}

const PRINCIPLES: readonly Principle[] = [
  {
    num: '01',
    title: 'Purpose',
    lead: "We don't build what everyone builds.",
    desc: ['We solve different problems.', 'We improve experience and understand the pain.'],
    href: '/blog/tsl-changes-everything',
    key: 'manifesto.purpose',
  },
  {
    num: '02',
    title: 'Clarity',
    lead: 'Clean structure.',
    desc: ['Clear logic.', 'No noise.'],
    href: '/blog/on-demand-rendering',
    key: 'manifesto.clarity',
  },
  {
    num: '03',
    title: 'Emotion',
    lead: 'We use motion, light, and sound to evoke a sense of presence.',
    desc: [],
    href: '/blog/undercurrent-webgpu-fluid',
    key: 'manifesto.emotion',
  },
  {
    num: '04',
    title: 'Simplicity',
    lead: 'We strive for minimalism — but not emptiness.',
    desc: [],
    href: '/blog/glassmorphism-webgpu',
    key: 'manifesto.simplicity',
  },
]
</script>

<template>
  <main id="spa-content" ref="rootEl" role="main" class="uk-position-relative" uk-height-viewport>
    <article class="jlz-page" data-page-view="manifesto">
      <!-- 0: CONTACT FINALE (canonical Lab runtime slot) -->
      <ContactFooter mode="content" />

      <!-- 1-4: Purpose / Clarity / Emotion / Simplicity (1 = start, active) -->
      <section
        v-for="(p, i) in PRINCIPLES"
        :key="p.key"
        :class="[
          'jlz-page-section',
          'uk-section',
          'uk-section-small',
          'uk-section-large@m',
          i === 0 ? 'section-active' : '',
        ]"
        :id="`section-${p.key.replace('manifesto.', 'manifesto-')}`"
        :data-page-section="`${p.key.replace('manifesto.', 'manifesto-')}`"
      >
        <div
          class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1"
        >
          <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
            <span
              class="jlz-eyebrow uk-display-inline-block"
              data-eyebrow
              :data-eyebrow-text="p.num"
              >{{ p.num }}</span
            >
            <h2
              class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
              :data-i18n="`${p.key}.title`"
            >
              {{ p.title }}
            </h2>
            <p class="uk-text-lead uk-margin-small-top" :data-i18n="`${p.key}.lead`">
              {{ p.lead }}
            </p>
          </div>
          <div class="jlz-section-bottom">
            <div class="jlz-cinematic-shell">
              <div>
                <span aria-hidden="true">></span>
              </div>
              <div>
                <div v-if="p.desc.length" class="jlz-service-desc uk-flex uk-flex-column">
                  <p
                    v-for="(line, d) in p.desc"
                    :key="d"
                    class="uk-text-meta uk-margin-remove"
                    :data-i18n="`${p.key}.desc${d + 1}`"
                  >
                    {{ line }}
                  </p>
                </div>
                <a
                  :href="p.href"
                  class="jlz-service-explore uk-button uk-button-default uk-button-small uk-text-uppercase uk-margin-top uk-flex uk-flex-none uk-flex-inline uk-flex-middle"
                >
                  <span
                    class="jlz-service-explore__dot uk-display-inline-block"
                    aria-hidden="true"
                  ></span>
                  <span data-i18n="common.readMore">Read more</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5: MENU SHEET -->
      <NavMenu mode="content" />
    </article>
  </main>
</template>
