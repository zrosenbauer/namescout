import { defineConfig } from '@kidd-cli/core'

export default defineConfig({
  build: {
    out: './dist',
    external: [
      'better-sqlite3',
      'sqlite-vec',
      '@xenova/transformers',
      'all-the-package-names',
      'squatter',
      'cmpstr',
    ],
  },
  commands: './src/commands',
  compile: false,
  entry: './src/index.ts',
})
