<script setup lang="ts">
// src/app/views/blog/BlogLayout.vue — Phase 9, slice 4: the shared shell of
// the static blog pages (the SSG content pipeline). One layout for the index
// and the articles; the only variant differences are the secondary nav item
// (the index links back to the landing page, the articles to the 3D app) and
// the footer social row (articles only). Prerender-only: this SFC is rendered
// to static HTML by `scripts/prerender-blog.mjs` and is never mounted by the
// app — the blog documents carry no application JS and load no 3D.
defineProps<{
  variant: 'index' | 'article'
}>()
</script>

<template>
  <div class="jlz-reading-progress" aria-hidden="true">
    <div class="jlz-reading-progress__bar"></div>
  </div>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header class="jlz-blog-header" role="banner">
    <nav
      class="uk-container uk-container-expand uk-navbar uk-navbar-transparent"
      uk-navbar
      aria-label="Main navigation"
    >
      <div class="uk-navbar-left">
        <a href="/" class="uk-navbar-item uk-logo jlz-blog-brand">l@6</a>
      </div>
      <div class="uk-navbar-right">
        <ul class="uk-navbar-nav">
          <li><a href="/blog">Blog</a></li>
          <li v-if="variant === 'index'"><a href="/">Enter studio ↗</a></li>
          <li v-else><a href="/app">Enter 3D →</a></li>
        </ul>
      </div>
    </nav>
  </header>

  <slot />

  <footer class="jlz-blog-footer" role="contentinfo">
    <div class="uk-container uk-container-expand uk-text-center">
      <ul v-if="variant === 'article'" class="uk-iconnav uk-flex-center" aria-label="Social links">
        <li>
          <a
            href="https://github.com/la6su"
            rel="noopener"
            aria-label="GitHub"
            uk-icon="icon: github"
          ></a>
        </li>
        <li>
          <a
            href="https://x.com/justlovejazz"
            rel="noopener"
            aria-label="Twitter"
            uk-icon="icon: twitter"
          ></a>
        </li>
        <li>
          <a href="mailto:hello@justlovejazz.com" aria-label="Email" uk-icon="icon: mail"></a>
        </li>
      </ul>
      <p class="uk-text-meta uk-margin-small-top">
        © <span id="year">2026</span> JUSTLOVEJAZZ — Web Design Studio
      </p>
    </div>
  </footer>
</template>
