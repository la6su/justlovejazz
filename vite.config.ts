import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2023',
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@studio-freight/lenis')) {
              return 'vendor';
            }
            return 'external';
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
});
