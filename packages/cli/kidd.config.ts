import { defineConfig } from '@kidd-cli/core'

export default defineConfig({
  build: {
    external: [
      'better-sqlite3',
      'sqlite-vec',
      '@xenova/transformers',
      'all-the-package-names',
      'squatter',
      'cmpstr',
    ],
    out: './dist',
  },
  commands: './src/commands',
  compile: false,
  entry: './src/index.ts',
})
