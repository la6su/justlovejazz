import { defineConfig } from 'vite'
import { resolve } from 'node:path'

import { copyFileSync, mkdirSync, readdirSync } from 'fs'

export default defineConfig({
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('troika-three-text')) return 'vendor-troika'
            if (id.includes('three') || id.includes('three-types')) return 'vendor-three'
            if (id.includes('uikit') || id.includes('lenis')) return 'vendor-ui'
            return 'vendor-misc'
          }
          if (id.includes('/src/UI/')) return 'chunk-ui'
          if (id.includes('/src/core/') || id.includes('/src/shaders/')) return 'chunk-core'
          if (id.includes('/WebGLText') || id.includes('/WebGLTextManager')) return 'chunk-text'
          if (id.includes('/SceneContentManager')) return 'chunk-content'
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
