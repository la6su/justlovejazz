import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { templateCompilerOptions } from '@tresjs/core'

export default defineConfig({
  plugins: [vue(templateCompilerOptions)],
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
