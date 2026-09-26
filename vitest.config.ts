import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Los .spec.ts de e2e/ son de Playwright, no de vitest.
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
})
