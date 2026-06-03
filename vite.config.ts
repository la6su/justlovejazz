import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { copyFileSync, mkdirSync, readdirSync } from 'fs'

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('three-types') || id.includes('three-stdlib')) return 'vendor-three'
            if (id.includes('troika-three-text')) return 'vendor-troika'
            if (id.includes('uikit') || id.includes('lenis') || id.includes('@studio-freight/lenis')) return 'vendor-ui'
            return 'vendor-misc'
          }
          // Specific chunks (order matters — most specific first)
          if (id.includes('/src/core/PostProcessingManager')) return 'chunk-post'
          if (id.includes('/src/core/AssetManager') || id.includes('/src/core/GPUResourceManager')) return 'chunk-assets'
          if (id.includes('/src/core/IntroSequence')) return 'chunk-intro'
          if (id.includes('/src/core/Section')) return 'chunk-sections'
          if (id.includes('/src/shaders/')) return 'chunk-shaders'
          if (id.includes('/src/Experience/Renderer')) return 'chunk-renderer'
          if (id.includes('/src/Experience/Camera')) return 'chunk-camera'
          if (id.includes('/src/Experience/Cursor')) return 'chunk-cursor'
          if (id.includes('/src/Experience/WebGLText')) return 'chunk-text'
          if (id.includes('/src/Experience/HomeSlider')) return 'chunk-slider'
          if (id.includes('/src/Experience/World/')) return 'chunk-world'
          if (id.includes('/src/core/World')) return 'chunk-core-world'
          if (id.includes('/src/UI/')) return 'chunk-ui'
          if (id.includes('/src/core/')) return 'chunk-core'
          if (id.includes('/src/Experience/')) return 'chunk-experience'
          return undefined
        },
      },
    },
    minify: 'esbuild',
  },
  plugins: [
    {
      name: 'copy-projects',
      closeBundle() {
        const projects = readdirSync(resolve(__dirname, 'projects'))
        mkdirSync(resolve(__dirname, 'dist', 'projects'), { recursive: true })
        projects
          .filter(f => f.endsWith('.html'))
          .forEach(f => copyFileSync(
            resolve(__dirname, 'projects', f),
            resolve(__dirname, 'dist', 'projects', f),
          ))
      },
    },
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
