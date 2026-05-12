import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2023',
    outDir: 'dist',
    cssCodeSplit: true,
    // Vite 8 on rolldown: use oxc transpile instead of deprecated esbuild
    transpile: {
      // Use oxc transformer (default in Vite 8 + rolldown)
      moduleSideEffects: true,
    },
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
