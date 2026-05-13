import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2023',
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('three-types')) return 'vendor-three'
            if (id.includes('uikit') || id.includes('lenis')) return 'vendor-ui'
            return 'vendor-misc'
          }
          if (id.includes('/src/UI/')) return 'chunk-ui'
          // World entities: Gallery, Baku, Lights, Environment, SectionContent
          if (id.includes('/src/Experience/World/') || id.includes('/src/shaders/')) return 'chunk-world'
          // WebGLText (TSL + postprocessing)
          if (id.includes('/WebGLText') || id.includes('/WebGLTextManager')) return 'chunk-text'
          // Scene content manager (lazy)
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
