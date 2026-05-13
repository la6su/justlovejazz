import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2023',
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three'
            if (id.includes('uikit') || id.includes('lenis') || id.includes('troika')) return 'vendor-ui'
            return 'vendor-misc'
          }
          if (id.includes('/src/UI/')) return 'chunk-ui'
          if (
            id.includes('/src/Experience/World/') ||
            id.includes('/src/shaders/ProjectMaterial') ||
            id.includes('/src/shaders/ProjectMaterialWebGL') ||
            id.includes('/src/shaders/GalleryCardSurface')
          ) {
            return 'chunk-scene'
          }
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
