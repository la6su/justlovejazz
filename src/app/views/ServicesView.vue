<script setup lang="ts">
// src/app/views/ServicesView.vue — Phase 5: /services route SFC. 1:1 port
// of the legacy string template `servicesPage()`
// (src/pages/content/services.ts): four story beats; the console window is
// reserved for the opening proposition and the final action, not repeated
// as page furniture.
import { ref } from 'vue'

import { useJlzPage } from '../useJlzPage'
import ContactFooter from './ContactFooter.vue'
import NavMenu from './NavMenu.vue'

const rootEl = ref<HTMLElement | null>(null)
useJlzPage('services', () => rootEl.value)
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
    <article class="jlz-page jlz-services-page" data-page-view="services">
      <ContactFooter mode="content" />

      <!-- 01 · Creative Direction (start, active) -->
      <section
        class="jlz-page-section section-active uk-section uk-section-small uk-section-large@m"
        id="section-services-creativeDirection"
        data-page-section="services-creativeDirection"
      >
        <div
          class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1"
        >
          <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
            <span class="jlz-eyebrow uk-display-inline-block" data-eyebrow data-eyebrow-text="01"
              >01</span
            >
            <h2
              class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
              data-i18n="services.creativeDirection.title"
            >
              Creative Direction
            </h2>
            <p class="uk-text-lead uk-margin-small-top" data-i18n="services.creativeDirection.lead">
              Find the point of view before the system takes shape.
            </p>
          </div>
          <div class="jlz-section-bottom">
            <div class="jlz-cinematic-shell">
              <div>
                <span aria-hidden="true">></span>
              </div>
              <div>
                <div class="jlz-console-card jlz-service-console">
                  <div class="jlz-console-card__chrome" aria-hidden="true">
                    <span></span><span></span><span></span>
                    <span class="jlz-console-card__index uk-text-meta uk-text-uppercase"
                      >01 / 04</span
                    >
                  </div>
                  <p
                    class="jlz-service-console__statement uk-text-lead uk-margin-remove"
                    data-i18n="services.creativeDirection.statement"
                  >
                    A useful identity gives every later decision a direction.
                  </p>
                  <a
                    href="/blog/glassmorphism-webgpu"
                    class="jlz-service-explore uk-button uk-button-default uk-button-small uk-text-uppercase uk-margin-top uk-flex uk-flex-none uk-flex-inline uk-flex-middle uk-margin-medium-top"
                  >
                    <span
                      class="jlz-service-explore__dot uk-display-inline-block"
                      aria-hidden="true"
                    ></span>
                    <span data-i18n="common.explore">Explore</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 02 · Realtime build -->
      <section
        class="jlz-page-section uk-section uk-section-small uk-section-large@m"
        id="section-services-interactiveDev"
        data-page-section="services-interactiveDev"
      >
        <div
          class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1"
        >
          <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
            <span class="jlz-eyebrow uk-display-inline-block" data-eyebrow data-eyebrow-text="02"
              >02</span
            >
            <h2
              class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
              data-i18n="services.interactiveDev.title"
            >
              Realtime build
            </h2>
            <p class="uk-text-lead uk-margin-small-top" data-i18n="services.interactiveDev.lead">
              The interface wakes exactly when the story moves.
            </p>
          </div>
          <div class="jlz-section-bottom">
            <div class="jlz-cinematic-shell">
              <div>
                <span aria-hidden="true">></span>
              </div>
              <div>
                <div class="jlz-service-runtime">
                  <div
                    class="jlz-service-runtime__field"
                    role="img"
                    aria-label="A responsive signal travelling through a realtime scene"
                    uk-scrollspy="cls: uk-animation-scale-up; repeat: true"
                  >
                    <svg viewBox="0 0 320 180" aria-hidden="true" focusable="false">
                      <path
                        class="jlz-service-runtime__trace"
                        d="M8 128C54 128 55 48 102 48s48 84 94 84 43-76 116-76"
                      />
                      <path
                        class="jlz-service-runtime__signal"
                        d="M8 128C54 128 55 48 102 48s48 84 94 84 43-76 116-76"
                      />
                    </svg>
                    <span class="jlz-service-runtime__node jlz-service-runtime__node--start"></span>
                    <span
                      class="jlz-service-runtime__node jlz-service-runtime__node--middle"
                    ></span>
                    <span class="jlz-service-runtime__node jlz-service-runtime__node--end"></span>
                  </div>
                  <p
                    class="jlz-service-runtime__caption uk-text-meta uk-margin-remove"
                    data-i18n="services.interactiveDev.caption"
                    uk-scrollspy="cls: uk-animation-slide-bottom-small; repeat: true"
                  >
                    Render only when there is something to say.
                  </p>
                  <div uk-scrollspy="cls: uk-animation-slide-bottom-small; delay: 90; repeat: true">
                    <a
                      href="/blog/on-demand-rendering"
                      class="jlz-service-explore uk-button uk-button-default uk-button-small uk-text-uppercase uk-margin-top uk-flex uk-flex-none uk-flex-inline uk-flex-middle"
                    >
                      <span
                        class="jlz-service-explore__dot uk-display-inline-block"
                        aria-hidden="true"
                      ></span>
                      <span data-i18n="common.explore">Explore</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 03 · Motion -->
      <section
        class="jlz-page-section uk-section uk-section-small uk-section-large@m"
        id="section-services-motionRealtime"
        data-page-section="services-motionRealtime"
      >
        <div
          class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1"
        >
          <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
            <span class="jlz-eyebrow uk-display-inline-block" data-eyebrow data-eyebrow-text="03"
              >03</span
            >
            <h2
              class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
              data-i18n="services.motionRealtime.title"
            >
              Motion
            </h2>
            <p class="uk-text-lead uk-margin-small-top" data-i18n="services.motionRealtime.lead">
              Direction, not decoration.
            </p>
          </div>
          <div class="jlz-section-bottom">
            <div class="jlz-cinematic-shell">
              <div>
                <span aria-hidden="true">></span>
              </div>
              <div>
                <div class="jlz-service-motion">
                  <div
                    class="jlz-service-motion__words"
                    aria-label="Motion sequence"
                    uk-scrollspy="target: > span; cls: uk-animation-slide-bottom-small; delay: 110; repeat: true"
                  >
                    <span data-i18n="services.motionRealtime.word1">Hold</span>
                    <span data-i18n="services.motionRealtime.word2">Shift</span>
                    <span data-i18n="services.motionRealtime.word3">Land</span>
                  </div>
                  <div uk-scrollspy="cls: uk-animation-slide-left-small; delay: 120; repeat: true">
                    <a
                      href="/blog/tsl-changes-everything"
                      class="jlz-service-explore uk-button uk-button-default uk-button-small uk-text-uppercase uk-margin-top uk-flex uk-flex-none uk-flex-inline uk-flex-middle"
                    >
                      <span
                        class="jlz-service-explore__dot uk-display-inline-block"
                        aria-hidden="true"
                      ></span>
                      <span data-i18n="common.explore">Explore</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 04 · AI systems -->
      <section
        class="jlz-page-section uk-section uk-section-small uk-section-large@m"
        id="section-services-aiSystems"
        data-page-section="services-aiSystems"
      >
        <div
          class="uk-container uk-container-expand uk-padding uk-flex uk-flex-column uk-flex-between uk-height-1-1"
        >
          <div class="jlz-section-top uk-text-center uk-flex uk-flex-column uk-flex-middle">
            <span class="jlz-eyebrow uk-display-inline-block" data-eyebrow data-eyebrow-text="04"
              >04</span
            >
            <h2
              class="studio-title uk-heading-large uk-margin-small-top uk-margin-remove-bottom"
              data-i18n="services.aiSystems.title"
            >
              AI systems
            </h2>
            <p class="uk-text-lead uk-margin-small-top" data-i18n="services.aiSystems.lead">
              Use new tools to open options, then bring judgement back to the work.
            </p>
          </div>
          <div class="jlz-section-bottom">
            <div class="jlz-cinematic-shell">
              <div>
                <span aria-hidden="true">></span>
              </div>
              <div>
                <div class="jlz-console-card jlz-service-console jlz-service-console--cta">
                  <div class="jlz-console-card__chrome" aria-hidden="true">
                    <span></span><span></span><span></span>
                    <span class="jlz-console-card__index uk-text-meta uk-text-uppercase"
                      >04 / 04</span
                    >
                  </div>
                  <p
                    class="jlz-service-console__statement uk-text-lead uk-margin-remove"
                    data-i18n="services.aiSystems.statement"
                  >
                    The right workflow creates more room for the decisions that cannot be automated.
                  </p>
                  <a
                    href="mailto:hello@justlovejazz.com?subject=Project%20brief"
                    class="uk-button uk-button-primary uk-margin-medium-top"
                    data-i18n="services.aiSystems.action"
                  >
                    Start a project
                  </a>
                  <p
                    class="jlz-service-console__note uk-text-meta"
                    data-i18n="services.aiSystems.note"
                  >
                    A short brief is enough to begin the conversation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NavMenu mode="content" />
    </article>
  </main>
</template>
