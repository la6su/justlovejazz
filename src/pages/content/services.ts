// Services uses four distinct story beats. The console window is reserved for
// the opening proposition and the final action, not repeated as page furniture.

import {
  sectionShell,
  contentTop,
  storyBottom,
  serviceExplore,
} from '../../sections/_shared/constants'
import { labOverlaySection } from '../../sections/lab-overlay/template'
import { navOverlaySection } from '../../sections/nav/template'

function consoleWindow(index: string, content: string, extraClass = ''): string {
  return `
    <div class="jlz-console-card jlz-service-console ${extraClass}">
      <div class="jlz-console-card__chrome" aria-hidden="true">
        <span></span><span></span><span></span>
        <span class="jlz-console-card__index uk-text-meta uk-text-uppercase">${index} / 04</span>
      </div>
      ${content}
    </div>
  `
}

function creativeDirectionSection(): string {
  return sectionShell(
    'services-creativeDirection',
    contentTop(
      '01',
      'Creative Direction',
      'Find the point of view before the system takes shape.',
      'large',
      'services.creativeDirection.title',
      'services.creativeDirection.lead',
    ),
    storyBottom(
      consoleWindow(
        '01',
        `
          <p class="jlz-service-console__statement uk-text-lead uk-margin-remove" data-i18n="services.creativeDirection.statement">A useful identity gives every later decision a direction.</p>
          ${serviceExplore('/blog/glassmorphism-webgpu', 'common.explore', 'Explore', 'uk-margin-medium-top')}
        `,
      ),
    ),
    'content',
    true,
  )
}

function realtimeSection(): string {
  return sectionShell(
    'services-interactiveDev',
    contentTop(
      '02',
      'Realtime build',
      'The interface wakes exactly when the story moves.',
      'large',
      'services.interactiveDev.title',
      'services.interactiveDev.lead',
    ),
    storyBottom(`
      <div class="jlz-service-runtime">
        <div class="jlz-service-runtime__field" role="img" aria-label="A responsive signal travelling through a realtime scene" uk-scrollspy="cls: uk-animation-scale-up; repeat: true">
          <svg viewBox="0 0 320 180" aria-hidden="true" focusable="false">
            <path class="jlz-service-runtime__trace" d="M8 128C54 128 55 48 102 48s48 84 94 84 43-76 116-76" />
            <path class="jlz-service-runtime__signal" d="M8 128C54 128 55 48 102 48s48 84 94 84 43-76 116-76" />
          </svg>
          <span class="jlz-service-runtime__node jlz-service-runtime__node--start"></span>
          <span class="jlz-service-runtime__node jlz-service-runtime__node--middle"></span>
          <span class="jlz-service-runtime__node jlz-service-runtime__node--end"></span>
        </div>
        <p class="jlz-service-runtime__caption uk-text-meta uk-margin-remove" data-i18n="services.interactiveDev.caption" uk-scrollspy="cls: uk-animation-slide-bottom-small; repeat: true">Render only when there is something to say.</p>
        <div uk-scrollspy="cls: uk-animation-slide-bottom-small; delay: 90; repeat: true">
          ${serviceExplore('/blog/on-demand-rendering', 'common.explore', 'Explore', 'uk-margin-top')}
        </div>
      </div>
    `),
    'content',
  )
}

function motionSection(): string {
  return sectionShell(
    'services-motionRealtime',
    contentTop(
      '03',
      'Motion',
      'Direction, not decoration.',
      'large',
      'services.motionRealtime.title',
      'services.motionRealtime.lead',
    ),
    storyBottom(`
      <div class="jlz-service-motion">
        <div class="jlz-service-motion__words" aria-label="Motion sequence" uk-scrollspy="target: > span; cls: uk-animation-slide-bottom-small; delay: 110; repeat: true">
          <span data-i18n="services.motionRealtime.word1">Hold</span>
          <span data-i18n="services.motionRealtime.word2">Shift</span>
          <span data-i18n="services.motionRealtime.word3">Land</span>
        </div>
        <div uk-scrollspy="cls: uk-animation-slide-left-small; delay: 120; repeat: true">
          ${serviceExplore('/blog/tsl-changes-everything', 'common.explore', 'Explore', 'uk-margin-top')}
        </div>
      </div>
    `),
    'content',
  )
}

function aiSystemsSection(): string {
  return sectionShell(
    'services-aiSystems',
    contentTop(
      '04',
      'AI systems',
      'Use new tools to open options, then bring judgement back to the work.',
      'large',
      'services.aiSystems.title',
      'services.aiSystems.lead',
    ),
    storyBottom(
      consoleWindow(
        '04',
        `
          <p class="jlz-service-console__statement uk-text-lead uk-margin-remove" data-i18n="services.aiSystems.statement">The right workflow creates more room for the decisions that cannot be automated.</p>
          <a href="mailto:hello@justlovejazz.com?subject=Project%20brief" class="uk-button uk-button-primary uk-margin-medium-top" data-i18n="services.aiSystems.action">Start a project</a>
          <p class="jlz-service-console__note uk-text-meta" data-i18n="services.aiSystems.note">A short brief is enough to begin the conversation.</p>
        `,
        'jlz-service-console--cta',
      ),
    ),
    'content',
  )
}

export function servicesPage(): string {
  return `
    <article class="jlz-page jlz-services-page" data-page-view="services">
      ${labOverlaySection('content')}
      ${creativeDirectionSection()}
      ${realtimeSection()}
      ${motionSection()}
      ${aiSystemsSection()}
      ${navOverlaySection('content')}
    </article>
  `
}
