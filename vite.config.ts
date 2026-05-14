import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        trinity: resolve(__dirname, 'trinity.html'),
        works: resolve(__dirname, 'works.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('three-types')) return 'vendor-three'
            if (id.includes('uikit') || id.includes('lenis')) return 'vendor-ui'
            return 'vendor-misc'
          }
          if (id.includes('/src/UI/')) return 'chunk-ui'
          if (id.includes('/src/Experience/World/') || id.includes('/src/shaders/')) return 'chunk-world'
          if (id.includes('/WebGLText') || id.includes('/WebGLTextManager')) return 'chunk-text'
          if (id.includes('/SceneContentManager')) return 'chunk-content'
        },
      },
    },
    minify: 'esbuild',
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
