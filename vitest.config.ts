import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    coverage: {
      include: [
        'app/actions/*.ts',
        'app/ui.tsx',
        'lib/security.ts',
        'lib/validation.ts',
      ],
    },
  },
})
