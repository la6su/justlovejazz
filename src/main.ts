import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.ts'
import './assets/main.less'
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<!-- HERO -->
<section id="center" class="uk-section uk-section-xlarge uk-section-primary uk-text-center">
  <div class="uk-container">

    <div class="uk-flex uk-flex-center uk-margin-large-bottom">
      <div class="hero uk-position-relative">
        <img src="${heroImg}" class="base" width="170" height="179">

        <img src="${typescriptLogo}" 
             class="framework uk-position-absolute uk-position-top-right" 
             alt="TypeScript logo"/>

        <img src="${viteLogo}" 
             class="vite uk-position-absolute uk-position-bottom-right" 
             alt="Vite logo" />
      </div>
    </div>

    <h1 class="uk-heading-medium">Get started</h1>

    <p class="uk-text-lead">
      Edit <code>src/main.ts</code> and save to test <code>HMR</code>
    </p>

    <button id="counter" 
            type="button" 
            class="uk-button uk-button-primary uk-margin-top">
    </button>

  </div>
</section>

<div class="ticks"></div>

<!-- NEXT STEPS -->
<section id="next-steps" class="uk-section uk-section-default">
  <div class="uk-container">

    <div class="uk-grid-large uk-child-width-1-2@m" uk-grid>

      <!-- DOCS -->
      <div id="docs" class="uk-card uk-card-default uk-card-body uk-border-rounded">
        <div class="uk-flex uk-flex-middle uk-margin-small-bottom">
          <span uk-icon="icon: file-text; ratio: 1.5" class="uk-margin-small-right"></span>
          <h2 class="uk-card-title uk-margin-remove">Documentation</h2>
        </div>

        <p>Your questions, answered</p>

        <ul class="uk-list uk-list-divider">
          <li>
            <a href="https://vite.dev/" target="_blank" class="uk-flex uk-flex-middle">
              <img class="logo uk-margin-small-right" src="${viteLogo}" alt="" width="24">
              Explore Vite
            </a>
          </li>
          <li>
            <a href="https://www.typescriptlang.org" target="_blank" class="uk-flex uk-flex-middle">
              <img class="button-icon uk-margin-small-right" src="${typescriptLogo}" alt="" width="24">
              Learn more
            </a>
          </li>
        </ul>
      </div>

      <!-- SOCIAL -->
      <div id="social" class="uk-card uk-card-default uk-card-body uk-border-rounded">
        <div class="uk-flex uk-flex-middle uk-margin-small-bottom">
          <span uk-icon="icon: users; ratio: 1.5" class="uk-margin-small-right"></span>
          <h2 class="uk-card-title uk-margin-remove">Connect with us</h2>
        </div>

        <p>Join the Vite community</p>

        <ul class="uk-list uk-list-divider">
          <li>
            <a href="https://github.com/vitejs/vite" target="_blank" uk-icon="github">
              GitHub
            </a>
          </li>
          <li>
            <a href="https://chat.vite.dev/" target="_blank" uk-icon="commenting">
              Discord
            </a>
          </li>
          <li>
            <a href="https://x.com/vite_js" target="_blank" uk-icon="twitter">
              X.com
            </a>
          </li>
          <li>
            <a href="https://bsky.app/profile/vite.dev" target="_blank" uk-icon="world">
              Bluesky
            </a>
          </li>
        </ul>
      </div>

    </div>
  </div>
</section>

<div class="ticks"></div>

<section id="spacer" class="uk-section"></section>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
